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
    expect(adminSource).toContain('保存并发布');
    expect(adminSource).not.toContain('保存草稿');
    expect(adminSource).not.toContain('statusFilter');
    expect(adminSource).not.toContain('按状态筛选');
    expect(adminSource).toContain('<b>版本</b>');
    expect(adminSource).toContain('<b>作者</b>');
    expect(adminSource).toContain('author: draft.author');
    expect(adminSource).toContain('JSON.parse(payloadText)');
    expect(adminSource).toContain("{ version: payload.version }");
    expect(adminSource).toContain("{ author: payload.author }");
    expect(adminSource).not.toContain('商城版本');
    expect(adminSource).not.toContain('（从 JSON 读取）');
  });
});
