---
read_when:
    - Вам нужен недорогой постоянно работающий Linux-хост для Gateway
    - Вам нужен удаленный доступ к Control UI без запуска собственного VPS
summary: Запустите OpenClaw Gateway на exe.dev (виртуальная машина + HTTPS-прокси) для удаленного доступа
title: exe.dev
x-i18n:
    generated_at: "2026-06-28T23:05:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Цель: OpenClaw Gateway, запущенный на VM exe.dev и доступный с вашего ноутбука по адресу: `https://<vm-name>.exe.xyz`

Эта страница предполагает использование стандартного образа **exeuntu** от exe.dev. Если вы выбрали другой дистрибутив, сопоставьте пакеты соответствующим образом.

## Быстрый путь для начинающих

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Заполните свой ключ/токен аутентификации при необходимости
3. Нажмите «Агент» рядом с вашей VM и дождитесь, пока Shelley завершит подготовку
4. Откройте `https://<vm-name>.exe.xyz/` и выполните аутентификацию с помощью настроенного общего секрета (по умолчанию в этом руководстве используется аутентификация по токену, но аутентификация по паролю тоже работает, если переключить `gateway.auth.mode`)
5. Одобрите все ожидающие запросы на сопряжение устройств с помощью `openclaw devices approve <requestId>`

## Что вам понадобится

- Учетная запись exe.dev
- Доступ `ssh exe.dev` к виртуальным машинам [exe.dev](https://exe.dev) (необязательно)

## Автоматическая установка с Shelley

Shelley, агент [exe.dev](https://exe.dev), может мгновенно установить OpenClaw с помощью нашего
промпта. Используемый промпт приведен ниже:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Ручная установка

## 1) Создайте VM

С вашего устройства:

```bash
ssh exe.dev new
```

Затем подключитесь:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Сделайте эту VM **с сохраняемым состоянием**. OpenClaw хранит `openclaw.json`, `auth-profiles.json` для каждого агента, сеансы и состояние каналов/провайдеров в `~/.openclaw/`, а рабочую область — в `~/.openclaw/workspace/`.
</Tip>

## 2) Установите предварительные зависимости (на VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Установите OpenClaw

Запустите установочный скрипт OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Настройте nginx для проксирования OpenClaw на порт 8000

Отредактируйте `/etc/nginx/sites-enabled/default` следующим содержимым

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

Перезаписывайте заголовки пересылки вместо сохранения цепочек, предоставленных клиентом.
OpenClaw доверяет метаданным пересланного IP только от явно настроенных прокси,
а цепочки `X-Forwarded-For` в стиле добавления считаются риском для усиления защиты.

## 5) Откройте OpenClaw и предоставьте привилегии

Откройте `https://<vm-name>.exe.xyz/` (см. вывод Control UI при онбординге). Если появится запрос аутентификации, вставьте
настроенный общий секрет с VM. В этом руководстве используется аутентификация по токену, поэтому получите `gateway.auth.token`
с помощью `openclaw config get gateway.auth.token` (или сгенерируйте его с помощью `openclaw doctor --generate-gateway-token`).
Если вы переключили Gateway на аутентификацию по паролю, используйте вместо этого `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Одобряйте устройства с помощью `openclaw devices list` и `openclaw devices approve <requestId>`. Если сомневаетесь, используйте Shelley из браузера!

## Настройка удаленных каналов

Для удаленных хостов предпочитайте один вызов `config patch` множеству SSH-вызовов `config set`. Храните настоящие токены в окружении VM или `~/.openclaw/.env`, а в `openclaw.json` помещайте только SecretRefs.

На VM добавьте в окружение сервиса необходимые секреты:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

С локального компьютера создайте файл патча и передайте его в VM через pipe:

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

Используйте `--replace-path`, когда вложенный allowlist должен стать точно равным значению патча, например при замене allowlist каналов Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Удаленный доступ

Удаленный доступ обрабатывается аутентификацией [exe.dev](https://exe.dev). По
умолчанию HTTP-трафик с порта 8000 пересылается на `https://<vm-name>.exe.xyz`
с аутентификацией по электронной почте.

## Обновление

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Руководство: [Обновление](/ru/install/updating)

## См. также

- [Удаленный Gateway](/ru/gateway/remote)
- [Обзор установки](/ru/install)
