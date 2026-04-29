---
read_when:
    - Вам потрібен недорогий Linux-хост для Gateway, який завжди ввімкнений
    - Вам потрібен віддалений доступ до інтерфейсу керування без запуску власного VPS
summary: Запустіть OpenClaw Gateway на exe.dev (VM + HTTPS-проксі) для віддаленого доступу
title: exe.dev
x-i18n:
    generated_at: "2026-04-29T21:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Мета: OpenClaw Gateway працює на VM exe.dev і доступний з вашого ноутбука через: `https://<vm-name>.exe.xyz`

Ця сторінка передбачає стандартний образ **exeuntu** від exe.dev. Якщо ви вибрали інший дистрибутив, зіставте пакети відповідно.

## Швидкий шлях для початківців

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. За потреби введіть свій ключ/токен автентифікації
3. Натисніть "Агент" поруч із вашою VM і дочекайтеся, поки Shelley завершить підготовку
4. Відкрийте `https://<vm-name>.exe.xyz/` і автентифікуйтеся за допомогою налаштованого спільного секрету (цей посібник за замовчуванням використовує автентифікацію токеном, але автентифікація паролем також працює, якщо перемкнути `gateway.auth.mode`)
5. Підтвердьте всі очікувані запити на сполучення пристроїв за допомогою `openclaw devices approve <requestId>`

## Що потрібно

- Обліковий запис exe.dev
- Доступ `ssh exe.dev` до віртуальних машин [exe.dev](https://exe.dev) (необов'язково)

## Автоматизоване встановлення із Shelley

Shelley, агент [exe.dev](https://exe.dev), може миттєво встановити OpenClaw за допомогою нашого
промпта. Використаний промпт наведено нижче:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Ручне встановлення

## 1) Створіть VM

З вашого пристрою:

```bash
ssh exe.dev new
```

Потім підключіться:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Залишайте цю VM **stateful**. OpenClaw зберігає `openclaw.json`, `auth-profiles.json` для кожного агента, сесії та стан каналів/провайдерів у `~/.openclaw/`, а робочу область у `~/.openclaw/workspace/`.
</Tip>

## 2) Встановіть передумови (на VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Встановіть OpenClaw

Запустіть інсталяційний скрипт OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Налаштуйте nginx для проксіювання OpenClaw на порт 8000

Відредагуйте `/etc/nginx/sites-enabled/default` так:

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Перезаписуйте заголовки пересилання замість збереження ланцюжків, наданих клієнтом.
OpenClaw довіряє метаданим пересланої IP-адреси лише від явно налаштованих проксі,
а ланцюжки `X-Forwarded-For` у стилі додавання вважаються ризиком посилення захисту.

## 5) Отримайте доступ до OpenClaw і надайте привілеї

Відкрийте `https://<vm-name>.exe.xyz/` (див. вивід Control UI під час онбордингу). Якщо з'явиться запит на автентифікацію, вставте
налаштований спільний секрет із VM. Цей посібник використовує автентифікацію токеном, тому отримайте `gateway.auth.token`
за допомогою `openclaw config get gateway.auth.token` (або згенеруйте його за допомогою `openclaw doctor --generate-gateway-token`).
Якщо ви змінили Gateway на автентифікацію паролем, натомість використовуйте `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Підтверджуйте пристрої за допомогою `openclaw devices list` і `openclaw devices approve <requestId>`. Якщо сумніваєтеся, скористайтеся Shelley у браузері!

## Налаштування віддалених каналів

Для віддалених хостів віддавайте перевагу одному виклику `config patch` замість багатьох SSH-викликів `config set`. Зберігайте реальні токени в середовищі VM або `~/.openclaw/.env`, а в `openclaw.json` розміщуйте лише SecretRefs.

На VM зробіть так, щоб середовище сервісу містило потрібні йому секрети:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

На локальній машині створіть файл патча та передайте його у VM через pipe:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Використовуйте `--replace-path`, коли вкладений allowlist має стати точно значенням патча, наприклад під час заміни allowlist каналу Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Віддалений доступ

Віддалений доступ обробляється автентифікацією [exe.dev](https://exe.dev). За
замовчуванням HTTP-трафік із порту 8000 пересилається до `https://<vm-name>.exe.xyz`
з автентифікацією через email.

## Оновлення

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Посібник: [Оновлення](/uk/install/updating)

## Пов'язане

- [Віддалений gateway](/uk/gateway/remote)
- [Огляд встановлення](/uk/install)
