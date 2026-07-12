---
read_when:
    - Вам нужен недорогой постоянно работающий Linux-хост для Gateway
    - Вам нужен удалённый доступ к интерфейсу управления без собственного VPS.
summary: Запуск OpenClaw Gateway на exe.dev (виртуальная машина + HTTPS-прокси) для удалённого доступа
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T11:30:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Цель:** работающий Gateway OpenClaw на виртуальной машине [exe.dev](https://exe.dev), доступный по адресу `https://<vm-name>.exe.xyz`.

Это руководство предполагает использование стандартного образа **exeuntu** от exe.dev. Для других дистрибутивов подберите соответствующие пакеты.

## Что потребуется

- Учетная запись exe.dev
- Доступ к виртуальным машинам exe.dev через `ssh exe.dev` (необязательно, для ручной настройки)

## Быстрый способ для начинающих

1. Откройте [https://exe.new/openclaw](https://exe.new/openclaw)
2. При необходимости введите ключ или токен аутентификации
3. Нажмите "Agent" рядом с виртуальной машиной и дождитесь, пока Shelley завершит подготовку
4. Откройте `https://<vm-name>.exe.xyz/` и выполните аутентификацию с помощью настроенного общего секрета (по умолчанию используется аутентификация по токену; аутентификация по паролю также работает, если изменить `gateway.auth.mode`)
5. Подтвердите ожидающие запросы на сопряжение устройств командой `openclaw devices approve <requestId>`

## Автоматическая установка с помощью Shelley

Shelley, агент exe.dev, может установить OpenClaw по запросу:

```text
Настрой OpenClaw (https://docs.openclaw.ai/install) на этой виртуальной машине. Для первоначальной настройки openclaw используй флаги неинтерактивного режима и принятия рисков. При необходимости добавь предоставленные данные аутентификации или токен. Настрой nginx для перенаправления со стандартного порта 18789 в корневой путь стандартной включенной конфигурации сайта, обязательно включив поддержку WebSocket. Сопряжение выполняется командами "openclaw devices list" и "openclaw devices approve <request id>". Убедись, что на панели управления состояние OpenClaw отображается как исправное. exe.dev самостоятельно перенаправляет порт 8000 на порты 80/443 и обеспечивает HTTPS, поэтому итоговый адрес для доступа должен быть <vm-name>.exe.xyz без указания порта.
```

## Ручная установка

<Steps>
  <Step title="Создание виртуальной машины">
    На своем устройстве выполните:

    ```bash
    ssh exe.dev new
    ```

    Затем подключитесь:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Эта виртуальная машина должна быть **с сохранением состояния**. OpenClaw хранит `openclaw.json`, отдельные для каждого агента файлы `auth-profiles.json`, сеансы и состояние каналов и провайдеров в `~/.openclaw/`, а рабочее пространство — в `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Установка необходимых компонентов (на виртуальной машине)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Установка OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Настройка nginx для проксирования на порт 8000">
    Отредактируйте `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # Поддержка WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Стандартные заголовки прокси
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Настройки времени ожидания для долговременных подключений
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Перезаписывайте заголовки перенаправления вместо сохранения цепочек, переданных клиентом. OpenClaw доверяет метаданным перенаправленного IP-адреса только от явно настроенных прокси-серверов, а цепочки `X-Forwarded-For`, формируемые путем добавления значений, считаются риском для безопасности.

  </Step>

  <Step title="Доступ к OpenClaw и подтверждение устройств">
    Откройте `https://<vm-name>.exe.xyz/` (адрес также отображается в выводе Control UI при первоначальной настройке). Если появится запрос аутентификации, вставьте настроенный общий секрет с виртуальной машины.

    В этом руководстве по умолчанию используется аутентификация по токену, поэтому получите значение `gateway.auth.token` командой `openclaw config get gateway.auth.token` или создайте новый токен командой `openclaw doctor --n`. Если вы переключили Gateway на аутентификацию по паролю, вместо этого используйте `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Подтвердите устройства командами `openclaw devices list` и `openclaw devices approve <requestId>`. Если сомневаетесь, воспользуйтесь Shelley в браузере.

  </Step>
</Steps>

## Удаленная настройка каналов

Для удаленных узлов предпочтительно использовать один вызов `config patch` вместо множества вызовов `config set` по SSH. Храните настоящие токены в окружении виртуальной машины или в `~/.openclaw/.env`, а в `openclaw.json` помещайте только SecretRef. Полное описание контракта SecretRef см. в разделе [Управление секретами](/ru/gateway/secrets).

На виртуальной машине добавьте необходимые секреты в окружение службы:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

На локальном компьютере создайте файл исправления и передайте его на виртуальную машину через канал:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
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

Используйте `--replace-path`, если вложенный список разрешений должен точно соответствовать значению из исправления, например при замене списка разрешенных каналов Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Полное описание конфигурации каналов см. в разделах [Discord](/ru/channels/discord) и [Slack](/ru/channels/slack).

## Удаленный доступ

exe.dev обеспечивает аутентификацию для удаленного доступа. По умолчанию HTTP-трафик с порта 8000 перенаправляется на `https://<vm-name>.exe.xyz` с аутентификацией по электронной почте.

## Обновление

```bash
openclaw update
```

Переключение каналов обновления и ручное восстановление описаны в разделе [Обновление](/ru/install/updating).

## Связанные материалы

- [Удаленный Gateway](/ru/gateway/remote)
- [Обзор установки](/ru/install)
