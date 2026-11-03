<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, estadoBadge, labelEstado } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let historial: any[] = $state([]);
  let q = $state('');
  let tipoEvento = $state('');
  let error = $state('');
  let loading = $state(true);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tipoEvento) params.set('tipoEvento', tipoEvento);
    const qs = params.toString() ? `?${params}` : '';
    const data = await api<{ historial: any[] }>(`/api/contable/historial${qs}`);
    historial = data.historial;
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
</script>

<div class="mb-5">
  <h1 class="mb-1 text-2xl font-bold">Historial de procesamiento</h1>
  <p class="text-sm text-[var(--muted)]">
    Recepción, clasificación, revisión, descargas y errores.
  </p>
</div>

<div class="mb-4 flex flex-wrap gap-2">
  <input class="input max-w-xs" placeholder="Buscar archivo, actor o detalle…" bind:value={q} />
  <select class="input max-w-xs" bind:value={tipoEvento}>
    <option value="">Todos los eventos</option>
    <option value="recepcion">recepcion</option>
    <option value="clasificacion">clasificacion</option>
    <option value="revision">revision</option>
    <option value="descarga">descarga</option>
    <option value="correccion">correccion</option>
    <option value="envio">envio</option>
  </select>
  <button class="btn btn-ghost" type="button" onclick={() => load()}>Buscar</button>
</div>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else if error}
  <p class="text-sm text-[var(--danger)]">{error}</p>
{:else}
  <div class="card-ish overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
          <th class="px-3 py-3 font-semibold">Archivo</th>
          <th class="px-3 py-3 font-semibold">Evento</th>
          <th class="px-3 py-3 font-semibold">Estado</th>
          <th class="px-3 py-3 font-semibold">Actor</th>
          <th class="px-3 py-3 font-semibold">Fecha</th>
          <th class="px-3 py-3 font-semibold">Detalle</th>
        </tr>
      </thead>
      <tbody>
        {#each historial as h}
          <tr class="border-t border-[var(--line)]">
            <td class="px-3 py-3 font-medium">{h.nombreArchivo}</td>
            <td class="px-3 py-3">{h.tipoEvento}</td>
            <td class="px-3 py-3">
              <span class="badge {estadoBadge(h.estado)}">{labelEstado(h.estado)}</span>
            </td>
            <td class="px-3 py-3 text-[var(--muted)]">{h.actor}</td>
            <td class="whitespace-nowrap px-3 py-3 text-[var(--muted)]">
              {new Date(h.fechaEvento).toLocaleString('es-MX')}
            </td>
            <td class="max-w-xs px-3 py-3 text-[var(--muted)]">{h.detalle || '—'}</td>
          </tr>
        {:else}
          <tr>
            <td class="px-3 py-3 text-[var(--muted)]" colspan="6">Sin historial</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
