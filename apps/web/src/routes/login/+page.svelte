<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api, saveSession } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let email = $state('cliente@demo.local');
  let password = $state('cliente123');
  let error = $state('');
  let loading = $state(false);

  onMount(() => {
    hydrateUser();
    if ($user?.rol === 'cliente') goto('/cliente');
    else if ($user?.rol === 'contable') goto('/contable');
  });

  async function entrar() {
    error = '';
    loading = true;
    try {
      const data = await api<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveSession(data.token, data.user);
      user.set(data.user);
      await goto(data.user.rol === 'contable' ? '/contable' : '/cliente');
    } catch (err: any) {
      error = err.message || 'Error de acceso';
    } finally {
      loading = false;
    }
  }
</script>

<div class="mx-auto mt-4 max-w-md sm:mt-10">
  <div class="card-ish p-6 sm:p-8">
    <h1 class="mb-1 text-2xl font-bold text-[var(--brand-dark)]">Ingresar</h1>
    <p class="mb-6 text-sm text-[var(--muted)]">Email y contraseña. Sin Google.</p>

    <div class="space-y-4">
      <label class="block text-sm">
        <span class="font-medium">Email</span>
        <input
          class="input mt-1"
          name="email"
          type="email"
          bind:value={email}
          required
          autocomplete="username"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">Contraseña</span>
        <input
          class="input mt-1"
          name="password"
          type="password"
          bind:value={password}
          required
          autocomplete="current-password"
          onkeydown={(e) => e.key === 'Enter' && entrar()}
        />
      </label>
      {#if error}
        <p class="text-sm text-[var(--danger)]" data-testid="login-error">{error}</p>
      {/if}
      <button class="btn btn-primary w-full" type="button" disabled={loading} onclick={entrar}>
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
    </div>

    <div class="mt-6 space-y-1 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
      <p>Demo cliente: cliente@demo.local / cliente123</p>
      <p>Demo contable: contable@demo.local / contable123</p>
    </div>
  </div>
</div>
