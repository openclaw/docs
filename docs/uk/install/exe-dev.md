---
read_when:
    - Вам потрібен недорогий постійно увімкнений Linux-хост для Gateway
    - Ви хочете мати віддалений доступ до Control UI без власного VPS
summary: Запуск OpenClaw Gateway на exe.dev (VM + HTTPS proxy) для віддаленого доступу
title: exe.dev
x-i18n:
    generated_at: "2026-04-23T20:56:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ac8d51c939f10ed32a035fa13d0a41bd5dbfba7bcc8489b19c20954bda81259
    source_path: install/exe-dev.md
    workflow: 15
---

Мета: Gateway OpenClaw, запущений на VM exe.dev, доступний з вашого ноутбука за адресою: `https://<vm-name>.exe.xyz`

Ця сторінка припускає стандартний образ **exeuntu** від exe.dev. Якщо ви вибрали інший дистрибутив, відповідно підберіть пакети.

## Швидкий шлях для початківців

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Заповніть свій auth key/token за потреби
3. Натисніть "Agent" поруч зі своєю VM і дочекайтеся, поки Shelley завершить розгортання
4. Відкрийте `https://<vm-name>.exe.xyz/` і пройдіть автентифікацію за допомогою налаштованого shared secret (у цьому посібнику типово використовується token auth, але password auth теж працює, якщо ви переключите `gateway.auth.mode`)
5. Схваліть усі pending device pairing requests через `openclaw devices approve <requestId>`

## Що вам потрібно

- обліковий запис exe.dev
- доступ `ssh exe.dev` до віртуальних машин [exe.dev](https://exe.dev) (необов’язково)

## Автоматичне встановлення за допомогою Shelley

Shelley, агент [exe.dev](https://exe.dev), може миттєво встановити OpenClaw за нашим
prompt. Використаний prompt наведено нижче:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Ручне встановлення

## 1) Створіть VM

Зі свого пристрою:

```bash
ssh exe.dev new
```

Потім підключіться:

```bash
ssh <vm-name>.exe.xyz
```

Порада: тримайте цю VM **stateful**. OpenClaw зберігає `openclaw.json`, `auth-profiles.json`
для кожного агента, сесії та стан каналів/provider-ів у
`~/.openclaw/`, а також робочий простір у `~/.openclaw/workspace/`.

## 2) Установіть залежності (на VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Установіть OpenClaw

Запустіть скрипт встановлення OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Налаштуйте nginx для проксування OpenClaw на порт 8000

Відредагуйте `/etc/nginx/sites-enabled/default`, вставивши:

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

Перезаписуйте forwarding headers замість збереження ланцюжків, наданих клієнтом.
OpenClaw довіряє метаданим forwarded IP лише від явно налаштованих proxy,
а ланцюжки `X-Forwarded-For` у стилі append розглядаються як ризик для посилення безпеки.

## 5) Отримайте доступ до OpenClaw і надайте дозволи

Перейдіть на `https://<vm-name>.exe.xyz/` (див. вивід onboarding Control UI). Якщо з’являється запит на auth, вставте
налаштований shared secret із VM. У цьому посібнику використовується token auth, тож отримайте `gateway.auth.token`
через `openclaw config get gateway.auth.token` (або згенеруйте його через `openclaw doctor --generate-gateway-token`).
Якщо ви переключили gateway на password auth, використовуйте `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Схвалюйте пристрої через `openclaw devices list` і `openclaw devices approve <requestId>`. Якщо сумніваєтеся, використовуйте Shelley у браузері!

## Віддалений доступ

Віддалений доступ забезпечується автентифікацією [exe.dev](https://exe.dev). Типово
HTTP-трафік із порту 8000 пересилається на `https://<vm-name>.exe.xyz`
з email auth.

## Оновлення

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Посібник: [Updating](/uk/install/updating)
