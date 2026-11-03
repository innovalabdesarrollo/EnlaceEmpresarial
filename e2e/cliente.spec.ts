import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';
import path from 'node:path';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

test.describe('Flujo cliente', () => {
  test('login, documentos, subir, historial, avisos', async ({ page }) => {
    await login(page, 'cliente@demo.local', 'cliente123');
    await expect(page).toHaveURL(/\/cliente/);
    await expect(page.getByRole('heading', { name: 'Mis documentos' })).toBeVisible();

    await page.getByRole('link', { name: 'Subir documentos' }).click();
    await expect(page).toHaveURL(/\/cliente\/subir/);
    await expect(page.getByRole('heading', { name: 'Depositar documentos' })).toBeVisible();

    const dir = mkdtempSync(path.join(tmpdir(), 'ee-e2e-'));
    const filePath = path.join(dir, `factura_AAA010101AAA_pw_${Date.now()}.txt`);
    writeFileSync(filePath, 'prueba playwright enlace\n');

    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.getByRole('button', { name: 'Confirmar envío' }).click();
    await expect(page.getByRole('heading', { name: 'Confirmación de recepción' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Ref EE-/)).toBeVisible();

    await page.getByRole('link', { name: 'Historial' }).click();
    await expect(page).toHaveURL(/\/cliente\/historial/);
    await expect(page.getByRole('heading', { name: /Historial/i })).toBeVisible();

    await page.getByRole('link', { name: 'Avisos' }).click();
    await expect(page).toHaveURL(/\/cliente\/notificaciones/);
    await expect(page.getByRole('heading', { name: /Avisos|Notificaciones/i })).toBeVisible();

    await logout(page);
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  });

  test('credenciales inválidas muestran error', async ({ page }) => {
    await login(page, 'cliente@demo.local', 'clave-incorrecta');
    await expect(page.getByText('Credenciales inválidas')).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
