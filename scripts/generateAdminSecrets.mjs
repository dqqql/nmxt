import { pbkdf2Sync, randomBytes } from 'node:crypto';

function readHidden(prompt) {
  if (!process.stdin.isTTY) throw new Error('请在交互式终端中运行此命令。');
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (key) => {
      if (key === '\u0003') {
        process.stdout.write('\n');
        cleanup();
        reject(new Error('已取消。'));
      } else if (key === '\r' || key === '\n') {
        process.stdout.write('\n');
        cleanup();
        resolve(value);
      } else if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
      } else if (!key.startsWith('\u001b')) {
        value += key;
      }
    };
    const cleanup = () => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    process.stdin.on('data', onData);
  });
}

try {
  const password = await readHidden('管理员密码（输入不会显示）：');
  const confirmation = await readHidden('再次输入管理员密码：');
  if (password.length < 12) throw new Error('管理员密码至少需要 12 个字符。');
  if (password !== confirmation) throw new Error('两次输入的密码不一致。');

  const iterations = 100000;
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  const passwordHash = `pbkdf2$${iterations}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
  const sessionSecret = randomBytes(32).toString('base64url');

  process.stdout.write('\n请分别保存为 Cloudflare Secrets，不要提交到 Git：\n');
  process.stdout.write(`ADMIN_PASSWORD_HASH=${passwordHash}\n`);
  process.stdout.write(`SESSION_SECRET=${sessionSecret}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
