<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import favicon from '#lib/assets/favicon.svg';
  import { clearSession } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  onMount(() => {
    hydrateUser();
  });

  function logout() {
    clearSession();
    user.set(null);
    goto('/login');
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Enlace Empresarial</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
  <header class="sticky top-0 z-20 border-b border-[var(--line)] bg-white/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <a href="/" class="text-lg font-bold tracking-tight text-[var(--brand-dark)]">
        Enlace Empresarial
      </a>

      {#if $user}
        <nav class="flex flex-wrap items-center gap-1 text-sm">
          <a
            class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
            href={$user.rol === 'contable' ? '/contable' : '/cliente'}
          >
            Inicio
          </a>
          {#if $user.rol === 'cliente'}
            <a class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100" href="/cliente/subir">
              Subir
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/cliente/historial"
            >
              Historial
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/cliente/notificaciones"
            >
              Avisos
            </a>
          {:else if $user.rol === 'contable'}
            <a class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100" href="/contable">
              Clasificados
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/revisiones"
            >
              Revisiones
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/historial"
            >
              Historial
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/errores"
            >
              Errores
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/envios"
            >
              Envíos
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/observaciones"
            >
              Observaciones
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/reglas"
            >
              Reglas
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/clientes"
            >
              Clientes
            </a>
            <a
              class="rounded-lg px-2.5 py-1.5 text-[var(--muted)] hover:bg-slate-100"
              href="/contable/integraciones"
            >
              Integraciones
            </a>
          {/if}
          <span class="hidden text-[var(--muted)] sm:inline">{$user.nombre}</span>
          <span class="badge badge-info">{$user.rol}</span>
          <button class="btn btn-ghost py-1.5" type="button" onclick={logout}>Salir</button>
        </nav>
      {:else}
        <a class="btn btn-primary py-1.5" href="/login">Ingresar</a>
      {/if}
    </div>
  </header>

  <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
    {@render children()}
  </main>

  <footer class="border-t border-[var(--line)] py-4 text-center text-xs text-[var(--muted)]">
    Enlace Empresarial · Innovalab
  </footer>
</div>
