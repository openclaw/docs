---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io з постійним сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:40:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**Мета:** OpenClaw Gateway, що працює на машині [Fly.io](https://fly.io) з постійним сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що потрібно

- Установлений [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Обліковий запис Fly.io (безплатного рівня достатньо)
- Автентифікація моделі: API-ключ для вибраного постачальника моделі
- Облікові дані каналу: токен бота Discord, токен Telegram тощо.

## Швидкий шлях для початківців

1. Клонуйте репозиторій → налаштуйте `fly.toml`
2. Створіть застосунок і том → задайте секрети
3. Розгорніть за допомогою `fly deploy`
4. Увійдіть через SSH, щоб створити конфігурацію, або скористайтеся Control UI

<Steps>
  <Step title="Створіть застосунок Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Порада:** Виберіть регіон поблизу вас. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml`, щоб він відповідав назві вашого застосунку та вимогам.

    **Примітка щодо безпеки:** Типова конфігурація відкриває публічну URL-адресу. Для посиленого розгортання без публічної IP-адреси див. [Приватне розгортання](#private-deployment-hardened) або використовуйте `deploy/fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    Docker-образ OpenClaw використовує `tini` як свою точку входу. Команди процесів Fly замінюють Docker `CMD`, не замінюючи `ENTRYPOINT`, тому процес усе ще працює під `tini`.

    **Ключові параметри:**

    | Параметр                       | Навіщо                                                                     |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Прив’язує до `0.0.0.0`, щоб проксі Fly міг досягти Gateway                 |
    | `--allow-unconfigured`         | Запускає без файлу конфігурації (ви створите його пізніше)                 |
    | `internal_port = 3000`         | Має відповідати `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для перевірок працездатності Fly |
    | `memory = "2048mb"`            | 512 МБ замало; рекомендовано 2 ГБ                                          |
    | `OPENCLAW_STATE_DIR = "/data"` | Зберігає стан на томі                                                      |

  </Step>

  <Step title="Задайте секрети">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **Примітки:**

    - Прив’язки не до loopback (`--bind lan`) потребують чинного шляху автентифікації Gateway. Цей приклад Fly.io використовує `OPENCLAW_GATEWAY_TOKEN`, але `gateway.auth.password` або правильно налаштоване розгортання не-loopback `trusted-proxy` також задовольняють вимогу.
    - Поводьтеся з цими токенами як із паролями.
    - **Надавайте перевагу змінним середовища замість файлу конфігурації** для всіх API-ключів і токенів. Так секрети не потраплять до `openclaw.json`, де їх можна випадково розкрити або записати в журнали.

  </Step>

  <Step title="Розгорніть">
    ```bash
    fly deploy
    ```

    Перше розгортання збирає Docker-образ (~2-3 хвилини). Наступні розгортання швидші.

    Після розгортання перевірте:

    ```bash
    fly status
    fly logs
    ```

    Ви маєте побачити:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Створіть файл конфігурації">
    Увійдіть на машину через SSH, щоб створити правильну конфігурацію:

    ```bash
    fly ssh console
    ```

    Створіть каталог і файл конфігурації:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Примітка:** З `OPENCLAW_STATE_DIR=/data` шлях до конфігурації — `/data/openclaw.json`.

    **Примітка:** Замініть `https://my-openclaw.fly.dev` на справжнє походження
    вашого застосунку Fly. Під час запуску Gateway початково додає локальні походження Control UI з runtime-значень
    `--bind` і `--port`, щоб перше завантаження могло пройти ще до появи конфігурації,
    але доступ через браузер через Fly усе одно потребує точного HTTPS-походження, указаного в
    `gateway.controlUi.allowedOrigins`.

    **Примітка:** Токен Discord може надходити з будь-якого з цих місць:

    - Змінна середовища: `DISCORD_BOT_TOKEN` (рекомендовано для секретів)
    - Файл конфігурації: `channels.discord.token`

    Якщо використовується змінна середовища, токен не потрібно додавати до конфігурації. Gateway автоматично читає `DISCORD_BOT_TOKEN`.

    Перезапустіть, щоб застосувати:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Отримайте доступ до Gateway">
    ### Control UI

    Відкрийте в браузері:

    ```bash
    fly open
    ```

    Або перейдіть на `https://my-openclaw.fly.dev/`

    Автентифікуйтеся за допомогою налаштованого спільного секрету. У цьому посібнику використовується токен Gateway
    з `OPENCLAW_GATEWAY_TOKEN`; якщо ви перейшли на автентифікацію паролем, використовуйте
    натомість цей пароль.

    ### Журнали

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH-консоль

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення несправностей

### "Застосунок не слухає на очікуваній адресі"

Gateway прив’язується до `127.0.0.1` замість `0.0.0.0`.

**Виправлення:** Додайте `--bind lan` до команди процесу в `fly.toml`.

### Перевірки працездатності не проходять / з’єднання відхилено

Fly не може досягти Gateway на налаштованому порту.

**Виправлення:** Переконайтеся, що `internal_port` відповідає порту Gateway (задайте `--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або завершується примусово. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або тихі перезапуски.

**Виправлення:** Збільште пам’ять у `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Примітка:** 512 МБ замало. 1 ГБ може працювати, але може призводити до OOM під навантаженням або з детальним журналюванням. **Рекомендовано 2 ГБ.**

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками "already running".

Це трапляється, коли контейнер перезапускається, але файл PID-блокування зберігається на томі.

**Виправлення:** Видаліть файл блокування:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Файл блокування розташований за шляхом `/data/gateway.*.lock` (не в підкаталозі).

### Конфігурація не читається

`--allow-unconfigured` лише обходить захист запуску. Він не створює й не відновлює `/data/openclaw.json`, тож переконайтеся, що ваша справжня конфігурація існує та містить `gateway.mode="local"`, коли вам потрібен звичайний запуск локального Gateway.

Перевірте, що конфігурація існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

Команда `fly ssh console -C` не підтримує перенаправлення shell. Щоб записати файл конфігурації:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Примітка:** `fly sftp` може завершитися помилкою, якщо файл уже існує. Спочатку видаліть його:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Стан не зберігається

Якщо після перезапуску ви втрачаєте профілі автентифікації, стан каналів/постачальників або сесії,
каталог стану записується у файлову систему контейнера.

**Виправлення:** Переконайтеся, що `OPENCLAW_STATE_DIR=/data` задано в `fly.toml`, і розгорніть повторно.

## Оновлення

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Оновлення команди машини

Якщо потрібно змінити команду запуску без повного повторного розгортання:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Примітка:** Після `fly deploy` команда машини може скинутися до того, що вказано у `fly.toml`. Якщо ви вносили зміни вручну, застосуйте їх знову після розгортання.

## Приватне розгортання (посилене)

За замовчуванням Fly виділяє публічні IP-адреси, роблячи ваш Gateway доступним за `https://your-app.fly.dev`. Це зручно, але означає, що ваше розгортання можуть знайти інтернет-сканери (Shodan, Censys тощо).

Для посиленого розгортання **без публічного доступу** використовуйте приватний шаблон.

### Коли використовувати приватне розгортання

- Ви робите лише **вихідні** виклики/повідомлення (без вхідних Webhook)
- Ви використовуєте тунелі **ngrok або Tailscale** для будь-яких callback Webhook
- Ви отримуєте доступ до Gateway через **SSH, проксі або WireGuard** замість браузера
- Ви хочете, щоб розгортання було **приховане від інтернет-сканерів**

### Налаштування

Використовуйте `deploy/fly.private.toml` замість стандартної конфігурації:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Або перетворіть наявне розгортання:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Після цього `fly ips list` має показувати лише IP типу `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Доступ до приватного розгортання

Оскільки публічної URL-адреси немає, використовуйте один із цих методів:

**Варіант 1: Локальний проксі (найпростіше)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Варіант 2: WireGuard VPN**

```bash
# Створіть конфігурацію WireGuard (одноразово)
fly wireguard create

# Імпортуйте до клієнта WireGuard, потім отримайте доступ через внутрішній IPv6
# Приклад: http://[fdaa:x:x:x:x::x]:3000
```

**Варіант 3: лише SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook із приватним розгортанням

Якщо вам потрібні зворотні виклики webhook (Twilio, Telnyx тощо) без публічного доступу:

1. **тунель ngrok** - запустіть ngrok у контейнері або як sidecar
2. **Tailscale Funnel** - відкрийте доступ до певних шляхів через Tailscale
3. **Лише вихідний трафік** - деякі провайдери (Twilio) нормально працюють для вихідних викликів без webhook

Приклад конфігурації голосового виклику з ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Тунель ngrok працює всередині контейнера й надає публічну URL-адресу webhook без відкриття доступу до самого застосунку Fly. Установіть `webhookSecurity.allowedHosts` на публічне ім'я хоста тунелю, щоб переслані заголовки host приймалися.

### Переваги безпеки

| Аспект                | Публічне       | Приватне        |
| --------------------- | -------------- | --------------- |
| Інтернет-сканери      | Видиме         | Приховане       |
| Прямі атаки           | Можливі        | Заблоковані     |
| Доступ до Control UI  | Браузер        | Проксі/VPN      |
| Доставка webhook      | Напряму        | Через тунель    |

## Примітки

- Fly.io використовує **архітектуру x86** (не ARM)
- Dockerfile сумісний з обома архітектурами
- Для підключення WhatsApp/Telegram використовуйте `fly ssh console`
- Постійні дані зберігаються на томі в `/data`
- Signal потребує Java + signal-cli; використовуйте власний образ і залишайте пам'ять на рівні 2 ГБ+.

## Вартість

З рекомендованою конфігурацією (`shared-cpu-2x`, 2 ГБ RAM):

- ~$10-15/місяць залежно від використання
- Безкоштовний рівень містить певний ліміт

Докладніше див. [ціни Fly.io](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали повідомлень: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Hetzner](/uk/install/hetzner)
- [Docker](/uk/install/docker)
- [VPS-хостинг](/uk/vps)
