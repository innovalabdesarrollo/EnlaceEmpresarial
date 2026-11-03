<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, estadoBadge, labelEstado } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let historial: any[] = $state([]);
  let envios: any[] = $state([]);
  let q = $state('');
  let error = $state('');
  let loading = $state(true);

  async function load() {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    const [h, e] = await Promise.all([
      api<{ historial: any[] }>(`/api/documentos/historial${qs}`),
      api<{ envios: any[] }>('/api/notificaciones/envios-cliente'),
    ]);
    historial = h.historial;
    envios = e.envios;
  }

  onMount(async () => {
    hydrateUser();
    if (!$user) return goto('/login');
    if ($user.rol !== 'cliente') return goto('/contable');
    try {
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<h1 class="mb-1 text-2xl font-bold">Historial</h1>
<p class="mb-5 text-sm text-[var(--muted)]">
  Eventos de tus documentos y envíos asociados (fallidos resaltados).
</p>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else if error}
  <p class="text-sm text-[var(--danger)]">{error}</p>
{:else}
  <div class="mb-4 flex flex-wrap gap-2">
    <input class="input max-w-xs" placeholder="Buscar archivo…" bind:value={q} />
    <button class="btn btn-ghost" type="button" onclick={() => load()}>Filtrar</button>
  </div>

  <h2 class="mb-2 font-semibold">Eventos</h2>
  <div class="card-ish mb-8 overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
          <th class="px-3 py-3 font-semibold">Archivo</th>
          <th class="px-3 py-3 font-semibold">Evento</th>
          <th class="px-3 py-3 font-semibold">Estado</th>
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
            <td class="whitespace-nowrap px-3 py-3 text-[var(--muted)]">
              {new Date(h.fechaEvento).toLocaleString('es-MX')}
            </td>
            <td class="px-3 py-3 text-[var(--muted)]">{h.detalle || '—'}</td>
          </tr>
        {:else}
          <tr>
            <td class="px-3 py-3 text-[var(--muted)]" colspan="5">
              Sin eventos aún. Los nuevos depósitos aparecerán aquí.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <h2 class="mb-2 font-semibold">Envíos</h2>
  <div class="card-ish overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
          <th class="px-3 py-3 font-semibold">Documento</th>
          <th class="px-3 py-3 font-semibold">Destinatario</th>
          <th class="px-3 py-3 font-semibold">Estado</th>
          <th class="px-3 py-3 font-semibold">Fecha envío</th>
        </tr>
      </thead>
      <tbody>
        {#each envios as e}
          <tr class="border-t border-[var(--line)]">
            <td class="px-3 py-3">{e.documento?.nombreArchivo || e.documentoId}</td>
            <td class="px-3 py-3">{e.destinatarioEmail || '—'}</td>
            <td class="px-3 py-3">
              <span class="badge {estadoBadge(e.estado)}">{labelEstado(e.estado)}</span>
              {#if e.estado === 'fallido' || e.estado === 'bloqueado'}
                <span class="mt-1 block text-xs text-[var(--danger)]">{e.detalleError}</span>
              {/if}
            </td>
            <td class="px-3 py-3 text-[var(--muted)]">
              {e.fechaEnvio ? new Date(e.fechaEnvio).toLocaleString('es-MX') : '—'}
            </td>
          </tr>
        {:else}
          <tr>
            <td class="px-3 py-3 text-[var(--muted)]" colspan="4">
              Sin envíos todavía (aparecerán cuando contable los prepare).
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
