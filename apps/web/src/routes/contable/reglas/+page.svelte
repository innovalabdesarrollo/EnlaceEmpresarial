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
    asuntoPlantilla: '[RFC]_',
    departamento: 'PERSONAS FISICAS / ACT EMPRESARIAL',
    periodicidad: 'MENSUAL',
    descripcion: '',
    prioridad: '50',
    peso: '0.1',
  });
  let edits: Record<string, any> = $state({});
  let editingId = $state<string | null>(null);
  let showCreate = $state(false);
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busy = $state(false);
  let busyId = $state('');

  function keywordsFromCriterio(criterio: string): string[] {
    const raw = String(criterio || '').trim();
    if (!raw) return [];
    return raw
      .split(/[|]+/)
      .map((p) =>
        p
          .replace(/\\s\*/g, ' ')
          .replace(/\\s\+/g, ' ')
          .replace(/[().*?+[\]\\^$]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase()
      )
      .filter(Boolean)
      .flatMap((p) => (p.includes(' ') && p.split(' ').length > 4 ? [p] : p.split(/\s+/)))
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && t !== 'DEL' && t !== 'DE' && t !== 'LOS');
  }

  function uniqKeywords(criterio: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const k of keywordsFromCriterio(criterio)) {
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(k);
      if (out.length >= 6) break;
    }
    return out;
  }

  function badgeDept(departamento: string) {
    const d = (departamento || '').toUpperCase();
    if (d.includes('PERSONAS')) {
      return { label: 'Personas físicas', tone: 'pf' as const };
    }
    if (d.includes('FISCAL') || d.includes('CONTAB') || !d) {
      return { label: 'Contabilidad', tone: 'conta' as const };
    }
    return { label: departamento.slice(0, 28) || 'General', tone: 'conta' as const };
  }

  function reqLabel(tags: string[]) {
    if (tags.length <= 1) return 'Envío de un archivo';
    return `Requiere los ${tags.length} archivos`;
  }

  function tituloAsunto(r: any) {
    const t = String(r.asuntoPlantilla || r.nombre || '').trim();
    return t
      .replace(/\[RFC\]/gi, 'RFC DEL CLIENTE')
      .replace(/\{RFC\}/gi, 'RFC DEL CLIENTE')
      .toUpperCase();
  }

  function periodicidadLabel(p: string) {
    const v = String(p || '').trim();
    if (!v) return 'A solicitud';
    const up = v.toUpperCase();
    if (up === 'MENSUAL') return 'Mensual';
    if (up === 'ANUAL') return 'Anual';
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  }

  async function load() {
    const [data, carps] = await Promise.all([
      api<{ reglas: any[] }>('/api/contable/reglas'),
      api<{ carpetas: any[] }>('/api/contable/carpetas'),
    ]);
    reglas = data.reglas;
    carpetas = carps.carpetas;
    const next: Record<string, any> = {};
    for (const r of reglas) {
      next[r._id] = {
        nombre: r.nombre || '',
        criterio: r.criterio || '',
        carpetaDestino: r.carpetaDestino || 'General',
        asuntoPlantilla: r.asuntoPlantilla || '',
        departamento: r.departamento || '',
        periodicidad: r.periodicidad || '',
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
      showCreate = false;
      form = {
        nombre: '',
        criterio: '',
        carpetaDestino: carpetas[0]?.nombre || 'General',
        asuntoPlantilla: '[RFC]_',
        departamento: 'PERSONAS FISICAS / ACT EMPRESARIAL',
        periodicidad: 'MENSUAL',
        descripcion: '',
        prioridad: '50',
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
      editingId = null;
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    error = '';
    msg = '';
    busyId = id;
    try {
      await api(`/api/contable/reglas/${id}`, { method: 'DELETE' });
      msg = 'Regla eliminada';
      if (editingId === id) editingId = null;
      await load();
    } catch (err: any) {
      error = err.message;
    } finally {
      busyId = '';
    }
  }
</script>

<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="mb-1 text-2xl font-bold text-slate-800">Reglas de envío</h1>
    <p class="text-sm text-slate-500">
      Palabras clave, carpeta y asunto automático por departamento.
    </p>
  </div>
  <button class="btn btn-primary" type="button" onclick={() => (showCreate = !showCreate)}>
    {showCreate ? 'Cerrar' : 'Nueva regla'}
  </button>
</div>

{#if loading}
  <p class="text-sm text-slate-500">Cargando…</p>
{:else}
  {#if msg}<p class="mb-3 text-sm text-emerald-700">{msg}</p>{/if}
  {#if error}<p class="mb-3 text-sm text-red-600">{error}</p>{/if}

  {#if showCreate}
    <div class="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <p class="text-sm font-semibold text-slate-700">Nueva regla</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <input class="input" bind:value={form.nombre} placeholder="Nombre" />
        <input class="input" bind:value={form.criterio} placeholder="Palabras clave (CSF|POSITIVA)" />
        <select class="input" bind:value={form.carpetaDestino}>
          {#each carpetas as c}
            <option value={c.nombre}>{c.nombre}</option>
          {/each}
        </select>
        <input class="input" bind:value={form.asuntoPlantilla} placeholder="Asunto [RFC]_CSF" />
        <input class="input" bind:value={form.departamento} placeholder="Departamento" />
        <input class="input" bind:value={form.periodicidad} placeholder="Periodicidad (MENSUAL)" />
        <input class="input sm:col-span-2" bind:value={form.descripcion} placeholder="Descripción / requisito" />
      </div>
      <button class="btn btn-primary" type="button" disabled={busy} onclick={crear}>Guardar regla</button>
    </div>
  {/if}

  <div class="space-y-3">
    {#each reglas as r}
      {@const tags = uniqKeywords(r.criterio)}
      {@const badge = badgeDept(r.departamento)}
      {@const e = edits[r._id]}
      <article class="regla-card">
        <div class="regla-grid">
          <div class="min-w-0">
            <span class="dept-badge" data-tone={badge.tone}>{badge.label}</span>
            <p class="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              {r.carpetaDestino || '—'}
            </p>
          </div>

          <div class="min-w-0">
            <div class="flex flex-wrap gap-1.5">
              {#each tags.length ? tags : ['—'] as tag}
                <span class="kw-tag">{tag}</span>
              {/each}
            </div>
            <p class="mt-2 text-xs text-slate-400">
              {r.descripcion?.trim() || reqLabel(tags)}
            </p>
          </div>

          <div class="min-w-0">
            <p class="text-sm font-semibold uppercase leading-snug text-slate-700">
              {tituloAsunto(r)}
            </p>
            <p class="mt-1.5 text-xs text-slate-400">
              {periodicidadLabel(r.periodicidad)} — {r.activa ? 'Activa' : 'Inactiva'}
            </p>
          </div>

          <div class="flex flex-wrap items-start justify-end gap-2">
            <button
              class="btn-outline-edit"
              type="button"
              disabled={busyId === r._id}
              onclick={() => (editingId = editingId === r._id ? null : r._id)}
            >
              Editar
            </button>
            <button
              class="btn-outline-del"
              type="button"
              disabled={busyId === r._id}
              onclick={() => eliminar(r._id)}
            >
              Eliminar
            </button>
          </div>
        </div>

        {#if editingId === r._id && e}
          <div class="mt-4 border-t border-slate-100 pt-4 space-y-3">
            <div class="grid gap-2 sm:grid-cols-2">
              <input class="input" bind:value={e.nombre} placeholder="Nombre" />
              <input class="input" bind:value={e.criterio} placeholder="Criterio / keywords" />
              <select class="input" bind:value={e.carpetaDestino}>
                {#each carpetas as c}
                  <option value={c.nombre}>{c.nombre}</option>
                {/each}
                {#if !carpetas.some((c) => c.nombre === e.carpetaDestino)}
                  <option value={e.carpetaDestino}>{e.carpetaDestino}</option>
                {/if}
              </select>
              <input class="input" bind:value={e.asuntoPlantilla} placeholder="Asunto" />
              <input class="input" bind:value={e.departamento} placeholder="Departamento" />
              <input class="input" bind:value={e.periodicidad} placeholder="Periodicidad" />
              <input class="input sm:col-span-2" bind:value={e.descripcion} placeholder="Descripción" />
              <label class="flex items-center gap-2 text-sm text-slate-500 sm:col-span-2">
                <input type="checkbox" bind:checked={e.activa} />
                Activa
              </label>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-primary py-2"
                type="button"
                disabled={busyId === r._id}
                onclick={() => guardar(r._id)}
              >
                Guardar cambios
              </button>
              <button class="btn btn-ghost py-2" type="button" onclick={() => (editingId = null)}>
                Cancelar
              </button>
            </div>
          </div>
        {/if}
      </article>
    {:else}
      <p class="text-sm text-slate-500">Sin reglas. Crea una o ejecuta el seed.</p>
    {/each}
  </div>
{/if}

<style>
  .regla-card {
    border-radius: 12px;
    border: 1px solid #e8edf3;
    background: #fff;
    padding: 1rem 1.15rem;
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .regla-grid {
    display: grid;
    gap: 1rem;
    align-items: start;
  }

  @media (min-width: 900px) {
    .regla-grid {
      grid-template-columns: 9.5rem 1fr 1.35fr auto;
      gap: 1.25rem;
    }
  }

  .dept-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
    padding: 0.2rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .dept-badge[data-tone='conta'] {
    background: #e8f0fe;
    color: #1a56db;
  }

  .dept-badge[data-tone='pf'] {
    background: #fef3c7;
    color: #92400e;
  }

  .kw-tag {
    display: inline-flex;
    align-items: center;
    border-radius: 5px;
    background: #f1f5f9;
    color: #334155;
    padding: 0.22rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .btn-outline-edit,
  .btn-outline-del {
    border-radius: 8px;
    border: 1.5px solid;
    background: #fff;
    padding: 0.4rem 0.9rem;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-outline-edit {
    border-color: #93c5fd;
    color: #1d4ed8;
  }
  .btn-outline-edit:hover {
    background: #eff6ff;
  }

  .btn-outline-del {
    border-color: #fca5a5;
    color: #dc2626;
  }
  .btn-outline-del:hover {
    background: #fef2f2;
  }

  .btn-outline-edit:disabled,
  .btn-outline-del:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
