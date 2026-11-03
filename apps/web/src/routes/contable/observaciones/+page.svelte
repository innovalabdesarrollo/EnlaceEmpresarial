<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let observaciones: any[] = $state([]);
  let documentos: any[] = $state([]);
  let filtroDoc = $state('');
  let form = $state({ documentoId: '', tipo: 'revision', comentario: '' });
  let editing: Record<string, { comentario: string; tipo: string; resuelta: boolean }> = $state({});
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busy = $state(false);
  let busyId = $state('');

  async function load() {
    const qs = filtroDoc ? `?documentoId=${encodeURIComponent(filtroDoc)}` : '';
    const [o, d] = await Promise.all([
      api<{ observaciones: any[] }>(`/api/contable/observaciones${qs}`),
      api<{ documentos: any[] }>('/api/contable/clasificados'),
    ]);
    observaciones = o.observaciones;
    documentos = d.documentos;
    const next: typeof editing = {};
    for (const row of observaciones) {
      next[row._id] = {
        comentario: row.comentario || '',
        tipo: row.tipo || 'revision',
        resuelta: Boolean(row.resuelta),
      };
    }
    editing = next;
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

  async function crear() {
    error = '';
    msg = '';
    if (!form.documentoId) {
      error = 'Selecciona un documento';
      return;
    }
    if (!form.comentario.trim()) {
      error = 'Escribe un comentario';
      return;
    }
    busy = true;
    try {
      await api('/api/contable/observaciones', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      msg = 'Observación registrada';
      form = { ...form, comentario: '' };
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busy = false;
    }
  }

  async function guardar(id: string) {
    error = '';
    msg = '';
    const e = editing[id];
    busyId = id;
    try {
      await api(`/api/contable/observaciones/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(e),
      });
      msg = 'Observación actualizada';
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }
</script>

<div class="mb-5">
  <h1 class="mb-1 text-2xl font-bold">Observaciones de revisión</h1>
  <p class="text-sm text-[var(--muted)]">
    Agrega, edita y consulta comentarios con fecha y autor.
  </p>
</div>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else}
  {#if msg}<p class="mb-3 text-sm text-[var(--ok)]">{msg}</p>{/if}
  {#if error}<p class="mb-3 text-sm text-[var(--danger)]">{error}</p>{/if}

  <div class="card-ish mb-6 space-y-3 p-4">
    <p class="text-sm font-medium">Nueva observación</p>
    <div class="grid gap-2 sm:grid-cols-3">
      <select class="input" bind:value={form.documentoId}>
        <option value="">Documento…</option>
        {#each documentos as d}
          <option value={d._id}>{d.nombreArchivo}</option>
        {/each}
      </select>
      <select class="input" bind:value={form.tipo}>
        <option value="revision">revisión</option>
        <option value="correccion">corrección</option>
        <option value="incidencia">incidencia</option>
        <option value="envio">envío</option>
      </select>
      <input class="input" bind:value={form.comentario} placeholder="Comentario" />
    </div>
    <button class="btn btn-primary" type="button" disabled={busy} onclick={crear}>Guardar</button>
  </div>

  <div class="mb-4">
    <select class="input max-w-md" bind:value={filtroDoc} onchange={() => load()}>
      <option value="">Todos los documentos</option>
      {#each documentos as d}
        <option value={d._id}>{d.nombreArchivo}</option>
      {/each}
    </select>
  </div>

  <div class="space-y-4">
    {#each observaciones as o}
      <div class="card-ish space-y-3 p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold">{o.documento?.nombreArchivo || o.documentId}</p>
            <p class="text-xs text-[var(--muted)]">
              {o.autor} · {new Date(o.creadoEn).toLocaleString('es-MX')}
              {#if o.actualizadoEn}
                · editado {new Date(o.actualizadoEn).toLocaleString('es-MX')}
              {/if}
            </p>
          </div>
          <span class="badge badge-info">{o.tipo}</span>
        </div>

        <div class="grid gap-2 sm:grid-cols-3">
          <select class="input" bind:value={editing[o._id].tipo}>
            <option value="revision">revisión</option>
            <option value="correccion">corrección</option>
            <option value="incidencia">incidencia</option>
            <option value="envio">envío</option>
          </select>
          <input class="input sm:col-span-2" bind:value={editing[o._id].comentario} />
        </div>

        <label class="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input type="checkbox" bind:checked={editing[o._id].resuelta} />
          Resuelta
        </label>

        <button
          class="btn btn-ghost"
          type="button"
          disabled={busyId === o._id}
          onclick={() => guardar(o._id)}
        >
          Actualizar
        </button>
      </div>
    {:else}
      <p class="text-sm text-[var(--muted)]">Sin observaciones.</p>
    {/each}
  </div>
{/if}
