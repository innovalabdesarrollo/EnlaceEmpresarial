/**
 * Unitario mínimo: criterios de reglas (misma lógica que clasificar.js).
 * Sin DB ni HTTP.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function matchCriterio(fileName, criterio) {
  const name = fileName || '';
  const raw = String(criterio || '').trim();
  if (!raw) return false;
  try {
    return new RegExp(raw, 'i').test(name);
  } catch {
    return name.toLowerCase().includes(raw.toLowerCase());
  }
}

describe('Reglas de clasificación (unit)', () => {
  it('detecta factura y banco', () => {
    assert.equal(matchCriterio('factura_AAA010101AAA.txt', 'factura'), true);
    assert.equal(matchCriterio('estado_cuenta_marzo.pdf', 'estado.?cuenta|banco'), true);
    assert.equal(matchCriterio('notas.txt', 'factura'), false);
  });

  it('tolera criterio inválido como texto literal', () => {
    assert.equal(matchCriterio('archivo[x].txt', '[x'), true);
  });
});
