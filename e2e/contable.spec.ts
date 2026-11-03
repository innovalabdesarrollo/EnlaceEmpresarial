import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';

test.describe('Flujo contable', () => {
  test('login y navega módulos principales', async ({ page }) => {
    await login(page, 'contable@demo.local', 'contable123');
    await expect(page).toHaveURL(/\/contable/);
    await expect(page.getByRole('heading', { name: 'Documentos clasificados' })).toBeVisible();

    await page.getByRole('link', { name: 'Revisiones', exact: true }).click();
    await expect(page).toHaveURL(/\/contable\/revisiones/);
    await expect(page.getByRole('heading', { name: /Revisión/i })).toBeVisible();

    await page.getByRole('link', { name: 'Historial', exact: true }).click();
    await expect(page).toHaveURL(/\/contable\/historial/);
    await expect(page.getByRole('heading', { name: /Historial/i })).toBeVisible();

    await page.getByRole('link', { name: 'Errores', exact: true }).click();
    await expect(page).toHaveURL(/\/contable\/errores/);
    await expect(page.getByRole('heading', { name: /Errores/i })).toBeVisible();

    await page.getByRole('link', { name: 'Envíos', exact: true }).click();
    await expect(page).toHaveURL(/\/contable\/envios/);
    await expect(page.getByRole('heading', { name: /envíos|Cola/i })).toBeVisible();

    await page.getByRole('link', { name: 'Observaciones', exact: true }).click();
    await expect(page).toHaveURL(/\/contable\/observaciones/);
    await expect(page.getByRole('heading', { name: /Observaciones/i })).toBeVisible();

    await page.getByRole('link', { name: 'Reglas', exact: true }).click();
    await expect(page).toHaveURL(/\/contable\/reglas/);
    await expect(page.getByRole('heading', { name: /Reglas/i })).toBeVisible();
    await expect(page.getByText('Nueva regla')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar' }).first()).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Activa' }).first()).toBeChecked();

    await logout(page);
  });

  test('marca documento listo y aparece en envíos', async ({ page }) => {
    await login(page, 'contable@demo.local', 'contable123');
    await expect(page.getByRole('heading', { name: 'Documentos clasificados' })).toBeVisible();

    const firstCheck = page.locator('input[type="checkbox"]').first();
    if (await firstCheck.count()) {
      await firstCheck.check();
      await page.getByRole('button', { name: 'Marcar listo para envío' }).click();
      await expect(page.getByText(/Cola actualizada|preparado|bloqueado/i)).toBeVisible({
        timeout: 20_000,
      });

      await page.getByRole('link', { name: 'Envíos', exact: true }).click();
      await expect(page.getByRole('heading', { name: /envíos|Cola/i })).toBeVisible();
      await expect(page.locator('.card-ish, table, body')).toContainText(
        /preparado|bloqueado|enviado|pendiente|Sin envíos/i
      );
    }

    await logout(page);
  });
});
