<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, downloadFile, estadoBadge, labelEstado } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let cola: any[] = $state([]);
  let clientes: any[] = $state([]);
  let filtroEstado = $state('');
  let edits: Record<string, { email: string; asunto: string; clienteId: string }> = $state({});
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busyId = $state('');

  function enCola(estado: string) {
    return ['preparado', 'bloqueado', 'pendiente'].includes(estado);
  }

  async function load() {
    const qs = filtroEstado ? `?estado=${encodeURIComponent(filtroEstado)}` : '';
    const [c, cl] = await Promise.all([
      api<{ cola: any[] }>(`/api/contable/cola-envio${qs}`),
      api<{ clientes: any[] }>('/api/contable/clientes'),
    ]);
    cola = c.cola;
    clientes = cl.clientes;
    const next: typeof edits = {};
    for (const row of cola) {
      next[row.envio._id] = {
        email: row.envio.destinatarioEmail || '',
        asunto: row.envio.asunto || '',
        clienteId: row.documento?.clienteId || '',
      };
    }
    edits = next;
  }

  onMount(async () => {
    hydrateUser();
    if (!$user) return goto('/login');
    if ($user.rol !== 'contable') return goto('/cliente');
    try {
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  async function revalidar(id: string) {
    error = '';
    msg = '';
    const e = edits[id];
    busyId = id;
    try {
      const res = await api<{ envio: any }>(`/api/contable/cola-envio/${id}/revalidar`, {
        method: 'POST',
        body: JSON.stringify({
          destinatarioEmail: e?.email,
          asunto: e?.asunto,
          clienteId: e?.clienteId || undefined,
        }),
      });
      msg =
        res.envio.estado === 'bloqueado'
          ? `Sigue bloqueado: ${res.envio.detalleError}`
          : `Validado → ${res.envio.estado}`;
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }

  async function retirar(id: string) {
    error = '';
    msg = '';
    busyId = id;
    try {
      await api(`/api/contable/cola-envio/${id}/retirar`, { method: 'POST' });
      msg = 'Retirado de la cola para corrección';
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }

  async function marcarEnviado(id: string) {
    error = '';
    msg = '';
    busyId = id;
    try {
      const res = await api<{ ok: boolean; envio: any }>(
        `/api/contable/cola-envio/${id}/marcar-enviado`,
        { method: 'POST' }
      );
      msg = res.ok
        ? `Marcado enviado (simulado) → ${res.envio.destinatarioEmail}`
        : `Falló al enviar: ${res.envio.detalleError}`;
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }

  async function marcarFallido(id: string) {
    error = '';
    msg = '';
    busyId = id;
    try {
      await api(`/api/contable/cola-envio/${id}/marcar-fallido`, {
        method: 'POST',
        body: JSON.stringify({ motivo: 'Fallo de envío registrado (sin SMTP)' }),
      });
      msg = 'Marcado como fallido';
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }

  async function reintentar(id: string) {
    error = '';
    msg = '';
    busyId = id;
    try {
      const res = await api<{ ok: boolean; envio: any }>(
        `/api/contable/cola-envio/${id}/reintentar`,
        { method: 'POST' }
      );
      msg = res.ok
        ? `Reintento OK → ${res.envio.estado}`
        : `Reintento sin éxito: ${res.envio.detalleError}`;
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }
</script>

<div class="mb-5">
  <h1 class="mb-1 text-2xl font-bold">Estado de envíos</h1>
  <p class="text-sm text-[var(--muted)]">
    Valida, marca enviado (simulado, sin SMTP) o reintenta fallidos.
  </p>
</div>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else}
  <div class="mb-4">
    <select class="input max-w-xs" bind:value={filtroEstado} onchange={() => load()}>
      <option value="">Todos los estados</option>
      <option value="preparado">preparado</option>
      <option value="pendiente">pendiente</option>
      <option value="enviado">enviado</option>
      <option value="fallido">fallido</option>
      <option value="bloqueado">bloqueado</option>
    </select>
  </div>

  {#if msg}<p class="mb-3 text-sm text-[var(--ok)]">{msg}</p>{/if}
  {#if error}<p class="mb-3 text-sm text-[var(--danger)]">{error}</p>{/if}

  <div class="space-y-4">
    {#each cola as row}
      {@const e = row.envio}
      {@const d = row.documento}
      <div class="card-ish space-y-3 p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold">{d?.nombreArchivo || 'Sin archivo'}</p>
            <p class="text-sm text-[var(--muted)]">
              {row.cliente?.razonSocial || 'Sin cliente'} ·
              {e.destinatarioEmail || 'sin correo'}
            </p>
            <p class="mt-1 text-xs text-[var(--muted)]">
              Prep:
              {e.fechaProgramada
                ? new Date(e.fechaProgramada).toLocaleString('es-MX')
                : '—'}
              · Envío:
              {e.fechaEnvio ? new Date(e.fechaEnvio).toLocaleString('es-MX') : '—'}
            </p>
            {#if e.detalleError}
              <p class="mt-1 text-sm text-[var(--danger)]">{e.detalleError}</p>
            {/if}
            {#if !row.adjuntoOk}
              <p class="mt-1 text-sm text-[var(--danger)]">Adjunto no disponible en disco</p>
            {/if}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge {estadoBadge(e.estado)}">{labelEstado(e.estado)}</span>
            {#if d}
              <button
                class="btn btn-ghost text-xs"
                type="button"
                onclick={() => downloadFile(d._id, d.nombreArchivo)}
              >
                Adjunto
              </button>
            {/if}
          </div>
        </div>

        {#if enCola(e.estado)}
          <div class="grid gap-2 sm:grid-cols-3">
            <select class="input" bind:value={edits[e._id].clienteId}>
              <option value="">Cliente…</option>
              {#each clientes as c}
                <option value={c._id}>{c.razonSocial}</option>
              {/each}
            </select>
            <input class="input" bind:value={edits[e._id].email} placeholder="Destinatario" />
            <input class="input" bind:value={edits[e._id].asunto} placeholder="Asunto" />
          </div>
        {:else if e.asunto}
          <p class="text-sm text-[var(--muted)]">Asunto: {e.asunto}</p>
        {/if}

        <div class="flex flex-wrap gap-2">
          {#if enCola(e.estado)}
            <button
              class="btn btn-ghost"
              type="button"
              disabled={busyId === e._id}
              onclick={() => revalidar(e._id)}
            >
              Revalidar
            </button>
            <button
              class="btn btn-ghost"
              type="button"
              disabled={busyId === e._id}
              onclick={() => retirar(e._id)}
            >
              Retirar
            </button>
          {/if}
          {#if e.estado === 'preparado' || e.estado === 'pendiente'}
            <button
              class="btn btn-primary"
              type="button"
              disabled={busyId === e._id}
              onclick={() => marcarEnviado(e._id)}
            >
              Marcar enviado
            </button>
            <button
              class="btn btn-ghost"
              type="button"
              disabled={busyId === e._id}
              onclick={() => marcarFallido(e._id)}
            >
              Marcar fallido
            </button>
          {/if}
          {#if e.estado === 'fallido' || e.estado === 'bloqueado'}
            <button
              class="btn btn-primary"
              type="button"
              disabled={busyId === e._id}
              onclick={() => reintentar(e._id)}
            >
              Reintentar
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <p class="text-sm text-[var(--muted)]">Sin envíos.</p>
    {/each}
  </div>
{/if}
