---
read_when:
    - Вам потрібен недорогий постійно увімкнений Linux-хост для Gateway
    - Вам потрібен віддалений доступ до Control UI без запуску власного VPS
summary: Запуск OpenClaw Gateway на exe.dev (VM + HTTPS-проксі) для віддаленого доступу
title: exe.dev
x-i18n:
    generated_at: "2026-04-27T06:26:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ef0b961a1153357aa32dd061791f5c94ae5008a99a800456d592ffce3a643f2
    source_path: install/exe-dev.md
    workflow: 15
---

Мета: OpenClaw Gateway, що працює на VM exe.dev і доступний з вашого ноутбука за адресою: `https://<vm-name>.exe.xyz`

Ця сторінка передбачає типовий образ **exeuntu** від exe.dev. Якщо ви вибрали інший дистрибутив, відповідно зіставте пакунки.

## Швидкий шлях для початківців

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Заповніть свій ключ/токен автентифікації за потреби
3. Натисніть "Agent" поруч із вашою VM і дочекайтеся, поки Shelley завершить підготовку
4. Відкрийте `https://<vm-name>.exe.xyz/` і автентифікуйтеся за допомогою налаштованого спільного секрету (у цьому посібнику типово використовується автентифікація токеном, але також працює автентифікація паролем, якщо ви переключите `gateway.auth.mode`)
5. Схваліть усі очікувані запити на pairing пристроїв за допомогою `openclaw devices approve <requestId>`

## Що вам потрібно

- обліковий запис exe.dev
- доступ `ssh exe.dev` до віртуальних машин [exe.dev](https://exe.dev) (необов’язково)

## Автоматизоване встановлення за допомогою Shelley

Shelley, агент [exe.dev](https://exe.dev), може миттєво встановити OpenClaw за нашим
prompt. Нижче наведено prompt, що використовується:

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
Залишайте цю VM **станозбережною**. OpenClaw зберігає `openclaw.json`, `auth-profiles.json` для кожного агента, сеанси та стан каналів/провайдерів у `~/.openclaw/`, а також робочий простір у `~/.openclaw/workspace/`.
</Tip>

## 2) Установіть передумови (на VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Установіть OpenClaw

Запустіть скрипт встановлення OpenClaw:

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

Перезаписуйте forwarding-заголовки замість збереження ланцюжків, наданих клієнтом.
OpenClaw довіряє метаданим forwarded IP лише від явно налаштованих проксі,
а ланцюжки `X-Forwarded-For` у стилі append вважаються ризиком для захисту.

## 5) Отримайте доступ до OpenClaw і надайте привілеї

Відкрийте `https://<vm-name>.exe.xyz/` (див. вивід Control UI з onboarding). Якщо буде запитано автентифікацію, вставте
налаштований спільний секрет із VM. У цьому посібнику використовується автентифікація токеном, тому отримайте `gateway.auth.token`
за допомогою `openclaw config get gateway.auth.token` (або згенеруйте його через `openclaw doctor --generate-gateway-token`).
Якщо ви переключили gateway на автентифікацію паролем, натомість використовуйте `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Схвалюйте пристрої через `openclaw devices list` і `openclaw devices approve <requestId>`. Якщо сумніваєтеся, використовуйте Shelley з браузера!

## Віддалений доступ

Віддалений доступ забезпечується автентифікацією [exe.dev](https://exe.dev). За
типовим налаштуванням HTTP-трафік із порту 8000 перенаправляється на `https://<vm-name>.exe.xyz`
з автентифікацією через email.

## Оновлення

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Посібник: [Оновлення](/uk/install/updating)

## Пов’язане

- [Віддалений gateway](/uk/gateway/remote)
- [Огляд встановлення](/uk/install)
