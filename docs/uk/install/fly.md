---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io з постійним сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T13:18:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Мета:** Gateway OpenClaw, що працює на машині [Fly.io](https://fly.io) з постійним сховищем, автоматичним HTTPS і доступом до Discord та інших каналів.

## Що вам потрібно

- Установлений [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Обліковий запис Fly.io (достатньо безплатного тарифу)
- Автентифікація моделі: ключ API для вибраного постачальника моделі
- Облікові дані каналів: токен бота Discord, токен Telegram тощо

## Швидкий шлях для початківців

1. Клонуйте репозиторій і налаштуйте `fly.toml`
2. Створіть застосунок і том, задайте секрети
3. Розгорніть за допомогою `fly deploy`
4. Підключіться через SSH, щоб створити конфігурацію, або скористайтеся інтерфейсом керування

<Steps>
  <Step title="Створіть застосунок Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # pick your own name
    fly apps create my-openclaw

    # 1GB is usually enough
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Виберіть найближчий до вас регіон. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml` відповідно до назви вашого застосунку та вимог. Відстежуваний у репозиторії файл `fly.toml` є загальнодоступним шаблоном, наведеним нижче; `deploy/fly.private.toml` — посилений варіант без загальнодоступної IP-адреси (див. [Приватне розгортання](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # your app name
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

    Точкою входу Docker-образу OpenClaw є `tini`, яка за замовчуванням запускає `node openclaw.mjs gateway`. Fly `[processes]` замінює Docker `CMD` (тут безпосередньо запускається `node dist/index.js gateway ...`, та сама скомпільована точка входу), не змінюючи `ENTRYPOINT`, тому процес і надалі працює під керуванням `tini`.

    **Ключові налаштування:**

    | Налаштування                   | Навіщо                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Прив’язує до `0.0.0.0`, щоб проксі Fly міг підключитися до Gateway          |
    | `--allow-unconfigured`         | Запускає без файлу конфігурації (ви створите його пізніше)                  |
    | `internal_port = 3000`         | Має збігатися з `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для перевірок працездатності Fly |
    | `memory = "2048mb"`            | 512 МБ замало; рекомендовано 2 ГБ                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | Зберігає стан на томі                                                       |

  </Step>

  <Step title="Задайте секрети">
    ```bash
    # required: gateway auth token for non-loopback binding
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # optional: other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Прив’язки не до local loopback (`--bind lan`) потребують дійсного способу автентифікації Gateway. У цьому прикладі використовується `OPENCLAW_GATEWAY_TOKEN`, але вимогу також задовольняють `gateway.auth.password` або правильно налаштоване розгортання довіреного проксі не на local loopback. Контракт SecretRef описано в розділі [Керування секретами](/uk/gateway/secrets).

    Ставтеся до цих токенів як до паролів. Для ключів API й токенів віддавайте перевагу змінним середовища/`fly secrets`, а не файлу конфігурації, щоб секрети не потрапляли до `openclaw.json`.

  </Step>

  <Step title="Розгорніть">
    ```bash
    fly deploy
    ```

    Під час першого розгортання створюється Docker-образ. Після розгортання перевірте:

    ```bash
    fly status
    fly logs
    ```

    Після запуску слухача HTTP/WebSocket Gateway записує в журнал `gateway ready`. Власна перевірка працездатності Fly відстежує `internal_port = 3000` відповідно до `fly.toml`; директива Docker `HEALTHCHECK` образу додатково опитує `/healthz` на стандартному порту 18789, який тут не використовується, оскільки в цьому розгортанні порт Gateway перевизначено параметром `--port 3000`.

  </Step>

  <Step title="Створіть файл конфігурації">
    Підключіться до машини через SSH, щоб створити належну конфігурацію:

    ```bash
    fly ssh console
    ```

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

    Якщо задано `OPENCLAW_STATE_DIR=/data`, шлях до конфігурації — `/data/openclaw.json`.

    Замініть `https://my-openclaw.fly.dev` фактичним джерелом вашого застосунку Fly. Під час запуску Gateway початково заповнює локальні джерела інтерфейсу керування зі значень `--bind` і `--port` середовища виконання, щоб перше завантаження могло відбутися до створення конфігурації, але для доступу з браузера через Fly точне джерело HTTPS однаково має бути зазначене в `gateway.controlUi.allowedOrigins`.

    Токен Discord можна отримати з одного з таких джерел:

    - Змінна середовища `DISCORD_BOT_TOKEN` (рекомендовано для секретів); додавати її до конфігурації не потрібно, Gateway зчитує її автоматично
    - Файл конфігурації `channels.discord.token`

    Перезапустіть, щоб застосувати зміни:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Отримайте доступ до Gateway">
    ### Інтерфейс керування

    ```bash
    fly open
    ```

    Або перейдіть на `https://my-openclaw.fly.dev/`.

    Автентифікуйтеся за допомогою налаштованого спільного секрету: токена Gateway з `OPENCLAW_GATEWAY_TOKEN` або пароля, якщо ви перейшли на автентифікацію за паролем.

    ### Журнали

    ```bash
    fly logs              # live logs
    fly logs --no-tail    # recent logs
    ```

    ### Консоль SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення несправностей

### «Застосунок не слухає за очікуваною адресою»

Gateway прив’язується до `127.0.0.1` замість `0.0.0.0`.

**Виправлення:** додайте `--bind lan` до команди процесу у `fly.toml`.

### Перевірки працездатності завершуються невдало / у з’єднанні відмовлено

Fly не може підключитися до Gateway через налаштований порт.

**Виправлення:** переконайтеся, що `internal_port` збігається з портом Gateway (`--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або примусово завершується. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або перезапуски без повідомлень.

**Виправлення:** збільште обсяг пам’яті у `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 МБ замало. 1 ГБ може бути достатньо, але за високого навантаження або детального журналювання можливий OOM. Рекомендовано 2 ГБ.

### Проблеми з блокуванням Gateway

Після перезапуску контейнера Gateway відмовляється запускатися через помилки «already running».

Файл блокування єдиного екземпляра розташований за шляхом `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (у Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), а не на постійному томі `/data`, тому повний перезапуск контейнера зазвичай видаляє його разом з рештою файлової системи контейнера. Якщо блокування збереглося (наприклад, після `fly machine restart`, що зберігає файлову систему контейнера) і перешкоджає запуску, видаліть його вручну:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Конфігурація не зчитується

`--allow-unconfigured` лише обходить перевірку під час запуску. Він не створює й не відновлює `/data/openclaw.json`, тому переконайтеся, що фактична конфігурація існує та містить `"gateway": { "mode": "local" }` для звичайного локального запуску Gateway.

Перевірте наявність конфігурації:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

`fly ssh console -C` не підтримує перенаправлення оболонки. Щоб записати файл конфігурації:

```bash
# echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# or sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` може завершитися невдало, якщо файл уже існує; спочатку видаліть його:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Стан не зберігається

Якщо після перезапуску зникають профілі автентифікації, стан каналів/постачальників або сеанси, каталог стану записується до файлової системи контейнера замість тому.

**Виправлення:** переконайтеся, що у `fly.toml` задано `OPENCLAW_STATE_DIR=/data`, і повторно розгорніть застосунок.

## Оновлення

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` — це контрольований шлях оновлення: образ повторно збирається з Dockerfile, тому версія CLI/Gateway, базовий образ ОС і всі зміни Dockerfile оновлюються разом. `openclaw update` усередині запущеного контейнера — це інша операція, оскільки образ постачається у вигляді створеного Docker дерева `dist/` без робочої копії `.git` і без глобального встановлення через npm, яке команда могла б виявити; опис цього процесу для встановлень на основі віртуальних машин див. у розділі [Оновлення](/uk/install/updating).

### Оновлення команди машини

Щоб змінити команду запуску без повного повторного розгортання:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# or with a memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Наступний запуск `fly deploy` поверне команду машини до значення з `fly.toml`; після повторного розгортання знову застосуйте внесені вручну зміни.

## Приватне розгортання (посилене)

За замовчуванням Fly виділяє загальнодоступні IP-адреси, тому ваш Gateway доступний за адресою `https://your-app.fly.dev`, а інтернет-сканери (Shodan, Censys тощо) можуть його виявити.

Використовуйте `deploy/fly.private.toml` для посиленого розгортання **без загальнодоступної IP-адреси**: у ньому немає `[http_service]`, тому загальнодоступний вхідний доступ не виділяється.

### Коли варто використовувати приватне розгортання

- Лише вихідні виклики/повідомлення (без вхідних Webhook)
- Тунелі ngrok або Tailscale обробляють усі зворотні виклики Webhook
- Доступ до Gateway здійснюється через SSH, проксі або WireGuard, а не через браузер
- Розгортання має бути приховане від інтернет-сканерів

### Налаштування

```bash
fly deploy -c deploy/fly.private.toml
```

Або перетворіть наявне розгортання:

```bash
# list current IPs
fly ips list -a my-openclaw

# release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# switch to the private config so future deploys do not re-allocate public IPs
fly deploy -c deploy/fly.private.toml

# allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Після цього `fly ips list` має показувати лише IP-адресу типу `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Доступ до приватного розгортання

**Варіант 1: локальний проксі (найпростіший)**

```bash
fly proxy 3000:3000 -a my-openclaw
# відкрити http://localhost:3000 у браузері
```

**Варіант 2: VPN WireGuard**

```bash
fly wireguard create
# імпортувати в клієнт WireGuard, а потім отримати доступ через внутрішню IPv6-адресу
# приклад: http://[fdaa:x:x:x:x::x]:3000
```

**Варіант 3: лише SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook у приватному розгортанні

Для зворотних викликів Webhook (Twilio, Telnyx тощо) без публічного доступу:

1. **Тунель ngrok**: запустіть ngrok усередині контейнера або як допоміжний контейнер
2. **Tailscale Funnel**: відкрийте доступ до певних шляхів через Tailscale
3. **Лише вихідні з’єднання**: деякі постачальники (Twilio) підтримують вихідні виклики без Webhook

Приклад конфігурації голосових викликів із ngrok у `plugins.entries.voice-call.config`:

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

Тунель ngrok працює всередині контейнера й надає публічну URL-адресу Webhook, не відкриваючи публічний доступ до самого застосунку Fly. Установіть для `webhookSecurity.allowedHosts` ім’я хоста тунелю, щоб дозволити переспрямовані заголовки хоста.

### Компроміси щодо безпеки

| Аспект                      | Публічне розгортання | Приватне розгортання |
| --------------------------- | -------------------- | -------------------- |
| Інтернет-сканери            | Можуть виявити        | Приховано            |
| Прямі атаки                 | Можливі               | Заблоковані          |
| Доступ до інтерфейсу керування | Браузер            | Проксі/VPN           |
| Доставка Webhook            | Безпосередньо         | Через тунель         |

## Примітки

- Fly.io використовує архітектуру x86; Dockerfile сумісний як з x86, так і з ARM.
- Для початкового налаштування WhatsApp/Telegram використовуйте `fly ssh console`.
- Постійні дані зберігаються на томі в `/data`.
- Для Signal в образі потрібен signal-cli (CLI на основі Java); використовуйте власний образ і виділіть щонайменше 2 ГБ пам’яті.

## Вартість

З рекомендованою конфігурацією (`shared-cpu-2x`, 2 ГБ оперативної пам’яті) очікуйте витрати приблизно 10–15 доларів США на місяць залежно від використання; безкоштовний рівень покриває частину базового ліміту. Актуальні тарифи дивіться на сторінці [тарифів Fly.io](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [Hetzner](/uk/install/hetzner)
- [Docker](/uk/install/docker)
- [Хостинг на VPS](/uk/vps)
