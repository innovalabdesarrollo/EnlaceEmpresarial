<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user, hydrateUser } from '#lib/stores';

  /** Mismo criterio que #lib/api: en Vercel mismo origen /api; local → :4710 */
  const apiBase =
    import.meta.env.PUBLIC_API_URL ??
    (import.meta.env.DEV ? 'http://127.0.0.1:4710' : '');

  let status = $state<'loading' | 'ok' | 'error'>('loading');
  let detail = $state('');

  onMount(async () => {
    hydrateUser();
    if ($user?.rol === 'cliente') return goto('/cliente');
    if ($user?.rol === 'contable') return goto('/contable');

    try {
      const res = await fetch(`${apiBase}/api/health`);
      const data = await res.json();
      if (res.ok && data.ok) {
        status = 'ok';
        detail = `API + Mongo OK · DB: ${data.mongo?.db || '—'}`;
      } else {
        status = 'error';
        detail = data.mongo?.state
          ? `API up, Mongo: ${data.mongo.state}`
          : 'API respondió sin OK';
      }
    } catch {
      status = 'error';
      detail = apiBase
        ? `No se pudo contactar ${apiBase}. Arranca pnpm dev:api`
        : 'No se pudo contactar /api/health';
    }
  });
</script>

<section class="mx-auto max-w-lg">
  <h1 class="mb-1 text-2xl font-bold text-[var(--brand-dark)] sm:text-3xl">Estado del sistema</h1>
  <p class="mb-5 text-sm text-[var(--muted)]">Comprueba el stack e inicia sesión para continuar.</p>

  <div class="card-ish mb-4 p-5">
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <span class="font-semibold">Stack</span>
      {#if status === 'loading'}
        <span class="badge badge-info">comprobando</span>
      {:else if status === 'ok'}
        <span class="badge badge-ok">ok</span>
      {:else}
        <span class="badge badge-danger">error</span>
      {/if}
    </div>

    {#if status === 'loading'}
      <p class="text-sm text-[var(--muted)]">Comprobando API…</p>
    {:else if status === 'ok'}
      <p class="text-sm text-[var(--ok)]">{detail}</p>
    {:else}
      <p class="text-sm text-[var(--danger)]">{detail}</p>
    {/if}

    <p class="mt-4 text-xs text-[var(--muted)]">
      Web <code class="rounded bg-slate-100 px-1">5710</code>
      · API <code class="rounded bg-slate-100 px-1">4710</code>
    </p>
  </div>

  <a class="btn btn-primary w-full sm:w-auto" href="/login">Ir a ingresar</a>
</section>
