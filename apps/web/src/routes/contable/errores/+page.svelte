<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, downloadFile } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let errores: any[] = $state([]);
  let clientes: any[] = $state([]);
  let carpetas: any[] = $state([]);
  let assign: Record<string, { clienteId: string; carpeta: string; obs: string }> = $state({});
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busyId = $state('');

  async function load() {
    const [data, carps] = await Promise.all([
      api<{ errores: any[]; clientes: any[] }>('/api/contable/errores'),
      api<{ carpetas: any[] }>('/api/contable/carpetas'),
    ]);
    errores = data.errores;
    clientes = data.clientes;
    carpetas = carps.carpetas;
    const next: typeof assign = {};
    for (const row of errores) {
      next[row.documento._id] = { clienteId: '', carpeta: 'General', obs: '' };
    }
    assign = next;
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

  async function reintentar(id: string) {
    error = '';
    msg = '';
    busyId = id;
    try {
      const res = await api<{ documento: any }>(`/api/contable/errores/${id}/reintentar`, {
        method: 'POST',
      });
      msg = `Reintento: ${res.documento.nombreArchivo} → ${res.documento.estado}`;
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busyId = '';
    }
  }

  async function asignar(id: string) {
    error = '';
    msg = '';
    const a = assign[id];
    if (!a?.clienteId) {
      error = 'Selecciona un cliente';
      return;
    }
    busyId = id;
    try {
      await api(`/api/contable/errores/${id}/asignar`, {
        method: 'POST',
        body: JSON.stringify({
          clienteId: a.clienteId,
          carpetaDestino: a.carpeta,
          observaciones: a.obs,
        }),
      });
      msg = 'Documento asignado manualmente';
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busyId = '';
    }
  }
</script>

<div class="mb-5">
  <h1 class="mb-1 text-2xl font-bold">Errores de procesamiento</h1>
  <p class="text-sm text-[var(--muted)]">Reintentar clasificación o asignar cliente manualmente.</p>
</div>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else}
  {#if msg}<p class="mb-3 text-sm text-[var(--ok)]">{msg}</p>{/if}
  {#if error}<p class="mb-3 text-sm text-[var(--danger)]">{error}</p>{/if}

  <div class="space-y-4">
    {#each errores as row}
      {@const d = row.documento}
      <div class="card-ish space-y-3 p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold">{d.nombreArchivo}</p>
            <p class="text-sm text-[var(--danger)]">{row.causa}</p>
            <p class="mt-1 text-xs text-[var(--muted)]">
              {row.incidencia?.tipo || 'error'} ·
              {new Date(d.creadoEn).toLocaleString('es-MX')}
            </p>
          </div>
          <button
            class="btn btn-ghost text-xs"
            type="button"
            onclick={() => downloadFile(d._id, d.nombreArchivo)}
          >
            Descargar
          </button>
        </div>

        <div class="grid gap-2 sm:grid-cols-3">
          <select class="input" bind:value={assign[d._id].clienteId}>
            <option value="">Asignar cliente…</option>
            {#each clientes as c}
              <option value={c._id}>{c.razonSocial}</option>
            {/each}
          </select>
          <select class="input" bind:value={assign[d._id].carpeta}>
            {#each carpetas as c}
              <option value={c.nombre}>{c.nombre}</option>
            {/each}
          </select>
          <input class="input" bind:value={assign[d._id].obs} placeholder="Observación" />
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-ghost"
            type="button"
            disabled={busyId === d._id}
            onclick={() => reintentar(d._id)}
          >
            Reintentar
          </button>
          <button
            class="btn btn-primary"
            type="button"
            disabled={busyId === d._id}
            onclick={() => asignar(d._id)}
          >
            Asignar
          </button>
        </div>
      </div>
    {:else}
      <p class="text-sm text-[var(--muted)]">Sin errores abiertos.</p>
    {/each}
  </div>
{/if}
