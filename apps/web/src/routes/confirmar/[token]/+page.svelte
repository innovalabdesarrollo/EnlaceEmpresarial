<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '#lib/api';

  let loading = $state(true);
  let ok = $state(false);
  let error = $state('');
  let detalle = $state<{ asunto?: string; fechaConfirmacion?: string }>({});

  onMount(async () => {
    const token = $page.params.token;
    try {
      const data = await api<{
        ok: boolean;
        asunto?: string;
        fechaConfirmacion?: string;
      }>(`/api/confirmaciones/${token}`);
      ok = Boolean(data.ok);
      detalle = data;
    } catch (e: any) {
      error = e.message || 'No se pudo confirmar';
    } finally {
      loading = false;
    }
  });
</script>

<section class="mx-auto max-w-lg space-y-4 py-10 text-center">
  <h1 class="text-2xl font-bold text-[var(--brand-dark)]">Confirmar recepción</h1>
  {#if loading}
    <p class="text-[var(--muted)]">Validando enlace…</p>
  {:else if ok}
    <p class="text-teal-800">Recepción confirmada. Gracias.</p>
    {#if detalle.asunto}
      <p class="text-sm text-[var(--muted)]">{detalle.asunto}</p>
    {/if}
  {:else}
    <p class="text-red-700">{error || 'Enlace inválido'}</p>
  {/if}
  <a class="btn btn-primary inline-flex" href="/login">Ir a ingresar</a>
</section>
