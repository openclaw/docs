---
read_when:
    - Вам потрібен недорогий постійно ввімкнений хост Linux для Gateway
    - Вам потрібен віддалений доступ до інтерфейсу керування без запуску власного VPS
summary: Запустіть OpenClaw Gateway на exe.dev (віртуальна машина + HTTPS-проксі) для віддаленого доступу
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T13:22:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Мета:** Gateway OpenClaw працює на віртуальній машині [exe.dev](https://exe.dev) і доступний за адресою `https://<vm-name>.exe.xyz`.

У цьому посібнику передбачається використання стандартного образу **exeuntu** від exe.dev. Для інших дистрибутивів доберіть відповідні пакунки.

## Що вам потрібно

- Обліковий запис exe.dev
- Доступ до віртуальних машин exe.dev через `ssh exe.dev` (необов’язково, для ручного налаштування)

## Швидкий спосіб для початківців

1. Відкрийте [https://exe.new/openclaw](https://exe.new/openclaw)
2. За потреби введіть свій ключ автентифікації або токен
3. Натисніть "Agent" поруч зі своєю віртуальною машиною та зачекайте, доки Shelley завершить підготовку
4. Відкрийте `https://<vm-name>.exe.xyz/` та пройдіть автентифікацію за допомогою налаштованого спільного секрету (типово використовується автентифікація за токеном; автентифікація за паролем також працює, якщо змінити `gateway.auth.mode`)
5. Схваліть запити на сполучення пристроїв, що очікують, за допомогою `openclaw devices approve <requestId>`

## Автоматизоване встановлення за допомогою Shelley

Shelley, агент exe.dev, може встановити OpenClaw за текстовим запитом:

```text
Налаштуй OpenClaw (https://docs.openclaw.ai/install) на цій віртуальній машині. Для початкового налаштування openclaw використовуй прапорці неінтерактивного режиму та прийняття ризику. За потреби додай надані дані автентифікації або токен. Налаштуй nginx для перенаправлення зі стандартного порту 18789 до кореневого розташування у стандартній увімкненій конфігурації сайту та обов’язково ввімкни підтримку WebSocket. Сполучення виконується командами "openclaw devices list" і "openclaw devices approve <request id>". Переконайся, що на панелі керування стан OpenClaw позначено як справний. exe.dev виконує для нас перенаправлення з порту 8000 на порт 80/443 і забезпечує HTTPS, тому кінцева адреса доступу має бути <vm-name>.exe.xyz без зазначення порту.
```

## Ручне встановлення

<Steps>
  <Step title="Створіть віртуальну машину">
    На своєму пристрої виконайте:

    ```bash
    ssh exe.dev new
    ```

    Потім під’єднайтеся:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Зберігайте стан цієї віртуальної машини. OpenClaw зберігає `openclaw.json`, окремі для кожного агента файли `auth-profiles.json`, сеанси та стан каналів і провайдерів у `~/.openclaw/`, а робочий простір — у `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Установіть необхідні компоненти (на віртуальній машині)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Установіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Налаштуйте nginx як проксі до порту 8000">
    Відредагуйте `/etc/nginx/sites-enabled/default`:

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

            # Підтримка WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Стандартні заголовки проксі
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Налаштування часу очікування для довготривалих з’єднань
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Перезаписуйте заголовки переспрямування замість збереження ланцюжків, наданих клієнтом. OpenClaw довіряє переспрямованим метаданим IP-адрес лише від явно налаштованих проксі, а ланцюжки `X-Forwarded-For` із дописуванням значень вважаються ризиком для захисту системи.

  </Step>

  <Step title="Отримайте доступ до OpenClaw і схваліть пристрої">
    Відкрийте `https://<vm-name>.exe.xyz/` (див. адресу Control UI, виведену під час початкового налаштування). Якщо з’явиться запит на автентифікацію, вставте налаштований спільний секрет із віртуальної машини.

    У цьому посібнику типово використовується автентифікація за токеном, тому отримайте `gateway.auth.token` за допомогою `openclaw config get gateway.auth.token` або створіть новий командою `openclaw doctor --n`. Якщо ви перемкнули Gateway на автентифікацію за паролем, натомість використовуйте `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Схваліть пристрої за допомогою `openclaw devices list` і `openclaw devices approve <requestId>`. Якщо маєте сумніви, скористайтеся Shelley у браузері.

  </Step>
</Steps>

## Віддалене налаштування каналів

Для віддалених хостів віддавайте перевагу одному виклику `config patch` замість багатьох викликів `config set` через SSH. Зберігайте справжні токени в середовищі віртуальної машини або у `~/.openclaw/.env`, а в `openclaw.json` указуйте лише SecretRefs. Повний опис контракту SecretRef див. у розділі [Керування секретами](/uk/gateway/secrets).

На віртуальній машині додайте до середовища служби необхідні секрети:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

На локальному комп’ютері створіть файл виправлення та передайте його на віртуальну машину через канал:

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

Використовуйте `--replace-path`, коли вкладений список дозволів має точно відповідати значенню з виправлення, наприклад під час заміни списку дозволених каналів Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Повний довідник із налаштування каналів див. у розділах [Discord](/uk/channels/discord) і [Slack](/uk/channels/slack).

## Віддалений доступ

exe.dev забезпечує автентифікацію для віддаленого доступу. Типово HTTP-трафік із порту 8000 переспрямовується на `https://<vm-name>.exe.xyz` з автентифікацією електронною поштою.

## Оновлення

```bash
openclaw update
```

Перемикання каналів оновлень і ручне відновлення описано в розділі [Оновлення](/uk/install/updating).

## Пов’язані матеріали

- [Віддалений Gateway](/uk/gateway/remote)
- [Огляд установлення](/uk/install)
