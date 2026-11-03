<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '#lib/api';
  import { user, hydrateUser } from '#lib/stores';

  let files: FileList | null = $state(null);
  let loading = $state(false);
  let error = $state('');
  let progress = $state(0);
  let result: {
    message: string;
    documentos: {
      id: string;
      nombreArchivo: string;
      estado: string;
      referenceCode: string;
    }[];
  } | null = $state(null);

  onMount(() => {
    hydrateUser();
    if (!$user) goto('/login');
    else if ($user.rol !== 'cliente') goto('/contable');
  });

  async function submit(e: Event) {
    e.preventDefault();
    if (!files?.length) {
      error = 'Selecciona al menos un archivo';
      return;
    }
    error = '';
    result = null;
    loading = true;
    progress = 25;
    try {
      const form = new FormData();
      for (const f of Array.from(files)) form.append('files', f);
      progress = 55;
      result = await api('/api/documentos/upload', { method: 'POST', form });
      progress = 100;
    } catch (err: any) {
      error = err.message || 'Error al subir';
      progress = 0;
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-xl">
  <h1 class="mb-1 text-2xl font-bold">Depositar documentos</h1>
  <p class="mb-5 text-sm text-[var(--muted)]">
    Carga uno o varios archivos. Verás confirmación al recibirse cada uno.
  </p>

  <form class="card-ish space-y-4 p-5" onsubmit={submit}>
    <label class="block text-sm">
      <span class="font-medium">Archivos</span>
      <input
        class="input mt-1"
        type="file"
        multiple
        accept=".pdf,.xml,.jpg,.jpeg,.png,.webp,.xlsx,.docx,.txt"
        onchange={(e) => (files = (e.currentTarget as HTMLInputElement).files)}
      />
    </label>

    {#if loading}
      <div class="h-2 overflow-hidden rounded bg-slate-200">
        <div class="h-full bg-[var(--brand)] transition-all" style={`width:${progress}%`}></div>
      </div>
      <p class="text-xs text-[var(--muted)]">Subiendo…</p>
    {/if}

    {#if error}
      <p class="text-sm text-[var(--danger)]">{error}</p>
    {/if}

    <button class="btn btn-primary" disabled={loading}>
      {loading ? 'Procesando…' : 'Confirmar envío'}
    </button>
  </form>

  {#if result}
    <div class="card-ish mt-4 border-[var(--brand)] p-5">
      <h2 class="mb-2 font-semibold text-[var(--brand-dark)]">Confirmación de recepción</h2>
      <p class="mb-3 text-sm">{result.message}</p>
      <ul class="space-y-2 text-sm">
        {#each result.documentos as d}
          <li
            class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2"
          >
            <span class="font-medium">{d.nombreArchivo}</span>
            <span class="text-xs text-[var(--muted)]">
              Ref {d.referenceCode} · <span class="badge badge-ok">{d.estado}</span>
            </span>
          </li>
        {/each}
      </ul>
      <a class="btn btn-ghost mt-4" href="/cliente">Volver al inicio</a>
    </div>
  {/if}
</div>
