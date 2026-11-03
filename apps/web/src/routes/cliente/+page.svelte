<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, downloadFile, estadoBadge, labelEstado } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let docs: any[] = $state([]);
  let error = $state('');
  let loading = $state(true);
  let dlError = $state('');

  onMount(async () => {
    hydrateUser();
    if (!$user) return goto('/login');
    if ($user.rol !== 'cliente') return goto('/contable');
    try {
      await api('/api/auth/me');
      const data = await api<{ documentos: any[] }>('/api/documentos');
      docs = data.documentos;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  async function onDownload(d: any) {
    dlError = '';
    try {
      await downloadFile(d._id, d.nombreArchivo);
    } catch (e: any) {
      dlError = e.message || 'No se pudo descargar';
    }
  }
</script>

{#if $user}
  <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="mb-1 text-2xl font-bold">Mis documentos</h1>
      <p class="text-sm text-[var(--muted)]">Consulta y descarga solo tus archivos.</p>
    </div>
    <a class="btn btn-primary" href="/cliente/subir">Subir documentos</a>
  </div>

  {#if loading}
    <p class="text-sm text-[var(--muted)]">Cargando…</p>
  {:else if error}
    <p class="text-sm text-[var(--danger)]">{error}</p>
  {:else if !docs.length}
    <div class="card-ish p-5 text-sm text-[var(--muted)]">
      Aún no hay documentos.
      <a class="text-[var(--brand)] underline" href="/cliente/subir">Sube el primero</a>.
    </div>
  {:else}
    {#if dlError}
      <p class="mb-3 text-sm text-[var(--danger)]">{dlError}</p>
    {/if}
    <div class="card-ish overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <th class="px-3 py-3 font-semibold">Archivo</th>
            <th class="px-3 py-3 font-semibold">Estado</th>
            <th class="px-3 py-3 font-semibold">Recepción</th>
            <th class="px-3 py-3 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {#each docs as d}
            <tr class="border-t border-[var(--line)]">
              <td class="px-3 py-3 font-medium">{d.nombreArchivo}</td>
              <td class="px-3 py-3">
                <span class="badge {estadoBadge(d.estado)}">{labelEstado(d.estado)}</span>
                {#if d.requiereRevision}
                  <span class="badge badge-warn ml-1">revisión manual</span>
                {/if}
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
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}
