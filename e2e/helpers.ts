import { expect, type Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeEnabled();

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Salir' }).click();
  await page.waitForURL(/\/login/);
}
