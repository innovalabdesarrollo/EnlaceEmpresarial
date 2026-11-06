<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let mail: any = $state(null);
  let sp: any = $state(null);
  let error = $state('');
  let msg = $state('');
  let loading = $state(true);
  let busy = $state(false);

  async function load() {
    const [m, s] = await Promise.all([
      api('/api/contable/mail-status'),
      api('/api/contable/sharepoint/status'),
    ]);
    mail = m;
    sp = s;
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

  async function syncSp() {
    error = '';
    msg = '';
    busy = true;
    try {
      const r = await api<{ ok: boolean; detail?: string; message?: string }>(
        '/api/contable/sharepoint/sync',
        { method: 'POST' }
      );
      msg = r.ok ? 'Sync OK' : r.detail || r.message || 'Sync pendiente de credenciales Graph';
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      busy = false;
    }
  }
</script>

<section class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-[var(--brand-dark)]">Integraciones</h1>
    <p class="text-sm text-[var(--muted)]">
      Correo real (SMTP) y preparación SharePoint. El foco operativo es la automatización de envíos.
    </p>
  </div>

  {#if error}<p class="text-sm text-red-700">{error}</p>{/if}
  {#if msg}<p class="text-sm text-teal-800">{msg}</p>{/if}
  {#if loading}
    <p class="text-sm text-[var(--muted)]">Cargando…</p>
  {:else}
    <div class="rounded-xl border border-[var(--line)] bg-white p-4 space-y-2">
      <h2 class="font-semibold">Correo (SMTP)</h2>
      <p class="text-sm">
        Modo:
        <span class="badge {mail?.configured ? 'badge-ok' : 'badge-warn'}">{mail?.mode}</span>
      </p>
      {#if mail?.configured}
        <p class="text-sm text-[var(--muted)]">Host {mail.host} · From {mail.from}</p>
      {:else}
        <p class="text-sm text-[var(--muted)]">
          Configura SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM y PUBLIC_APP_URL en Vercel.
          Sin eso, los envíos quedan simulados con enlace de confirmación listo.
        </p>
      {/if}
    </div>

    <div class="rounded-xl border border-[var(--line)] bg-white p-4 space-y-3">
      <h2 class="font-semibold">SharePoint</h2>
      <p class="text-sm">{sp?.message}</p>
      <button class="btn btn-primary" type="button" disabled={busy} onclick={syncSp}>
        {busy ? 'Intentando…' : 'Probar sincronización'}
      </button>

      <h3 class="pt-2 text-sm font-semibold">Permisos / accesos a pedir al cliente</h3>
      <ul class="list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
        {#each sp?.permisosRequeridos || [] as p}
          <li><strong>{p.permiso}</strong> ({p.tipo}) — {p.para}</li>
        {/each}
      </ul>
      <ol class="list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
        {#each sp?.pasos || [] as paso}
          <li>{paso}</li>
        {/each}
      </ol>
    </div>
  {/if}
</section>
