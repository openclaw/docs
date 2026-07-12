---
read_when:
    - Развертывание OpenClaw на Fly.io
    - Настройка томов Fly, секретов и конфигурации первого запуска
summary: Пошаговое развертывание OpenClaw на Fly.io с постоянным хранилищем и HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T11:28:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Цель:** Gateway OpenClaw, работающий на машине [Fly.io](https://fly.io) с постоянным хранилищем, автоматическим HTTPS и доступом к Discord/каналам.

## Что потребуется

- Установленный [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Учётная запись Fly.io (подойдёт бесплатный тариф)
- Аутентификация модели: ключ API выбранного поставщика модели
- Учётные данные каналов: токен бота Discord, токен Telegram и т. д.

## Быстрый способ для начинающих

1. Клонируйте репозиторий и настройте `fly.toml`
2. Создайте приложение и том, задайте секреты
3. Выполните развёртывание с помощью `fly deploy`
4. Подключитесь по SSH, чтобы создать конфигурацию, или используйте веб-интерфейс управления

<Steps>
  <Step title="Создание приложения Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # выберите собственное имя
    fly apps create my-openclaw

    # обычно достаточно 1 ГБ
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Выберите ближайший к вам регион. Распространённые варианты: `lhr` (Лондон), `iad` (Вирджиния), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Настройка fly.toml">
    Измените `fly.toml` в соответствии с именем приложения и вашими требованиями. Отслеживаемый в репозитории файл `fly.toml` — это общедоступный шаблон, приведённый ниже; `deploy/fly.private.toml` — усиленный вариант без общедоступного IP-адреса (см. [Закрытое развёртывание](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # имя вашего приложения
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

    Точкой входа Docker-образа OpenClaw служит `tini`, который по умолчанию запускает `node openclaw.mjs gateway`. Fly `[processes]` заменяет Docker-команду `CMD` (здесь напрямую запускается `node dist/index.js gateway ...` — та же скомпилированная точка входа), не изменяя `ENTRYPOINT`, поэтому процесс по-прежнему работает под управлением `tini`.

    **Основные параметры:**

    | Параметр                       | Назначение                                                                  |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Привязывает к `0.0.0.0`, чтобы прокси Fly мог обращаться к Gateway          |
    | `--allow-unconfigured`         | Запускает без файла конфигурации (его можно создать позднее)                |
    | `internal_port = 3000`         | Должен совпадать с `--port 3000` (или `OPENCLAW_GATEWAY_PORT`) для проверок работоспособности Fly |
    | `memory = "2048mb"`            | 512 МБ недостаточно; рекомендуется 2 ГБ                                     |
    | `OPENCLAW_STATE_DIR = "/data"` | Сохраняет состояние на томе                                                  |

  </Step>

  <Step title="Задание секретов">
    ```bash
    # обязательно: токен аутентификации Gateway для привязки не к loopback-интерфейсу
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # ключи API поставщиков моделей
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # необязательно: другие поставщики
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # токены каналов
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Для привязки не к local loopback (`--bind lan`) требуется действующий способ аутентификации Gateway. В этом примере используется `OPENCLAW_GATEWAY_TOKEN`, но требование также выполняется при использовании `gateway.auth.password` или правильно настроенного развёртывания с доверенным прокси и привязкой не к local loopback. Контракт SecretRef описан в разделе [Управление секретами](/ru/gateway/secrets).

    Обращайтесь с этими токенами как с паролями. Для ключей API и токенов предпочтительнее использовать переменные среды/`fly secrets`, а не файл конфигурации, чтобы секреты не попадали в `openclaw.json`.

  </Step>

  <Step title="Развёртывание">
    ```bash
    fly deploy
    ```

    При первом развёртывании создаётся Docker-образ. После развёртывания выполните проверку:

    ```bash
    fly status
    fly logs
    ```

    После запуска прослушивателя HTTP/WebSocket Gateway выводит в журнал `gateway ready`. Собственная проверка работоспособности Fly отслеживает `internal_port = 3000` согласно `fly.toml`; директива Docker `HEALTHCHECK` образа дополнительно опрашивает `/healthz` на порте 18789 по умолчанию, который здесь не используется, поскольку это развёртывание переопределяет порт Gateway с помощью `--port 3000`.

  </Step>

  <Step title="Создание файла конфигурации">
    Подключитесь к машине по SSH, чтобы создать полноценную конфигурацию:

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

    При `OPENCLAW_STATE_DIR=/data` путь к конфигурации — `/data/openclaw.json`.

    Замените `https://my-openclaw.fly.dev` реальным источником приложения Fly. При запуске Gateway добавляет локальные источники веб-интерфейса управления на основе значений `--bind` и `--port` среды выполнения, чтобы первый запуск мог состояться до появления конфигурации, однако для доступа через браузер посредством Fly точный HTTPS-источник всё равно должен быть указан в `gateway.controlUi.allowedOrigins`.

    Токен Discord можно получить из одного из следующих источников:

    - Переменная среды `DISCORD_BOT_TOKEN` (рекомендуется для секретов); добавлять её в конфигурацию не нужно — Gateway считывает её автоматически
    - Файл конфигурации, параметр `channels.discord.token`

    Перезапустите, чтобы применить изменения:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Доступ к Gateway">
    ### Веб-интерфейс управления

    ```bash
    fly open
    ```

    Или откройте `https://my-openclaw.fly.dev/`.

    Выполните аутентификацию с помощью настроенного общего секрета: токена Gateway из `OPENCLAW_GATEWAY_TOKEN` или пароля, если вы перешли на аутентификацию по паролю.

    ### Журналы

    ```bash
    fly logs              # журналы в реальном времени
    fly logs --no-tail    # последние журналы
    ```

    ### Консоль SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Устранение неполадок

### «Приложение не прослушивает ожидаемый адрес»

Gateway привязан к `127.0.0.1`, а не к `0.0.0.0`.

**Исправление:** добавьте `--bind lan` в команду процесса в `fly.toml`.

### Ошибка проверок работоспособности / отказ в подключении

Fly не может подключиться к Gateway через настроенный порт.

**Исправление:** убедитесь, что `internal_port` совпадает с портом Gateway (`--port 3000` или `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблемы с памятью

Контейнер постоянно перезапускается или принудительно завершается. Признаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` или перезапуски без сообщений.

**Исправление:** увеличьте объём памяти в `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Или обновите существующую машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 МБ недостаточно. 1 ГБ может работать, но при нагрузке или подробном журналировании возможно исчерпание памяти. Рекомендуется 2 ГБ.

### Проблемы с блокировкой Gateway

После перезапуска контейнера Gateway отказывается запускаться из-за ошибки «уже запущен».

Файл блокировки единственного экземпляра находится по пути `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (в Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), а не на постоянном томе `/data`, поэтому полный перезапуск контейнера обычно удаляет его вместе с остальной файловой системой контейнера. Если блокировка сохраняется (например, после `fly machine restart`, сохраняющего файловую систему контейнера) и препятствует запуску, удалите её вручную:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Конфигурация не считывается

`--allow-unconfigured` лишь отключает проверку при запуске. Этот параметр не создаёт и не исправляет `/data/openclaw.json`, поэтому убедитесь, что реальная конфигурация существует и содержит `"gateway": { "mode": "local" }` для обычного локального запуска Gateway.

Убедитесь, что конфигурация существует:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запись конфигурации через SSH

`fly ssh console -C` не поддерживает перенаправление оболочки. Чтобы записать файл конфигурации:

```bash
# echo + tee (передача по каналу с локальной машины на удалённую)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# или sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` может завершиться с ошибкой, если файл уже существует; сначала удалите его:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Состояние не сохраняется

Если после перезапуска исчезают профили аутентификации, состояние каналов/поставщиков или сеансы, каталог состояния записывается в файловую систему контейнера, а не на том.

**Исправление:** убедитесь, что в `fly.toml` задано `OPENCLAW_STATE_DIR=/data`, и повторите развёртывание.

## Обновление

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` — рекомендуемый здесь управляемый способ: образ заново собирается из Dockerfile, поэтому версия CLI/Gateway, базовый образ ОС и любые изменения Dockerfile обновляются вместе. Выполнение `openclaw update` внутри работающего контейнера — это другая операция, поскольку образ поставляется в виде созданного Docker-контейнером дерева `dist/` без рабочей копии `.git` и без глобальной установки через npm, которую можно было бы обнаружить; этот процесс для установок в стиле виртуальной машины описан в разделе [Обновление](/ru/install/updating).

### Обновление команды машины

Чтобы изменить команду запуска без полного повторного развёртывания:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# или с увеличением объёма памяти
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

При последующем выполнении `fly deploy` команда машины сбрасывается до значения из `fly.toml`; после повторного развёртывания примените ручные изменения заново.

## Закрытое развёртывание (усиленная защита)

По умолчанию Fly выделяет общедоступные IP-адреса, поэтому Gateway доступен по адресу `https://your-app.fly.dev` и может быть обнаружен интернет-сканерами (Shodan, Censys и т. д.).

Для усиленного развёртывания **без общедоступного IP-адреса** используйте `deploy/fly.private.toml`: в нём отсутствует `[http_service]`, поэтому общедоступная точка входа не выделяется.

### Когда следует использовать закрытое развёртывание

- Только исходящие вызовы/сообщения (без входящих веб-хуков)
- Обратные вызовы веб-хуков обрабатываются туннелями ngrok или Tailscale
- Доступ к Gateway выполняется через SSH, прокси или WireGuard, а не через браузер
- Развёртывание должно быть скрыто от интернет-сканеров

### Настройка

```bash
fly deploy -c deploy/fly.private.toml
```

Или преобразуйте существующее развёртывание:

```bash
# вывести текущие IP-адреса
fly ips list -a my-openclaw

# освободить общедоступные IP-адреса
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# перейти на закрытую конфигурацию, чтобы будущие развёртывания не выделяли общедоступные IP-адреса повторно
fly deploy -c deploy/fly.private.toml

# выделить только закрытый IPv6-адрес
fly ips allocate-v6 --private -a my-openclaw
```

После этого команда `fly ips list` должна показывать только IP-адрес типа `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Доступ к приватному развертыванию

**Вариант 1: локальный прокси (самый простой)**

```bash
fly proxy 3000:3000 -a my-openclaw
# откройте http://localhost:3000 в браузере
```

**Вариант 2: VPN WireGuard**

```bash
fly wireguard create
# импортируйте конфигурацию в клиент WireGuard, затем подключитесь через внутренний IPv6-адрес
# пример: http://[fdaa:x:x:x:x::x]:3000
```

**Вариант 3: только SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook при приватном развертывании

Для обратных вызовов Webhook (Twilio, Telnyx и т. д.) без публичного доступа:

1. **Туннель ngrok**: запустите ngrok внутри контейнера или как вспомогательный контейнер
2. **Tailscale Funnel**: откройте доступ к определенным путям через Tailscale
3. **Только исходящие подключения**: некоторые провайдеры (например, Twilio) позволяют совершать исходящие вызовы без Webhook

Пример конфигурации голосовых вызовов с ngrok в `plugins.entries.voice-call.config`:

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

Туннель ngrok работает внутри контейнера и предоставляет публичный URL-адрес Webhook, не открывая публичный доступ к самому приложению Fly. Укажите имя хоста туннеля в `webhookSecurity.allowedHosts`, чтобы разрешить перенаправленные заголовки хоста.

### Компромиссы в области безопасности

| Аспект                  | Публичное развертывание | Приватное развертывание |
| ----------------------- | ----------------------- | ----------------------- |
| Интернет-сканеры        | Доступно для обнаружения | Скрыто                  |
| Прямые атаки            | Возможны                | Заблокированы           |
| Доступ к интерфейсу управления | Через браузер    | Через прокси/VPN        |
| Доставка Webhook        | Напрямую                | Через туннель           |

## Примечания

- Fly.io использует архитектуру x86; Dockerfile совместим как с x86, так и с ARM.
- Для первоначальной настройки WhatsApp/Telegram используйте `fly ssh console`.
- Постоянные данные хранятся на томе по пути `/data`.
- Для Signal в образе требуется signal-cli (CLI на основе Java); используйте собственный образ и выделите не менее 2 ГБ памяти.

## Стоимость

С рекомендуемой конфигурацией (`shared-cpu-2x`, 2 ГБ ОЗУ) стоимость составит примерно 10–15 долларов США в месяц в зависимости от использования; бесплатный тариф покрывает часть базовых ресурсов. Актуальные тарифы см. на странице [цен Fly.io](https://fly.io/docs/about/pricing/).

## Дальнейшие действия

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Регулярно обновляйте OpenClaw: [Обновление](/ru/install/updating)

## Связанные материалы

- [Обзор установки](/ru/install)
- [Hetzner](/ru/install/hetzner)
- [Docker](/ru/install/docker)
- [Размещение на VPS](/ru/vps)
