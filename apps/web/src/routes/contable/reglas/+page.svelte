<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let reglas: any[] = $state([]);
  let carpetas: any[] = $state([]);
  let form = $state({
    nombre: '',
    criterio: '',
    carpetaDestino: 'General',
    descripcion: '',
    prioridad: '100',
    peso: '0.1',
  });
  let edits: Record<
    string,
    {
      nombre: string;
      criterio: string;
      carpetaDestino: string;
      descripcion: string;
      prioridad: string;
      peso: string;
      activa: boolean;
    }
  > = $state({});
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busy = $state(false);
  let busyId = $state('');

  async function load() {
    const [data, carps] = await Promise.all([
      api<{ reglas: any[] }>('/api/contable/reglas'),
      api<{ carpetas: any[] }>('/api/contable/carpetas'),
    ]);
    reglas = data.reglas;
    carpetas = carps.carpetas;
    const next: typeof edits = {};
    for (const r of reglas) {
      next[r._id] = {
        nombre: r.nombre || '',
        criterio: r.criterio || '',
        carpetaDestino: r.carpetaDestino || 'General',
        descripcion: r.descripcion || '',
        prioridad: String(r.prioridad ?? 100),
        peso: String(r.peso ?? 0.1),
        activa: Boolean(r.activa),
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

  async function crear() {
    error = '';
    msg = '';
    busy = true;
    try {
      await api('/api/contable/reglas', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          prioridad: Number(form.prioridad),
          peso: Number(form.peso),
        }),
      });
      msg = 'Regla creada';
      form = {
        nombre: '',
        criterio: '',
        carpetaDestino: 'General',
        descripcion: '',
        prioridad: '100',
        peso: '0.1',
      };
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
    const e = edits[id];
    busyId = id;
    try {
      await api(`/api/contable/reglas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...e,
          prioridad: Number(e.prioridad),
          peso: Number(e.peso),
        }),
      });
      msg = 'Regla actualizada';
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }
</script>

<div class="mb-5">
  <h1 class="mb-1 text-2xl font-bold">Reglas de clasificación</h1>
  <p class="text-sm text-[var(--muted)]">
    Patrones sobre el nombre de archivo → carpeta (sin IA; umbral en
    <code>CONFIDENCE_THRESHOLD</code>).
  </p>
</div>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else}
  {#if msg}<p class="mb-3 text-sm text-[var(--ok)]">{msg}</p>{/if}
  {#if error}<p class="mb-3 text-sm text-[var(--danger)]">{error}</p>{/if}

  <div class="card-ish mb-6 space-y-3 p-4">
    <p class="text-sm font-medium">Nueva regla</p>
    <div class="grid gap-2 sm:grid-cols-2">
      <input class="input" bind:value={form.nombre} placeholder="Nombre" />
      <input class="input" bind:value={form.criterio} placeholder="Criterio (regex o texto)" />
      <select class="input" bind:value={form.carpetaDestino}>
        {#each carpetas as c}
          <option value={c.nombre}>{c.nombre}</option>
        {/each}
      </select>
      <input class="input" bind:value={form.descripcion} placeholder="Descripción" />
      <input class="input" bind:value={form.prioridad} placeholder="Prioridad (menor = primero)" />
      <input class="input" bind:value={form.peso} placeholder="Peso confianza" />
    </div>
    <button class="btn btn-primary" type="button" disabled={busy} onclick={crear}>Crear</button>
  </div>

  <div class="space-y-4">
    {#each reglas as r}
      <div class="card-ish space-y-3 p-4">
        <div class="grid gap-2 sm:grid-cols-2">
          <input class="input" bind:value={edits[r._id].nombre} />
          <input class="input" bind:value={edits[r._id].criterio} />
          <select class="input" bind:value={edits[r._id].carpetaDestino}>
            {#each carpetas as c}
              <option value={c.nombre}>{c.nombre}</option>
            {/each}
          </select>
          <input class="input" bind:value={edits[r._id].descripcion} />
          <input class="input" bind:value={edits[r._id].prioridad} />
          <input class="input" bind:value={edits[r._id].peso} />
        </div>
        <label class="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input type="checkbox" bind:checked={edits[r._id].activa} />
          Activa
        </label>
        <button
          class="btn btn-ghost"
          type="button"
          disabled={busyId === r._id}
          onclick={() => guardar(r._id)}
        >
          Guardar
        </button>
      </div>
    {:else}
      <p class="text-sm text-[var(--muted)]">Sin reglas. Ejecuta el seed o crea una.</p>
    {/each}
  </div>
{/if}
