<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, downloadFile, estadoBadge, labelEstado } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let docs: any[] = $state([]);
  let clientes: any[] = $state([]);
  let clienteId = $state('');
  let estado = $state('');
  let selected: Record<string, boolean> = $state({});
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busy = $state(false);

  async function load() {
    const params = new URLSearchParams();
    if (clienteId) params.set('clienteId', clienteId);
    if (estado) params.set('estado', estado);
    const qs = params.toString() ? `?${params}` : '';
    const [d, c] = await Promise.all([
      api<{ documentos: any[] }>(`/api/contable/clasificados${qs}`),
      api<{ clientes: any[] }>('/api/contable/clientes'),
    ]);
    docs = d.documentos;
    clientes = c.clientes;
    selected = {};
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

  async function onDownload(d: any) {
    error = '';
    try {
      await downloadFile(d._id, d.nombreArchivo);
    } catch (e: any) {
      error = e.message || 'No se pudo descargar';
    }
  }

  async function marcarEnvio() {
    error = '';
    msg = '';
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) {
      error = 'Selecciona al menos un documento';
      return;
    }
    busy = true;
    try {
      const res = await api<{ resultados: any[] }>('/api/contable/listo-envio', {
        method: 'POST',
        body: JSON.stringify({ documentoIds: ids }),
      });
      const prep = res.resultados.filter((r) => r.envio?.estado === 'preparado').length;
      const bloq = res.resultados.filter((r) => r.envio?.estado === 'bloqueado').length;
      msg = `Cola actualizada: ${prep} preparado(s), ${bloq} bloqueado(s). Revisa en Envíos.`;
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busy = false;
    }
  }
</script>

<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="mb-1 text-2xl font-bold">Documentos clasificados</h1>
    <p class="text-sm text-[var(--muted)]">Filtra y marca listos para envío.</p>
  </div>
  <button class="btn btn-primary" type="button" disabled={busy} onclick={marcarEnvio}>
    Marcar listo para envío
  </button>
</div>

<div class="mb-4 flex flex-wrap gap-2">
  <select class="input max-w-xs" bind:value={clienteId} onchange={() => load()}>
    <option value="">Todos los clientes</option>
    {#each clientes as c}
      <option value={c._id}>{c.razonSocial}</option>
    {/each}
  </select>
  <select class="input max-w-xs" bind:value={estado} onchange={() => load()}>
    <option value="">Todos los estados</option>
    <option value="clasificado">clasificado</option>
    <option value="en_revision">en revisión</option>
    <option value="procesado">procesado</option>
    <option value="listo_envio">listo envío</option>
    <option value="enviado">enviado</option>
  </select>
</div>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else}
  {#if msg}<p class="mb-3 text-sm text-[var(--ok)]">{msg}</p>{/if}
  {#if error}<p class="mb-3 text-sm text-[var(--danger)]">{error}</p>{/if}

  <div class="card-ish overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
          <th class="px-3 py-3 font-semibold"></th>
          <th class="px-3 py-3 font-semibold">Archivo</th>
          <th class="px-3 py-3 font-semibold">Cliente</th>
          <th class="px-3 py-3 font-semibold">Carpeta</th>
          <th class="px-3 py-3 font-semibold">Confianza</th>
          <th class="px-3 py-3 font-semibold">Estado</th>
          <th class="px-3 py-3 font-semibold">Fecha</th>
          <th class="px-3 py-3 font-semibold"></th>
        </tr>
      </thead>
      <tbody>
        {#each docs as d}
          <tr class="border-t border-[var(--line)]">
            <td class="px-3 py-3">
              <input type="checkbox" bind:checked={selected[d._id]} />
            </td>
            <td class="px-3 py-3 font-medium">{d.nombreArchivo}</td>
            <td class="px-3 py-3">{d.cliente?.razonSocial || '—'}</td>
            <td class="px-3 py-3">{d.carpetaDestino || d.clasificacion?.carpetaDestino || '—'}</td>
            <td class="px-3 py-3">
              {d.clasificacion?.nivelConfianza != null
                ? `${(d.clasificacion.nivelConfianza * 100).toFixed(0)}%`
                : '—'}
            </td>
            <td class="px-3 py-3">
              <span class="badge {estadoBadge(d.estado)}">{labelEstado(d.estado)}</span>
            </td>
            <td class="whitespace-nowrap px-3 py-3 text-[var(--muted)]">
              {new Date(d.creadoEn).toLocaleString('es-MX')}
            </td>
            <td class="px-3 py-3">
              <button class="btn btn-ghost py-1 text-xs" type="button" onclick={() => onDownload(d)}>
                Descargar
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td class="px-3 py-3 text-[var(--muted)]" colspan="8">Sin documentos clasificados</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
