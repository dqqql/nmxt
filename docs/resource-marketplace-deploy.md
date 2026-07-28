# 资源商城部署

本地代码不包含生产密码、Cloudflare 账号信息或真实 D1 ID。首次部署需要在 PowerShell 中完成以下操作。

## 1. 登录并创建 D1

```powershell
npx wrangler login
npx wrangler d1 create niming-card-builder
```

把命令返回的 `database_id` 替换到项目根目录 `wrangler.jsonc` 中；保持绑定名为 `DB`。

## 2. 设置管理员 Secrets

```powershell
npm run admin:secrets
npx wrangler pages secret put ADMIN_PASSWORD_HASH
npx wrangler pages secret put SESSION_SECRET
```

第一个命令会交互式读取密码并输出两项值。后两个命令会要求选择 Pages 项目并交互式粘贴对应值。不要把输出保存到仓库。

如果使用 Cloudflare 控制台，也可以在 Pages 项目的 “Variables and Secrets” 中创建同名加密变量。

## 3. 应用数据库迁移

```powershell
npx wrangler d1 migrations apply niming-card-builder --remote
```

迁移文件位于 `migrations/`。执行远端迁移前建议先确认 `wrangler.jsonc` 中的数据库名称和 ID。

## 4. 部署

Cloudflare Pages 设置：

- 构建命令：`npm run build`
- 构建输出目录：`dist`
- Functions 目录：仓库根目录下的 `functions`

提交并触发 Git 部署后，访问：

- 玩家端：站点根网址
- 管理后台：`https://你的域名/admin`

首次验收应确认后台登录、资源上架、商城安装和管理器持久化均正常。
