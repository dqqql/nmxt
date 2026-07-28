import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const adminSource = readFileSync(new URL('./AdminPage.jsx', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const railSource = readFileSync(new URL('./ToolRail.jsx', import.meta.url), 'utf8');

describe('marketplace admin UI', () => {
  it('is reachable by URL without exposing a player-facing admin button', () => {
    expect(mainSource).toContain("path === '/admin'");
    expect(railSource).not.toContain('/admin');
  });

  it('supports password login and full resource management', () => {
    expect(adminSource).toContain("apiRequest('/api/admin/login'");
    expect(adminSource).toContain("apiRequest('/api/admin/resources'");
    expect(adminSource).toContain("method: draft.id ? 'PUT' : 'POST'");
    expect(adminSource).toContain("method: 'DELETE'");
    expect(adminSource).toContain('读取 JSON 文件');
    expect(adminSource).toContain('已上架');
  });
});
