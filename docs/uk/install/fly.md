---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io з постійним сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T18:08:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Мета:** Gateway OpenClaw, що працює на машині [Fly.io](https://fly.io) з постійним сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що потрібно

- установлений [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- обліковий запис Fly.io (безкоштовний рівень підходить)
- автентифікація моделі: ключ API для вибраного постачальника моделі
- облікові дані каналу: токен бота Discord, токен Telegram тощо.

## Швидкий шлях для початківців

1. клонуйте репозиторій, налаштуйте `fly.toml`
2. створіть застосунок і том, задайте секрети
3. розгорніть за допомогою `fly deploy`
4. підключіться через SSH, щоб створити конфігурацію, або скористайтеся інтерфейсом керування

<Steps>
  <Step title="Створіть застосунок Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # виберіть власну назву
    fly apps create my-openclaw

    # зазвичай достатньо 1 ГБ
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Виберіть найближчий до вас регіон. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml` відповідно до назви застосунку та ваших вимог. Відстежуваний у репозиторії файл `fly.toml` — це загальнодоступний шаблон, наведений нижче; `deploy/fly.private.toml` — посилений варіант без загальнодоступної IP-адреси (див. [Приватне розгортання](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # назва вашого застосунку
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

    Точкою входу образу Docker OpenClaw є `tini`, яка за замовчуванням запускає `node openclaw.mjs gateway`. Fly `[processes]` замінює Docker `CMD` (тут безпосередньо запускається `node dist/index.js gateway ...`, та сама скомпільована точка входу), не змінюючи `ENTRYPOINT`, тому процес і далі виконується від імені `tini`.

    **Ключові параметри:**

    | Параметр                       | Навіщо                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Прив’язує до `0.0.0.0`, щоб проксі Fly міг звертатися до Gateway           |
    | `--allow-unconfigured`         | Запускає без файла конфігурації (його буде створено пізніше)                |
    | `internal_port = 3000`         | Має відповідати `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для перевірок працездатності Fly |
    | `memory = "2048mb"`            | 512 МБ замало; рекомендовано 2 ГБ                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | Зберігає стан на томі                                                       |

  </Step>

  <Step title="Задайте секрети">
    ```bash
    # обов’язково: токен автентифікації Gateway для прив’язування не до loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # ключі API постачальників моделей
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # необов’язково: інші постачальники
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # токени каналів
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Прив’язування не до loopback (`--bind lan`) потребує чинного способу автентифікації Gateway. У цьому прикладі використано `OPENCLAW_GATEWAY_TOKEN`, але `gateway.auth.password` або правильно налаштоване розгортання з довіреним проксі та прив’язуванням не до loopback також задовольняють цю вимогу. Контракт SecretRef описано в розділі [Керування секретами](/uk/gateway/secrets).

    Ставтеся до цих токенів як до паролів. Для ключів API й токенів віддавайте перевагу змінним середовища/`fly secrets`, а не файлу конфігурації, щоб секрети не потрапляли до `openclaw.json`.

  </Step>

  <Step title="Розгорніть">
    ```bash
    fly deploy
    ```

    Під час першого розгортання створюється образ Docker. Перевірте після розгортання:

    ```bash
    fly status
    fly logs
    ```

    Після запуску слухача HTTP/WebSocket Gateway записує до журналу `gateway ready`. Власна перевірка працездатності Fly відстежує `internal_port = 3000` відповідно до `fly.toml`; директива Docker `HEALTHCHECK` в образі додатково опитує `/healthz` на стандартному порту 18789, який тут не використовується, оскільки це розгортання перевизначає порт Gateway на `--port 3000`.

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

    За наявності `OPENCLAW_STATE_DIR=/data` шлях до конфігурації — `/data/openclaw.json`.

    Замініть `https://my-openclaw.fly.dev` фактичним джерелом вашого застосунку Fly. Під час запуску Gateway початковий список локальних джерел інтерфейсу керування формується зі значень середовища виконання `--bind` і `--port`, щоб перше завантаження могло відбутися до створення конфігурації, але для доступу з браузера через Fly точне джерело HTTPS усе одно має бути вказане в `gateway.controlUi.allowedOrigins`.

    Токен Discord можна отримати з одного з таких джерел:

    - змінна середовища `DISCORD_BOT_TOKEN` (рекомендовано для секретів); додавати її до конфігурації не потрібно, Gateway зчитує її автоматично
    - файл конфігурації `channels.discord.token`

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

    Або перейдіть за адресою `https://my-openclaw.fly.dev/`.

    Пройдіть автентифікацію за допомогою налаштованого спільного секрету: токена Gateway з `OPENCLAW_GATEWAY_TOKEN` або пароля, якщо ви перейшли на автентифікацію за паролем.

    ### Журнали

    ```bash
    fly logs              # журнали в реальному часі
    fly logs --no-tail    # останні журнали
    ```

    ### Консоль SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення несправностей

### «Застосунок не прослуховує очікувану адресу»

Gateway прив’язується до `127.0.0.1` замість `0.0.0.0`.

**Виправлення:** додайте `--bind lan` до команди процесу в `fly.toml`.

### Перевірки працездатності завершуються невдало / у з’єднанні відмовлено

Fly не може звернутися до Gateway через налаштований порт.

**Виправлення:** переконайтеся, що `internal_port` відповідає порту Gateway (`--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або примусово завершується. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або перезапуски без повідомлень.

**Виправлення:** збільште обсяг пам’яті в `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 МБ замало. 1 ГБ може бути достатньо, але під навантаженням або за докладного журналювання може виникати OOM. Рекомендовано 2 ГБ.

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками «already running» після перезапуску контейнера.

Файли блокування середовища виконання розташовані в `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
і `gateway.state.<hash>.lock` (у Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), а не на постійному томі `/data`, тому
повний перезапуск контейнера зазвичай видаляє їх разом з рештою файлової
системи контейнера. Якщо блокування збереглося (наприклад, через `fly machine restart`,
що зберігає файлову систему контейнера) і перешкоджає запуску, видаліть його
вручну:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Конфігурація не зчитується

`--allow-unconfigured` лише обходить перевірку під час запуску. Цей параметр не створює й не виправляє `/data/openclaw.json`, тому переконайтеся, що фактична конфігурація існує та містить `"gateway": { "mode": "local" }` для звичайного локального запуску Gateway.

Переконайтеся, що конфігурація існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

`fly ssh console -C` не підтримує переспрямування оболонки. Щоб записати файл конфігурації:

```bash
# echo + tee (канал із локальної системи до віддаленої)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# або sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` може завершитися невдало, якщо файл уже існує; спершу видаліть його:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Стан не зберігається

Якщо після перезапуску зникають профілі автентифікації, стан каналу/постачальника або сеанси, каталог стану записується до файлової системи контейнера, а не на том.

**Виправлення:** переконайтеся, що `OPENCLAW_STATE_DIR=/data` задано в `fly.toml`, і повторно розгорніть застосунок.

## Оновлення

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` — це контрольований шлях у цьому випадку: він повторно збирає образ із Dockerfile, тому версія CLI/Gateway, базовий образ ОС і всі зміни Dockerfile оновлюються разом. `openclaw update` усередині запущеного контейнера — це інша операція, оскільки образ постачається як створене Docker дерево `dist/` без робочої копії `.git` і без глобального встановлення через npm, яке він міг би виявити; опис цього процесу для встановлень на віртуальних машинах див. у розділі [Оновлення](/uk/install/updating).

### Оновлення команди машини

Щоб змінити команду запуску без повного повторного розгортання:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# або зі збільшенням пам’яті
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Наступний `fly deploy` скине команду машини до значення з `fly.toml`; після повторного розгортання знову застосуйте зміни, внесені вручну.

## Приватне розгортання (посилене)

За замовчуванням Fly виділяє загальнодоступні IP-адреси, тому ваш Gateway доступний за адресою `https://your-app.fly.dev` і може бути виявлений інтернет-сканерами (Shodan, Censys тощо).

Використовуйте `deploy/fly.private.toml` для посиленого розгортання **без загальнодоступної IP-адреси**: у ньому немає `[http_service]`, тому загальнодоступний вхідний доступ не виділяється.

### Коли використовувати приватне розгортання

- лише вихідні виклики/повідомлення (без вхідних вебхуків)
- тунелі ngrok або Tailscale обробляють усі зворотні виклики вебхуків
- доступ до Gateway здійснюється через SSH, проксі або WireGuard, а не через браузер
- розгортання має бути приховане від інтернет-сканерів

### Налаштування

```bash
fly deploy -c deploy/fly.private.toml
```

Або перетворіть наявне розгортання:

```bash
# перелічити поточні IP-адреси
fly ips list -a my-openclaw

# звільнити публічні IP-адреси
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# перейти на приватну конфігурацію, щоб майбутні розгортання не виділяли публічні IP-адреси повторно
fly deploy -c deploy/fly.private.toml

# виділити IPv6 лише для приватного доступу
fly ips allocate-v6 --private -a my-openclaw
```

Після цього `fly ips list` має показувати лише IP-адресу типу `private`:

```text
ВЕРСІЯ  IP                   ТИП              РЕГІОН
v6      fdaa:x:x:x:x::x      приватна         глобальний
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
# імпортувати до клієнта WireGuard, а потім отримати доступ через внутрішню IPv6-адресу
# приклад: http://[fdaa:x:x:x:x::x]:3000
```

**Варіант 3: лише SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook із приватним розгортанням

Для зворотних викликів Webhook (Twilio, Telnyx тощо) без публічного доступу:

1. **тунель ngrok**: запустіть ngrok усередині контейнера або як допоміжний контейнер
2. **Tailscale Funnel**: надайте доступ до певних шляхів через Tailscale
3. **лише вихідні з’єднання**: деякі постачальники (Twilio) дають змогу здійснювати вихідні виклики без Webhook

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

Тунель ngrok працює всередині контейнера й надає публічну URL-адресу Webhook, не відкриваючи публічного доступу до самого застосунку Fly. Установіть для `webhookSecurity.allowedHosts` ім’я хоста тунелю, щоб дозволити переспрямовані заголовки хоста.

### Компроміси щодо безпеки

| Аспект                    | Публічне         | Приватне       |
| ------------------------- | ---------------- | -------------- |
| Інтернет-сканери          | Можна виявити    | Приховано      |
| Прямі атаки               | Можливі          | Заблоковані    |
| Доступ до інтерфейсу керування | Через браузер | Через проксі/VPN |
| Доставка Webhook          | Безпосередньо    | Через тунель   |

## Примітки

- Fly.io використовує архітектуру x86; Dockerfile сумісний як із x86, так і з ARM.
- Для початкового налаштування WhatsApp/Telegram використовуйте `fly ssh console`.
- Постійні дані зберігаються на томі за шляхом `/data`.
- Для Signal в образі потрібен signal-cli (CLI на основі Java); використовуйте власний образ і виділіть щонайменше 2GB пам’яті.

## Вартість

За рекомендованої конфігурації (`shared-cpu-2x`, 2GB оперативної пам’яті) очікуйте витрати приблизно $10-15 на місяць залежно від використання; безкоштовний рівень покриває частину базового ліміту. Поточні тарифи наведено на сторінці [цін Fly.io](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Hetzner](/uk/install/hetzner)
- [Docker](/uk/install/docker)
- [Розміщення на VPS](/uk/vps)
