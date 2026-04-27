---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io зі сталим сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-27T07:08:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 15
---

# Розгортання Fly.io

**Мета:** Gateway OpenClaw, що працює на машині [Fly.io](https://fly.io), зі сталим сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що вам потрібно

- встановлений [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- обліковий запис Fly.io (безкоштовний тариф підходить)
- автентифікація моделі: API-ключ для вибраного вами постачальника моделей
- облікові дані каналу: токен Discord-бота, токен Telegram тощо

## Швидкий шлях для початківців

1. Клонуйте репозиторій → налаштуйте `fly.toml`
2. Створіть застосунок і том → задайте секрети
3. Розгорніть за допомогою `fly deploy`
4. Увійдіть через SSH, щоб створити конфігурацію, або скористайтеся Control UI

<Steps>
  <Step title="Створіть застосунок Fly">
    ```bash
    # Клонуйте репозиторій
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Створіть новий застосунок Fly (виберіть власну назву)
    fly apps create my-openclaw

    # Створіть сталий том (зазвичай достатньо 1GB)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Порада:** Виберіть регіон поблизу вас. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml`, щоб він відповідав назві вашого застосунку та вашим вимогам.

    **Примітка щодо безпеки:** Конфігурація за замовчуванням відкриває публічну URL-адресу. Для захищеного розгортання без публічної IP-адреси див. [Приватне розгортання](#private-deployment-hardened) або використовуйте `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Назва вашого застосунку
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
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Прив’язує до `0.0.0.0`, щоб проксі Fly міг досягти gateway                  |
    | `--allow-unconfigured`        | Запускає без файла конфігурації (ви створите його пізніше)                  |
    | `internal_port = 3000`        | Має збігатися з `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для перевірок стану Fly |
    | `memory = "2048mb"`           | 512MB замало; рекомендовано 2GB                                             |
    | `OPENCLAW_STATE_DIR = "/data"`| Зберігає стан у томі                                                        |

  </Step>

  <Step title="Задайте секрети">
    ```bash
    # Обов’язково: токен Gateway (для прив’язки не до loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API-ключі постачальників моделей
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Необов’язково: інші постачальники
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Токени каналів
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Примітки:**

    - Прив’язки не до loopback (`--bind lan`) потребують дійсного шляху автентифікації gateway. У цьому прикладі Fly.io використовується `OPENCLAW_GATEWAY_TOKEN`, але вимогу також задовольняють `gateway.auth.password` або правильно налаштоване розгортання `trusted-proxy` не на loopback.
    - Ставтеся до цих токенів як до паролів.
    - **Надавайте перевагу env vars замість файла конфігурації** для всіх API-ключів і токенів. Це не дозволить секретам потрапити в `openclaw.json`, де вони можуть бути випадково розкриті або записані в журнали.

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
    Підключіться до машини через SSH, щоб створити правильну конфігурацію:

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

    **Примітка:** Замініть `https://my-openclaw.fly.dev` на справжнє
    origin вашого застосунку Fly. Під час запуску Gateway ініціалізує локальні origin для Control UI на основі значень `--bind` і `--port` у середовищі виконання, тож перший запуск може відбутися ще до існування конфігурації, але для доступу з браузера через Fly все одно потрібно точно вказати HTTPS origin у
    `gateway.controlUi.allowedOrigins`.

    **Примітка:** Токен Discord може надходити з одного з двох джерел:

    - змінна середовища: `DISCORD_BOT_TOKEN` (рекомендовано для секретів)
    - файл конфігурації: `channels.discord.token`

    Якщо ви використовуєте env var, додавати токен до конфігурації не потрібно. Gateway автоматично зчитує `DISCORD_BOT_TOKEN`.

    Перезапустіть, щоб застосувати зміни:

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

    Автентифікуйтеся за допомогою налаштованого спільного секрету. У цьому посібнику використовується токен gateway з `OPENCLAW_GATEWAY_TOKEN`; якщо ви перейшли на автентифікацію за паролем, використовуйте натомість цей пароль.

    ### Журнали

    ```bash
    fly logs              # Журнали в реальному часі
    fly logs --no-tail    # Останні журнали
    ```

    ### Консоль SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення проблем

### "App is not listening on expected address"

Gateway прив’язується до `127.0.0.1`, а не до `0.0.0.0`.

**Виправлення:** Додайте `--bind lan` до команди процесу в `fly.toml`.

### Перевірки стану не проходять / connection refused

Fly не може досягти gateway на налаштованому порту.

**Виправлення:** Переконайтеся, що `internal_port` збігається з портом gateway (задайте `--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або завершується примусово. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або тихі перезапуски.

**Виправлення:** Збільште обсяг пам’яті в `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Примітка:** 512MB замало. 1GB може працювати, але може призвести до OOM під навантаженням або з докладним журналюванням. **Рекомендовано 2GB.**

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками на кшталт "already running".

Це трапляється, коли контейнер перезапускається, але файл блокування PID зберігається в томі.

**Виправлення:** Видаліть файл блокування:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Файл блокування розташований за шляхом `/data/gateway.*.lock` (не в підкаталозі).

### Конфігурація не зчитується

`--allow-unconfigured` лише обходить перевірку під час запуску. Він не створює й не відновлює `/data/openclaw.json`, тож переконайтеся, що ваша справжня конфігурація існує і містить `gateway.mode="local"`, якщо вам потрібен звичайний локальний запуск gateway.

Перевірте, що конфігурація існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

Команда `fly ssh console -C` не підтримує перенаправлення оболонки. Щоб записати файл конфігурації:

```bash
# Використовуйте echo + tee (передайте з локальної машини на віддалену)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Або використовуйте sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Примітка:** `fly sftp` може завершитися помилкою, якщо файл уже існує. Спочатку видаліть його:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Стан не зберігається

Якщо після перезапуску ви втрачаєте профілі автентифікації, стан каналу/постачальника або сесії,
це означає, що каталог стану записується у файлову систему контейнера.

**Виправлення:** Переконайтеся, що в `fly.toml` задано `OPENCLAW_STATE_DIR=/data`, і виконайте повторне розгортання.

## Оновлення

```bash
# Отримайте останні зміни
git pull

# Повторно розгорніть
fly deploy

# Перевірте стан
fly status
fly logs
```

### Оновлення команди машини

Якщо вам потрібно змінити команду запуску без повного повторного розгортання:

```bash
# Отримайте ID машини
fly machines list

# Оновіть команду
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Або разом зі збільшенням пам’яті
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Примітка:** Після `fly deploy` команда машини може скинутися до значення з `fly.toml`. Якщо ви вносили зміни вручну, застосуйте їх повторно після розгортання.

## Приватне розгортання (захищене)

За замовчуванням Fly виділяє публічні IP-адреси, роблячи ваш gateway доступним за адресою `https://your-app.fly.dev`. Це зручно, але означає, що ваше розгортання можуть виявити інтернет-сканери (Shodan, Censys тощо).

Для захищеного розгортання **без публічної доступності** використовуйте приватний шаблон.

### Коли варто використовувати приватне розгортання

- Ви виконуєте лише **вихідні** виклики/повідомлення (без вхідних Webhook)
- Ви використовуєте тунелі **ngrok або Tailscale** для будь-яких callback Webhook
- Ви отримуєте доступ до gateway через **SSH, проксі або WireGuard**, а не через браузер
- Ви хочете **приховати** розгортання від інтернет-сканерів

### Налаштування

Використовуйте `fly.private.toml` замість стандартної конфігурації:

```bash
# Розгорніть із приватною конфігурацією
fly deploy -c fly.private.toml
```

Або перетворіть наявне розгортання:

```bash
# Перелічіть поточні IP
fly ips list -a my-openclaw

# Звільніть публічні IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Перейдіть на приватну конфігурацію, щоб майбутні розгортання не перевиділяли публічні IP
# (видаліть [http_service] або розгорніть за допомогою приватного шаблону)
fly deploy -c fly.private.toml

# Виділіть лише приватний IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Після цього `fly ips list` має показувати лише IP типу `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Доступ до приватного розгортання

Оскільки публічної URL-адреси немає, використовуйте один із цих способів:

**Варіант 1: Локальний проксі (найпростіше)**

```bash
# Перенаправте локальний порт 3000 до застосунку
fly proxy 3000:3000 -a my-openclaw

# Потім відкрийте в браузері http://localhost:3000
```

**Варіант 2: VPN WireGuard**

```bash
# Створіть конфігурацію WireGuard (одноразово)
fly wireguard create

# Імпортуйте до клієнта WireGuard, потім отримайте доступ через внутрішній IPv6
# Приклад: http://[fdaa:x:x:x:x::x]:3000
```

**Варіант 3: Лише SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook у приватному розгортанні

Якщо вам потрібні callback Webhook (Twilio, Telnyx тощо) без публічної доступності:

1. **тунель ngrok** — запустіть ngrok всередині контейнера або як sidecar
2. **Tailscale Funnel** — відкрийте конкретні шляхи через Tailscale
3. **лише вихідний трафік** — деякі постачальники (Twilio) добре працюють для вихідних викликів без Webhook

Приклад конфігурації голосових викликів з ngrok:

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

Тунель ngrok працює всередині контейнера та надає публічну URL-адресу Webhook, не відкриваючи сам застосунок Fly. Установіть `webhookSecurity.allowedHosts` на ім’я хоста публічного тунелю, щоб переслані заголовки host приймалися.

### Переваги безпеки

| Аспект            | Публічне     | Приватне   |
| ----------------- | ------------ | ---------- |
| Інтернет-сканери  | Виявляється  | Приховане  |
| Прямі атаки       | Можливі      | Заблоковані |
| Доступ до Control UI | Браузер   | Проксі/VPN |
| Доставка Webhook  | Напряму      | Через тунель |

## Примітки

- Fly.io використовує **архітектуру x86** (не ARM)
- Dockerfile сумісний з обома архітектурами
- Для onboarding WhatsApp/Telegram використовуйте `fly ssh console`
- Постійні дані зберігаються в томі за шляхом `/data`
- Signal потребує Java + `signal-cli`; використовуйте власний образ і тримайте пам’ять на рівні 2GB+.

## Вартість

З рекомендованою конфігурацією (`shared-cpu-2x`, 2GB RAM):

- приблизно ~$10-15/місяць залежно від використання
- безкоштовний тариф включає певний ліміт

Докладніше див. у [тарифах Fly.io](https://fly.io/docs/about/pricing/).

## Подальші кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Hetzner](/uk/install/hetzner)
- [Docker](/uk/install/docker)
- [VPS-хостинг](/uk/vps)
