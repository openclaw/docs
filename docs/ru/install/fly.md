---
read_when:
    - Развертывание OpenClaw на Fly.io
    - Настройка томов Fly, секретов и конфигурации первого запуска
summary: Пошаговое развертывание OpenClaw на Fly.io с постоянным хранилищем и HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-13T19:52:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Цель:** Gateway OpenClaw, работающий на машине [Fly.io](https://fly.io) с постоянным хранилищем, автоматическим HTTPS и доступом через Discord/каналы.

## Что потребуется

- Установленный [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- Учетная запись Fly.io (подойдет бесплатный тариф)
- Аутентификация модели: ключ API выбранного поставщика модели
- Учетные данные каналов: токен бота Discord, токен Telegram и т. д.

## Быстрый путь для начинающих

1. Клонируйте репозиторий, настройте `fly.toml`
2. Создайте приложение и том, задайте секреты
3. Разверните с помощью `fly deploy`
4. Подключитесь по SSH, чтобы создать конфигурацию, или используйте интерфейс управления

<Steps>
  <Step title="Создайте приложение Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # выберите собственное имя
    fly apps create my-openclaw

    # обычно достаточно 1 ГБ
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Выберите ближайший к вам регион. Распространенные варианты: `lhr` (Лондон), `iad` (Вирджиния), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Настройте fly.toml">
    Отредактируйте `fly.toml` в соответствии с именем приложения и вашими требованиями. Отслеживаемый в репозитории файл `fly.toml` — это показанный ниже общедоступный шаблон; `deploy/fly.private.toml` — усиленный вариант без общедоступного IP-адреса (см. [Закрытое развертывание](#private-deployment-hardened)).

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

    Точкой входа Docker-образа OpenClaw служит `tini`, которая по умолчанию запускает `node openclaw.mjs gateway`. Fly `[processes]` заменяет Docker `CMD` (здесь он напрямую запускает `node dist/index.js gateway ...`, ту же скомпилированную точку входа), не затрагивая `ENTRYPOINT`, поэтому процесс по-прежнему выполняется от имени `tini`.

    **Основные параметры:**

    | Параметр                       | Назначение                                                                  |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Привязывается к `0.0.0.0`, чтобы прокси Fly мог обращаться к Gateway             |
    | `--allow-unconfigured`         | Запускается без файла конфигурации (вы создадите его позже)                 |
    | `internal_port = 3000`         | Должен совпадать с `--port 3000` (или `OPENCLAW_GATEWAY_PORT`) для проверок работоспособности Fly |
    | `memory = "2048mb"`            | 512 МБ недостаточно; рекомендуется 2 ГБ                                     |
    | `OPENCLAW_STATE_DIR = "/data"` | Сохраняет состояние на томе                                                 |

  </Step>

  <Step title="Задайте секреты">
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

    Для привязок не к loopback-интерфейсу (`--bind lan`) требуется действующий способ аутентификации Gateway. В этом примере используется `OPENCLAW_GATEWAY_TOKEN`, но требованию также удовлетворяет `gateway.auth.password` или правильно настроенное развертывание с доверенным прокси и привязкой не к loopback-интерфейсу. Контракт SecretRef описан в разделе [Управление секретами](/ru/gateway/secrets).

    Обращайтесь с этими токенами как с паролями. Для ключей API и токенов предпочитайте переменные среды/`fly secrets` файлу конфигурации, чтобы секреты не попадали в `openclaw.json`.

  </Step>

  <Step title="Разверните">
    ```bash
    fly deploy
    ```

    При первом развертывании создается Docker-образ. После развертывания выполните проверку:

    ```bash
    fly status
    fly logs
    ```

    После запуска HTTP/WebSocket-прослушивателя Gateway записывает в журнал `gateway ready`. Собственная проверка работоспособности Fly отслеживает `internal_port = 3000` согласно `fly.toml`; директива Docker `HEALTHCHECK` образа дополнительно опрашивает `/healthz` на порте по умолчанию 18789, который здесь не используется, поскольку в этом развертывании порт Gateway переопределен на `--port 3000`.

  </Step>

  <Step title="Создайте файл конфигурации">
    Подключитесь к машине по SSH, чтобы создать правильную конфигурацию:

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

    Замените `https://my-openclaw.fly.dev` реальным источником приложения Fly. При запуске Gateway локальные источники интерфейса управления инициализируются значениями среды выполнения `--bind` и `--port`, чтобы первая загрузка могла пройти до создания конфигурации, однако для доступа из браузера через Fly по-прежнему необходимо указать точный источник HTTPS в `gateway.controlUi.allowedOrigins`.

    Токен Discord можно получить одним из следующих способов:

    - Переменная среды `DISCORD_BOT_TOKEN` (рекомендуется для секретов); добавлять ее в конфигурацию не требуется — Gateway считывает ее автоматически
    - Файл конфигурации `channels.discord.token`

    Перезапустите, чтобы применить изменения:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Получите доступ к Gateway">
    ### Интерфейс управления

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

Gateway привязан к `127.0.0.1` вместо `0.0.0.0`.

**Исправление:** добавьте `--bind lan` в команду процесса в `fly.toml`.

### Проверки работоспособности завершаются с ошибкой / в подключении отказано

Fly не может обратиться к Gateway через настроенный порт.

**Исправление:** убедитесь, что `internal_port` соответствует порту Gateway (`--port 3000` или `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблемы с памятью

Контейнер постоянно перезапускается или принудительно завершается. Признаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` или перезапуски без сообщений.

**Исправление:** увеличьте объем памяти в `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Или обновите существующую машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 МБ недостаточно. 1 ГБ может работать, но при нагрузке или подробном журналировании возможен OOM. Рекомендуется 2 ГБ.

### Проблемы с блокировкой Gateway

После перезапуска контейнера Gateway отказывается запускаться с ошибками «уже запущен».

Файлы блокировки среды выполнения находятся в `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
и `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), а не на постоянном томе `/data`, поэтому
при полном перезапуске контейнера они обычно удаляются вместе с остальной
файловой системой контейнера. Если блокировка сохраняется (например, при `fly machine restart`,
который сохраняет файловую систему контейнера) и препятствует запуску, удалите ее
вручную:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Конфигурация не считывается

`--allow-unconfigured` только обходит проверку при запуске. Этот параметр не создает и не исправляет `/data/openclaw.json`, поэтому убедитесь, что реальная конфигурация существует и содержит `"gateway": { "mode": "local" }` для обычного запуска локального Gateway.

Убедитесь, что конфигурация существует:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запись конфигурации через SSH

`fly ssh console -C` не поддерживает перенаправление оболочки. Чтобы записать файл конфигурации:

```bash
# echo + tee (передача по каналу с локальной машины на удаленную)
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

**Исправление:** убедитесь, что `OPENCLAW_STATE_DIR=/data` задан в `fly.toml`, и повторите развертывание.

## Обновление

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` — контролируемый способ обновления в этом случае: он заново собирает образ из Dockerfile, поэтому версия CLI/Gateway, базовый образ ОС и все изменения Dockerfile обновляются вместе. `openclaw update` внутри работающего контейнера выполняет другую операцию, поскольку образ поставляется в виде созданного Docker дерева `dist/` без рабочей копии `.git` и без глобальной установки под управлением npm, которую эта команда могла бы обнаружить; соответствующий процесс для установок в стиле виртуальной машины описан в разделе [Обновление](/ru/install/updating).

### Обновление команды машины

Чтобы изменить команду запуска без полного повторного развертывания:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# или с увеличением объема памяти
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Последующий `fly deploy` сбрасывает команду машины до значения из `fly.toml`; после повторного развертывания примените изменения вручную еще раз.

## Закрытое развертывание (усиленное)

По умолчанию Fly выделяет общедоступные IP-адреса, поэтому ваш Gateway доступен по адресу `https://your-app.fly.dev` и может быть обнаружен интернет-сканерами (Shodan, Censys и т. д.).

Используйте `deploy/fly.private.toml` для усиленного развертывания **без общедоступного IP-адреса**: этот вариант не содержит `[http_service]`, поэтому общедоступный входящий доступ не выделяется.

### Когда использовать закрытое развертывание

- Только исходящие вызовы/сообщения (без входящих Webhook)
- Туннели ngrok или Tailscale обрабатывают все обратные вызовы Webhook
- Доступ к Gateway выполняется через SSH, прокси или WireGuard, а не через браузер
- Развертывание должно быть скрыто от интернет-сканеров

### Настройка

```bash
fly deploy -c deploy/fly.private.toml
```

Или преобразуйте существующее развертывание:

```bash
# вывести текущие IP-адреса
fly ips list -a my-openclaw

# освободить публичные IP-адреса
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# переключиться на приватную конфигурацию, чтобы при последующих развертываниях публичные IP-адреса не выделялись повторно
fly deploy -c deploy/fly.private.toml

# выделить только приватный IPv6-адрес
fly ips allocate-v6 --private -a my-openclaw
```

После этого `fly ips list` должна отображать только IP-адрес типа `private`:

```text
ВЕРСИЯ  IP                   ТИП              РЕГИОН
v6       fdaa:x:x:x:x::x      приватный        глобальный
```

### Доступ к приватному развертыванию

**Вариант 1: локальный прокси (самый простой)**

```bash
fly proxy 3000:3000 -a my-openclaw
# открыть http://localhost:3000 в браузере
```

**Вариант 2: VPN WireGuard**

```bash
fly wireguard create
# импортировать в клиент WireGuard, затем получить доступ через внутренний IPv6-адрес
# пример: http://[fdaa:x:x:x:x::x]:3000
```

**Вариант 3: только SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook при приватном развертывании

Для обратных вызовов Webhook (Twilio, Telnyx и т. д.) без публичного доступа:

1. **туннель ngrok**: запустите ngrok внутри контейнера или как вспомогательный контейнер
2. **Tailscale Funnel**: предоставьте доступ к определенным путям через Tailscale
3. **Только исходящие подключения**: некоторые провайдеры (Twilio) поддерживают исходящие вызовы без Webhook

Пример конфигурации голосовых вызовов с ngrok в разделе `plugins.entries.voice-call.config`:

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

### Компромиссы безопасности

| Аспект                    | Публичное развертывание | Приватное развертывание |
| ------------------------- | ----------------------- | ----------------------- |
| Интернет-сканеры          | Обнаруживается          | Скрыто                  |
| Прямые атаки              | Возможны                | Заблокированы           |
| Доступ к интерфейсу управления | Через браузер       | Через прокси/VPN        |
| Доставка Webhook          | Напрямую                | Через туннель           |

## Примечания

- Fly.io использует архитектуру x86; Dockerfile совместим как с x86, так и с ARM.
- Для подключения WhatsApp/Telegram используйте `fly ssh console`.
- Постоянные данные хранятся на томе по пути `/data`.
- Для Signal в образе требуется signal-cli (CLI на основе Java); используйте собственный образ и выделите не менее 2GB памяти.

## Стоимость

При рекомендуемой конфигурации (`shared-cpu-2x`, 2GB ОЗУ) ожидайте расходы примерно $10-15 в месяц в зависимости от использования; бесплатный тариф покрывает часть базового объема ресурсов. Актуальные тарифы приведены на странице [цен Fly.io](https://fly.io/docs/about/pricing/).

## Дальнейшие действия

- Настройте каналы обмена сообщениями: [Каналы](/ru/channels)
- Настройте Gateway: [Конфигурация Gateway](/ru/gateway/configuration)
- Поддерживайте OpenClaw в актуальном состоянии: [Обновление](/ru/install/updating)

## Связанные материалы

- [Обзор установки](/ru/install)
- [Hetzner](/ru/install/hetzner)
- [Docker](/ru/install/docker)
- [Размещение на VPS](/ru/vps)
