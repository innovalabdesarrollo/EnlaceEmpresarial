<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let clientes: any[] = $state([]);
  let incluirBaja = $state(false);
  let form = $state({
    razonSocial: '',
    identificadorFiscal: '',
    emailNotificaciones: '',
    telefono: '',
    departamento: 'PERSONAS FISICAS / ACT EMPRESARIAL',
    sharePointPath: '',
    crearCuenta: false,
    password: '',
  });
  let edits: Record<string, any> = $state({});
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busy = $state(false);
  let busyId = $state('');

  async function load() {
    const qs = incluirBaja ? '?incluirBaja=1' : '';
    const data = await api<{ clientes: any[] }>(`/api/contable/clientes${qs}`);
    clientes = data.clientes;
    const next: Record<string, any> = {};
    for (const c of clientes) {
      next[c._id] = {
        razonSocial: c.razonSocial || '',
        identificadorFiscal: c.identificadorFiscal || '',
        emailNotificaciones: c.emailNotificaciones || '',
        telefono: c.telefono || '',
        departamento: c.departamento || '',
        sharePointPath: c.sharePointPath || '',
        estado: c.estado || 'activo',
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
      await api('/api/contable/clientes', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      msg = 'Cliente registrado';
      form = {
        razonSocial: '',
        identificadorFiscal: '',
        emailNotificaciones: '',
        telefono: '',
        departamento: 'PERSONAS FISICAS / ACT EMPRESARIAL',
        sharePointPath: '',
        crearCuenta: false,
        password: '',
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
    busyId = id;
    try {
      await api(`/api/contable/clientes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(edits[id]),
      });
      msg = 'Cliente actualizado';
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busyId = '';
    }
  }

  async function baja(id: string) {
    error = '';
    msg = '';
    busyId = id;
    try {
      await api(`/api/contable/clientes/${id}`, { method: 'DELETE' });
      msg = 'Cliente dado de baja';
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busyId = '';
    }
  }
</script>

<section class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-[var(--brand-dark)]">Clientes</h1>
    <p class="text-sm text-[var(--muted)]">
      Alta, baja y edición (incluye email de envío de archivos).
    </p>
  </div>

  {#if error}<p class="text-sm text-red-700">{error}</p>{/if}
  {#if msg}<p class="text-sm text-teal-800">{msg}</p>{/if}

  <div class="rounded-xl border border-[var(--line)] bg-white p-4 space-y-3">
    <h2 class="font-semibold">Registrar cliente</h2>
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="text-sm">
        Razón social
        <input class="input mt-1 w-full" bind:value={form.razonSocial} />
      </label>
      <label class="text-sm">
        RFC
        <input class="input mt-1 w-full" bind:value={form.identificadorFiscal} />
      </label>
      <label class="text-sm">
        Email envío de archivos
        <input class="input mt-1 w-full" type="email" bind:value={form.emailNotificaciones} />
      </label>
      <label class="text-sm">
        Teléfono
        <input class="input mt-1 w-full" bind:value={form.telefono} />
      </label>
      <label class="text-sm sm:col-span-2">
        Departamento
        <input class="input mt-1 w-full" bind:value={form.departamento} />
      </label>
      <label class="text-sm sm:col-span-2">
        Ruta SharePoint (opcional)
        <input class="input mt-1 w-full" bind:value={form.sharePointPath} placeholder="PERSONAS FISICAS/ACT EMPRESARIAL/RFC_NOMBRE" />
      </label>
      <label class="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" bind:checked={form.crearCuenta} />
        Crear cuenta de acceso (login) con el mismo email
      </label>
      {#if form.crearCuenta}
        <label class="text-sm">
          Contraseña inicial
          <input class="input mt-1 w-full" type="password" bind:value={form.password} />
        </label>
      {/if}
    </div>
    <button class="btn btn-primary" type="button" disabled={busy} onclick={crear}>
      {busy ? 'Guardando…' : 'Registrar'}
    </button>
  </div>

  <label class="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      bind:checked={incluirBaja}
      onchange={() => load().catch((e) => (error = e.message))}
    />
    Mostrar dados de baja
  </label>

  {#if loading}
    <p class="text-sm text-[var(--muted)]">Cargando…</p>
  {:else if !clientes.length}
    <p class="text-sm text-[var(--muted)]">Sin clientes.</p>
  {:else}
    <ul class="space-y-4">
      {#each clientes as c}
        {@const e = edits[c._id]}
        <li class="rounded-xl border border-[var(--line)] bg-white p-4 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold">{c.razonSocial}</span>
            <span class="badge {c.estado === 'activo' ? 'badge-ok' : 'badge-danger'}">{c.estado}</span>
          </div>
          {#if e}
            <div class="grid gap-2 sm:grid-cols-2">
              <input class="input" placeholder="Razón social" bind:value={e.razonSocial} />
              <input class="input" placeholder="RFC" bind:value={e.identificadorFiscal} />
              <input class="input" type="email" placeholder="Email envío" bind:value={e.emailNotificaciones} />
              <input class="input" placeholder="Teléfono" bind:value={e.telefono} />
              <input class="input sm:col-span-2" placeholder="Departamento" bind:value={e.departamento} />
              <input class="input sm:col-span-2" placeholder="SharePoint path" bind:value={e.sharePointPath} />
              <select class="input" bind:value={e.estado}>
                <option value="activo">activo</option>
                <option value="baja">baja</option>
              </select>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-primary py-1.5"
                type="button"
                disabled={busyId === c._id}
                onclick={() => guardar(c._id)}
              >
                Guardar
              </button>
              {#if c.estado !== 'baja'}
                <button
                  class="btn btn-ghost py-1.5"
                  type="button"
                  disabled={busyId === c._id}
                  onclick={() => baja(c._id)}
                >
                  Dar de baja
                </button>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
