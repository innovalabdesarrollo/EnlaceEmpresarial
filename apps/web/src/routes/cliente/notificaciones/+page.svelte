<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let items: any[] = $state([]);
  let confirmaciones: any[] = $state([]);
  let error = $state('');
  let loading = $state(true);

  function tipoBadge(tipo: string) {
    if (tipo === 'error') return 'badge-danger';
    if (tipo === 'revision') return 'badge-warn';
    if (tipo === 'recepcion') return 'badge-ok';
    return 'badge-info';
  }

  async function load() {
    const [n, c] = await Promise.all([
      api<{ notificaciones: any[] }>('/api/notificaciones'),
      api<{ confirmaciones: any[] }>('/api/notificaciones/confirmaciones'),
    ]);
    items = n.notificaciones;
    confirmaciones = c.confirmaciones;
  }

  async function markRead(id: string) {
    await api(`/api/notificaciones/${id}/leer`, { method: 'POST' });
    await load();
  }

  onMount(async () => {
    hydrateUser();
    if (!$user) return goto('/login');
    if ($user.rol !== 'cliente') return goto('/contable');
    try {
      await load();
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<h1 class="mb-1 text-2xl font-bold">Avisos y confirmaciones</h1>
<p class="mb-5 text-sm text-[var(--muted)]">
  Recepción, revisiones y errores in-app (sin correo SMTP).
</p>

{#if loading}
  <p class="text-sm text-[var(--muted)]">Cargando…</p>
{:else if error}
  <p class="text-sm text-[var(--danger)]">{error}</p>
{:else}
  <h2 class="mb-2 font-semibold">Avisos</h2>
  <div class="mb-8 space-y-3">
    {#each items as n}
      <div class="card-ish p-4 {n.isRead ? 'opacity-70' : ''}">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <p class="font-semibold">{n.title}</p>
              <span class="badge {tipoBadge(n.notificationType)}">{n.notificationType}</span>
            </div>
            <p class="text-sm text-[var(--muted)]">{n.message}</p>
            {#if n.notificationType === 'error' || n.notificationType === 'revision'}
              <p class="mt-2 text-xs text-[var(--ink)]">
                Canal: usa <a class="text-[var(--brand)] underline" href="/cliente">Mis documentos</a>
                para ver el estado; el despacho resuelve en su bandeja de revisión.
              </p>
            {/if}
            <p class="mt-1 text-xs text-[var(--muted)]">
              {new Date(n.createdAt).toLocaleString('es-MX')}
              {#if n.documentId}
                · doc {n.documentId.slice(0, 8)}
              {/if}
            </p>
          </div>
          {#if !n.isRead}
            <button class="btn btn-ghost py-1 text-xs" type="button" onclick={() => markRead(n._id)}>
              Marcar leída
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <p class="text-sm text-[var(--muted)]">Sin avisos aún.</p>
    {/each}
  </div>

  <h2 class="mb-2 font-semibold">Confirmaciones de recepción</h2>
  <div class="card-ish overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
          <th class="px-3 py-3 font-semibold">Documento</th>
          <th class="px-3 py-3 font-semibold">Ref</th>
          <th class="px-3 py-3 font-semibold">Estado</th>
          <th class="px-3 py-3 font-semibold">Fecha</th>
        </tr>
      </thead>
      <tbody>
        {#each confirmaciones as c}
          <tr class="border-t border-[var(--line)]">
            <td class="px-3 py-3 font-medium">{c.documentName}</td>
            <td class="px-3 py-3">{c.referenceCode}</td>
            <td class="px-3 py-3"><span class="badge badge-ok">{c.confirmationStatus}</span></td>
            <td class="whitespace-nowrap px-3 py-3 text-[var(--muted)]">
              {new Date(c.receivedAt).toLocaleString('es-MX')}
            </td>
          </tr>
        {:else}
          <tr>
            <td class="px-3 py-3 text-[var(--muted)]" colspan="4">Sin confirmaciones</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
