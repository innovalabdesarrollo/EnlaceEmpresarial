<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, downloadFile } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let items: any[] = $state([]);
  let clientes: any[] = $state([]);
  let carpetas: any[] = $state([]);
  let forms: Record<string, { clienteId: string; carpeta: string; obs: string }> = $state({});
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busyId = $state('');

  async function load() {
    const [data, carps] = await Promise.all([
      api<{ items: any[]; clientes: any[] }>('/api/contable/revisiones'),
      api<{ carpetas: any[] }>('/api/contable/carpetas'),
    ]);
    items = data.items;
    clientes = data.clientes;
    carpetas = carps.carpetas;
    const next: typeof forms = {};
    for (const it of items) {
      next[it.documento._id] = {
        clienteId: it.documento.clienteId || '',
        carpeta: it.clasificacion?.carpetaDestino || 'General',
        obs: '',
      };
    }
    forms = next;
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

  async function confirmar(id: string) {
    error = '';
    msg = '';
    busyId = id;
    try {
      await api(`/api/contable/revisiones/${id}`, {
        method: 'POST',
        body: JSON.stringify({
          confirmar: true,
          observaciones: forms[id]?.obs || '',
        }),
      });
      msg = 'Clasificación confirmada';
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busyId = '';
    }
  }

  async function corregir(id: string) {
    error = '';
    msg = '';
    const f = forms[id];
    if (!f?.clienteId) {
      error = 'Selecciona un cliente para corregir';
      return;
    }
    busyId = id;
    try {
      await api(`/api/contable/revisiones/${id}`, {
        method: 'POST',
        body: JSON.stringify({
          confirmar: false,
          clienteId: f.clienteId,
          carpetaDestino: f.carpeta,
          observaciones: f.obs,
        }),
      });
      msg = 'Clasificación corregida';
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busyId = '';
    }
  }

  async function onDownload(doc: any) {
    try {
      await downloadFile(doc._id, doc.nombreArchivo);
    } catch (e: any) {
      error = e.message || 'No se pudo descargar';
    }
  }
</script>

<div class="mb-5">
  <h1 class="mb-1 text-2xl font-bold">Revisión manual</h1>
  <p class="text-sm text-[var(--muted)]">
    Confirma la sugerencia o asigna otro cliente y carpeta.
  </p>
</div>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else}
  {#if msg}<p class="mb-3 text-sm text-[var(--ok)]">{msg}</p>{/if}
  {#if error}<p class="mb-3 text-sm text-[var(--danger)]">{error}</p>{/if}

  <div class="space-y-4">
    {#each items as it}
      {@const id = it.documento._id}
      <div class="card-ish space-y-3 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-semibold">{it.documento.nombreArchivo}</p>
            <p class="mt-1 text-sm text-[var(--muted)]">
              Sugerido: {it.clienteSugerido?.razonSocial || '—'} /
              {it.clasificacion?.carpetaDestino || '—'} · confianza
              {it.clasificacion?.nivelConfianza != null
                ? `${(it.clasificacion.nivelConfianza * 100).toFixed(0)}%`
                : '—'}
            </p>
            <p class="mt-1 text-xs text-[var(--muted)]">
              {it.clasificacion?.observaciones || 'Sin detalle'}
            </p>
          </div>
          <button class="btn btn-ghost text-xs" type="button" onclick={() => onDownload(it.documento)}>
            Descargar
          </button>
        </div>

        <div class="grid gap-2 sm:grid-cols-3">
          <select class="input" bind:value={forms[id].clienteId}>
            <option value="">Cliente…</option>
            {#each clientes as c}
              <option value={c._id}>{c.razonSocial}</option>
            {/each}
          </select>
          <select class="input" bind:value={forms[id].carpeta}>
            {#each carpetas as c}
              <option value={c.nombre}>{c.nombre}</option>
            {/each}
          </select>
          <input class="input" placeholder="Observación (opcional)" bind:value={forms[id].obs} />
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-primary"
            type="button"
            disabled={busyId === id || !it.documento.clienteId}
            onclick={() => confirmar(id)}
          >
            Confirmar sugerencia
          </button>
          <button
            class="btn btn-ghost"
            type="button"
            disabled={busyId === id}
            onclick={() => corregir(id)}
          >
            Corregir y guardar
          </button>
        </div>
        {#if !it.documento.clienteId}
          <p class="text-xs text-[var(--warn)]">
            Sin cliente sugerido: usa Corregir y guardar.
          </p>
        {/if}
      </div>
    {:else}
      <p class="text-sm text-[var(--muted)]">No hay documentos pendientes de revisión.</p>
    {/each}
  </div>
{/if}
