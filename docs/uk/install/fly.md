---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і початкової конфігурації
summary: Покрокове розгортання OpenClaw на Fly.io з постійним сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-23T20:56:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c409e4b2a8d9fb483bf09a3847095e6b880791dbd9e9ba4f557c5ee253d17260
    source_path: install/fly.md
    workflow: 15
---

# Розгортання на Fly.io

**Мета:** Gateway OpenClaw, запущений на машині [Fly.io](https://fly.io), з постійним сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що вам потрібно

- Установлений [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Обліковий запис Fly.io (працює безкоштовний рівень)
- Автентифікація моделі: API-ключ для вибраного провайдера моделі
- Облікові дані каналів: токен бота Discord, токен Telegram тощо

## Швидкий шлях для початківців

1. Клонуйте repo → налаштуйте `fly.toml`
2. Створіть app + volume → задайте secrets
3. Розгорніть через `fly deploy`
4. Увійдіть через SSH, щоб створити конфігурацію, або використайте Control UI

<Steps>
  <Step title="Створіть Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Порада:** Виберіть регіон, близький до вас. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml` відповідно до назви вашого app і вимог.

    **Примітка щодо безпеки:** Типова конфігурація відкриває публічний URL. Для посиленого розгортання без публічного IP див. [Private Deployment](#private-deployment-hardened) або використовуйте `fly.private.toml`.

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

    **Ключові параметри:**

    | Параметр                      | Навіщо                                                                      |
    | ----------------------------- | ---------------------------------------------------------------------------- |
    | `--bind lan`                  | Прив’язує до `0.0.0.0`, щоб проксі Fly міг досягти gateway                  |
    | `--allow-unconfigured`        | Дозволяє запуск без файла конфігурації (ви створите його пізніше)          |
    | `internal_port = 3000`        | Має збігатися з `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для health checks Fly |
    | `memory = "2048mb"`           | 512MB замало; рекомендовано 2GB                                             |
    | `OPENCLAW_STATE_DIR = "/data"`| Зберігає стан на volume                                                     |

  </Step>

  <Step title="Задайте secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Примітки:**

    - Прив’язки не через loopback (`--bind lan`) потребують валідного шляху автентифікації gateway. У цьому прикладі Fly.io використовується `OPENCLAW_GATEWAY_TOKEN`, але вимогу також задовольняють `gateway.auth.password` або правильно налаштоване розгортання `trusted-proxy` не через loopback.
    - Ставтеся до цих токенів як до паролів.
    - **Надавайте перевагу env vars замість файла конфігурації** для всіх API-ключів і токенів. Це не дає секретам потрапити в `openclaw.json`, де вони можуть бути випадково відкриті або записані в логи.

  </Step>

  <Step title="Розгорніть">
    ```bash
    fly deploy
    ```

    Перше розгортання збирає Docker-образ (~2–3 хвилини). Наступні розгортання швидші.

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
    Увійдіть на машину через SSH, щоб створити повноцінну конфігурацію:

    ```bash
    fly ssh console
    ```

    Створіть каталог конфігурації та файл:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.5"]
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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Примітка:** За `OPENCLAW_STATE_DIR=/data` шлях до конфігурації — `/data/openclaw.json`.

    **Примітка:** Токен Discord може надходити або з:

    - Змінної середовища: `DISCORD_BOT_TOKEN` (рекомендовано для секретів)
    - Файла конфігурації: `channels.discord.token`

    Якщо використовується env var, додавати токен до конфігурації не потрібно. Gateway автоматично читає `DISCORD_BOT_TOKEN`.

    Перезапустіть для застосування:

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

    Або перейдіть за адресою `https://my-openclaw.fly.dev/`

    Автентифікуйтеся за допомогою налаштованого shared secret. У цьому посібнику використовується токен gateway
    з `OPENCLAW_GATEWAY_TOKEN`; якщо ви перейшли на password auth, використовуйте
    натомість цей пароль.

    ### Логи

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення проблем

### "App is not listening on expected address"

Gateway прив’язується до `127.0.0.1`, а не до `0.0.0.0`.

**Виправлення:** Додайте `--bind lan` до команди процесу у `fly.toml`.

### Помилки health checks / connection refused

Fly не може досягти gateway на налаштованому порту.

**Виправлення:** Переконайтеся, що `internal_port` збігається з портом gateway (задайте `--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

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

**Примітка:** 512MB замало. 1GB може працювати, але під навантаженням або з verbose logging може виникати OOM. **Рекомендовано 2GB.**

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками "already running".

Це трапляється, коли контейнер перезапускається, але файл блокування PID залишається на volume.

**Виправлення:** Видаліть файл блокування:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Файл блокування розміщується в `/data/gateway.*.lock` (не в підкаталозі).

### Конфігурація не зчитується

`--allow-unconfigured` лише обходить стартовий захист. Він не створює і не виправляє `/data/openclaw.json`, тож переконайтеся, що ваша реальна конфігурація існує і містить `gateway.mode="local"`, якщо вам потрібен звичайний локальний запуск gateway.

Переконайтеся, що конфігурація існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

Команда `fly ssh console -C` не підтримує перенаправлення оболонки. Щоб записати файл конфігурації:

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

Якщо після перезапуску ви втрачаєте auth profiles, стан каналів/провайдерів або сесії,
каталог стану записується у файлову систему контейнера.

**Виправлення:** Переконайтеся, що `OPENCLAW_STATE_DIR=/data` задано в `fly.toml`, і виконайте повторне розгортання.

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

Якщо вам потрібно змінити стартову команду без повного повторного розгортання:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Примітка:** Після `fly deploy` команда машини може бути скинута до тієї, що вказана у `fly.toml`. Якщо ви вносили ручні зміни, повторно застосуйте їх після розгортання.

## Приватне розгортання (посилене)

Типово Fly виділяє публічні IP-адреси, роблячи ваш gateway доступним за адресою `https://your-app.fly.dev`. Це зручно, але означає, що ваше розгортання доступне для виявлення інтернет-сканерами (Shodan, Censys тощо).

Для посиленого розгортання **без публічної доступності** використовуйте приватний шаблон.

### Коли використовувати приватне розгортання

- Ви робите лише **вихідні** виклики/надсилаєте повідомлення (без вхідних Webhook)
- Ви використовуєте тунелі **ngrok або Tailscale** для будь-яких callback Webhook
- Ви отримуєте доступ до gateway через **SSH, proxy або WireGuard**, а не через браузер
- Ви хочете, щоб розгортання було **приховане від інтернет-сканерів**

### Налаштування

Використовуйте `fly.private.toml` замість стандартної конфігурації:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
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
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Після цього `fly ips list` має показувати лише IP типу `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Доступ до приватного розгортання

Оскільки публічного URL немає, використовуйте один із цих способів:

**Варіант 1: Локальний proxy (найпростіше)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Варіант 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Варіант 3: Лише SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook із приватним розгортанням

Якщо вам потрібні callback Webhook (Twilio, Telnyx тощо) без публічної доступності:

1. **Тунель ngrok** — запустіть ngrok усередині контейнера або як sidecar
2. **Tailscale Funnel** — відкрийте конкретні шляхи через Tailscale
3. **Лише вихідний трафік** — деякі провайдери (Twilio) чудово працюють для вихідних викликів без Webhook

Приклад конфігурації voice-call з ngrok:

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

Тунель ngrok працює всередині контейнера й надає публічний URL Webhook без відкриття самого Fly app. Установіть `webhookSecurity.allowedHosts` на публічне ім’я хоста тунелю, щоб forwarded host headers приймалися.

### Переваги для безпеки

| Аспект             | Публічне     | Приватне   |
| ------------------ | ------------ | ---------- |
| Інтернет-сканери   | Виявляється  | Приховане  |
| Прямі атаки        | Можливі      | Заблоковані |
| Доступ до Control UI | Браузер    | Proxy/VPN  |
| Доставка Webhook   | Напряму      | Через тунель |

## Примітки

- Fly.io використовує **архітектуру x86** (не ARM)
- Dockerfile сумісний з обома архітектурами
- Для онбордингу WhatsApp/Telegram використовуйте `fly ssh console`
- Постійні дані зберігаються на volume в `/data`
- Signal потребує Java + signal-cli; використовуйте власний образ і тримайте пам’ять на рівні 2GB+.

## Вартість

За рекомендованої конфігурації (`shared-cpu-2x`, 2GB RAM):

- ~$10-15/місяць залежно від використання
- Безкоштовний рівень містить певний ліміт

Докладніше див. у [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Channels](/uk/channels)
- Налаштуйте Gateway: [Gateway configuration](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Updating](/uk/install/updating)
