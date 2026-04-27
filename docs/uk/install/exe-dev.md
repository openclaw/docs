---
read_when:
    - Вам потрібен недорогий постійно увімкнений Linux-хост для Gateway
    - Вам потрібен віддалений доступ до Control UI без запуску власного VPS
summary: Запуск Gateway OpenClaw на exe.dev (VM + HTTPS-проксі) для віддаленого доступу
title: exe.dev
x-i18n:
    generated_at: "2026-04-27T07:08:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 98bc90ff26ce1773bd0e05f975fcc3427039e90ce50eca21bb2e8232f7ac730f
    source_path: install/exe-dev.md
    workflow: 15
---

Мета: Gateway OpenClaw, запущений на VM exe.dev, доступний із вашого ноутбука за адресою: `https://<vm-name>.exe.xyz`

Ця сторінка передбачає використання типового образу **exeuntu** від exe.dev. Якщо ви вибрали інший дистрибутив, підберіть відповідні пакети самостійно.

## Швидкий шлях для початківців

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Заповніть ваш ключ або токен автентифікації за потреби
3. Натисніть "Agent" поруч із вашою VM і дочекайтеся, поки Shelley завершить налаштування
4. Відкрийте `https://<vm-name>.exe.xyz/` і пройдіть автентифікацію за допомогою налаштованого спільного секрету (у цьому посібнику типово використовується автентифікація за токеном, але автентифікація за паролем теж працює, якщо ви перемкнете `gateway.auth.mode`)
5. Підтвердіть усі незавершені запити на прив’язку пристроїв за допомогою `openclaw devices approve <requestId>`

## Що вам знадобиться

- обліковий запис exe.dev
- доступ `ssh exe.dev` до віртуальних машин [exe.dev](https://exe.dev) (необов’язково)

## Автоматизоване встановлення за допомогою Shelley

Shelley, агент [exe.dev](https://exe.dev), може миттєво встановити OpenClaw за нашим
запитом. Використаний запит наведено нижче:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Ручне встановлення

## 1) Створіть VM

На вашому пристрої:

```bash
ssh exe.dev new
```

Потім підключіться:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Зробіть цю VM **stateful**. OpenClaw зберігає `openclaw.json`, `auth-profiles.json` для кожного агента, сесії та стан каналів/провайдерів у `~/.openclaw/`, а також робочий простір у `~/.openclaw/workspace/`.
</Tip>

## 2) Встановіть передумови (на VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Встановіть OpenClaw

Запустіть скрипт встановлення OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Налаштуйте nginx для проксіювання OpenClaw на порт 8000

Відредагуйте `/etc/nginx/sites-enabled/default`, додавши

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

Перезаписуйте заголовки forwarding замість збереження ланцюжків, наданих клієнтом.
OpenClaw довіряє метаданим forwarded IP лише від явно налаштованих проксі,
а ланцюжки `X-Forwarded-For` у стилі append вважаються ризиком для безпеки.

## 5) Отримайте доступ до OpenClaw і надайте дозволи

Відкрийте `https://<vm-name>.exe.xyz/` (див. вивід Control UI з onboarding). Якщо з’явиться запит на автентифікацію, вставте
налаштований спільний секрет із VM. У цьому посібнику використовується автентифікація за токеном, тож отримайте `gateway.auth.token`
командою `openclaw config get gateway.auth.token` (або згенеруйте його за допомогою `openclaw doctor --generate-gateway-token`).
Якщо ви змінили Gateway на автентифікацію за паролем, використовуйте `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Підтверджуйте пристрої командами `openclaw devices list` і `openclaw devices approve <requestId>`. Якщо сумніваєтеся, використовуйте Shelley у вашому браузері!

## Віддалений доступ

Віддалений доступ забезпечується автентифікацією [exe.dev](https://exe.dev). За
замовчуванням HTTP-трафік із порту 8000 переспрямовується на `https://<vm-name>.exe.xyz`
з автентифікацією за email.

## Оновлення

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Посібник: [Оновлення](/uk/install/updating)

## Пов’язане

- [Віддалений Gateway](/uk/gateway/remote)
- [Огляд встановлення](/uk/install)
