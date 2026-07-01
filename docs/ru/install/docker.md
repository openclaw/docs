---
read_when:
    - Вам нужен контейнеризованный Gateway вместо локальных установок
    - Вы проверяете Docker-процесс
summary: Необязательная настройка и онбординг OpenClaw на базе Docker
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:12:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker **необязателен**. Используйте его только если вам нужен контейнеризированный gateway или нужно проверить Docker-процесс.

## Подходит ли мне Docker?

- **Да**: вам нужна изолированная, одноразовая среда gateway или запуск OpenClaw на хосте без локальных установок.
- **Нет**: вы запускаете на собственной машине и вам нужен самый быстрый цикл разработки. Вместо этого используйте обычный процесс установки.
- **Примечание о sandboxing**: стандартный backend sandbox использует Docker, когда sandboxing включен, но sandboxing по умолчанию отключен и **не** требует запуска всего gateway в Docker. Также доступны backend sandbox на основе SSH и OpenShell. См. [Sandboxing](/ru/gateway/sandboxing).

## Предварительные требования

- Docker Desktop (или Docker Engine) + Docker Compose v2
- Минимум 2 ГБ RAM для сборки образа (`pnpm install` может быть завершен из-за OOM на хостах с 1 ГБ и кодом выхода 137)
- Достаточно места на диске для образов и логов
- Если запуск выполняется на VPS/публичном хосте, изучите
  [усиление безопасности при сетевой доступности](/ru/gateway/security),
  особенно политику firewall Docker `DOCKER-USER`.

## Контейнеризированный gateway

<Steps>
  <Step title="Build the image">
    Из корня репозитория запустите скрипт настройки:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Это локально соберет образ gateway. Чтобы вместо этого использовать заранее собранный образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Заранее собранные образы сначала публикуются в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR — основной реестр для автоматизации релизов, закрепленных развертываний
    и проверок происхождения. Тот же release workflow также публикует официальный
    mirror Docker Hub в `openclaw/openclaw` для хостов, предпочитающих Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Используйте `ghcr.io/openclaw/openclaw` или `openclaw/openclaw`. Избегайте community
    mirror в Docker Hub, потому что OpenClaw не контролирует их сроки релизов,
    пересборки или политику хранения. Распространенные официальные теги: `main`, `latest`,
    `<version>` (например, `2026.2.26`) и beta-версии, такие как
    `2026.2.26-beta.1`. Beta-теги не перемещают `latest` или `main`.

  </Step>

  <Step title="Airgapped rerun">
    На offline-хостах сначала перенесите и загрузите образ:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` проверяет, что `OPENCLAW_IMAGE` уже существует локально, отключает
    неявные Compose pulls и сборки, затем запускает обычный процесс настройки, такой как
    синхронизация `.env`, исправление разрешений, onboarding, синхронизация конфигурации gateway
    и запуск Compose.

    Если `OPENCLAW_SANDBOX=1`, offline-настройка также проверяет настроенные default
    и активные per-agent sandbox-образы в daemon за
    `OPENCLAW_DOCKER_SOCKET`. Docker-backed browser images также должны иметь
    текущую label контракта браузера OpenClaw. Когда требуемый образ отсутствует или
    несовместим, настройка завершается без изменения конфигурации sandbox вместо
    сообщения об успехе с неработоспособным sandbox.

  </Step>

  <Step title="Complete onboarding">
    Скрипт настройки автоматически запускает onboarding. Он:

    - запросит provider API keys
    - сгенерирует gateway token и запишет его в `.env`
    - создаст директорию auth-profile secret key
    - запустит gateway через Docker Compose

    Во время настройки pre-start onboarding и записи конфигурации выполняются напрямую через
    `openclaw-gateway`. `openclaw-cli` предназначен для команд, которые вы запускаете после
    того, как gateway container уже существует.

  </Step>

  <Step title="Open the Control UI">
    Откройте `http://127.0.0.1:18789/` в браузере и вставьте настроенный
    shared secret в Settings. По умолчанию скрипт настройки записывает token в `.env`;
    если вы переключите конфигурацию container на password auth, используйте
    этот password вместо него.

    Нужен URL снова?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    Используйте CLI container, чтобы добавить messaging channels:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Документация: [WhatsApp](/ru/channels/whatsapp), [Telegram](/ru/channels/telegram), [Discord](/ru/channels/discord)

  </Step>
</Steps>

### Ручной процесс

Если вы предпочитаете запускать каждый шаг самостоятельно вместо использования скрипта настройки:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Запускайте `docker compose` из корня репозитория. Если вы включили `OPENCLAW_EXTRA_MOUNTS`
или `OPENCLAW_HOME_VOLUME`, скрипт настройки записывает `docker-compose.extra.yml`;
подключайте его после любого стандартного override-файла, например
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
когда существуют оба override-файла.
</Note>

<Note>
Поскольку `openclaw-cli` разделяет network namespace `openclaw-gateway`, это
post-start инструмент. До `docker compose up -d openclaw-gateway` запускайте onboarding
и записи конфигурации на этапе настройки через `openclaw-gateway` с
`--no-deps --entrypoint node`.
</Note>

### Переменные окружения

Скрипт настройки принимает следующие необязательные переменные окружения:

| Переменная                                      | Назначение                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Использовать remote image вместо локальной сборки                     |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Установить дополнительные apt packages во время сборки (через пробел) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Установить дополнительные Python packages во время сборки (через пробел) |
| `OPENCLAW_EXTENSIONS`                           | Предварительно установить зависимости Plugin во время сборки (имена через пробел) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Переопределить локальные параметры source-build Node                  |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Переопределить local source-build heap tsdown в МБ                    |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Пропустить declaration output при runtime-only сборках локального образа |
| `OPENCLAW_EXTRA_MOUNTS`                         | Дополнительные host bind mounts (`source:target[:opts]` через запятую) |
| `OPENCLAW_HOME_VOLUME`                          | Сохранять `/home/node` в named Docker volume                          |
| `OPENCLAW_SANDBOX`                              | Включить sandbox bootstrap (`1`, `true`, `yes`, `on`)                 |
| `OPENCLAW_SKIP_ONBOARDING`                      | Пропустить интерактивный шаг onboarding (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                        | Переопределить путь к Docker socket                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Отключить рекламу Bonjour/mDNS (по умолчанию `1` для Docker)          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Отключить bind-mount overlays исходников встроенных Plugin            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Общий OTLP/HTTP collector endpoint для экспорта OpenTelemetry         |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Signal-specific OTLP endpoints для traces, metrics или logs           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Переопределение OTLP protocol. Сегодня поддерживается только `http/protobuf` |
| `OTEL_SERVICE_NAME`                             | Service name, используемое для OpenTelemetry resources                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Включить latest experimental GenAI semantic attributes                |
| `OPENCLAW_OTEL_PRELOADED`                       | Пропустить запуск второго OpenTelemetry SDK, если один уже preloaded  |

Официальный Docker image не поставляется с Homebrew. Во время onboarding OpenClaw
скрывает installers зависимостей Skills, доступные только через brew, когда он работает в Linux
container без `brew`; эти зависимости должны предоставляться custom image
или устанавливаться вручную. Для зависимостей, доступных из Debian packages, используйте
`OPENCLAW_IMAGE_APT_PACKAGES` во время сборки образа. Устаревшее имя
`OPENCLAW_DOCKER_APT_PACKAGES` все еще принимается.
Для Python-зависимостей используйте `OPENCLAW_IMAGE_PIP_PACKAGES`. Это запускает
`python3 -m pip install --break-system-packages` во время сборки образа, поэтому закрепляйте
версии packages и используйте только package indexes, которым доверяете.
Source builds по умолчанию задают `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` как
`--max-old-space-size=8192` и оставляют
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` не заданным, чтобы wrapper tsdown мог
учитывать memory limits container. Они также по умолчанию задают
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1`, потому что runtime images удаляют declaration
files после сборки. Если Docker сообщает `ResourceExhausted`, `cannot allocate
memory` или аварийно завершается во время `tsdown`, увеличьте memory limit Docker builder или
повторите с меньшими явными heaps, например
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Maintainers могут тестировать исходники встроенного Plugin с packaged image, смонтировав
одну директорию исходников Plugin поверх его packaged source path, например
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Эта смонтированная директория исходников переопределяет соответствующий скомпилированный
bundle `/app/dist/extensions/synology-chat` для того же plugin id.

### Наблюдаемость

Экспорт OpenTelemetry является исходящим из Gateway container в ваш OTLP
collector. Он не требует опубликованного Docker port. Если вы собираете образ
локально и хотите, чтобы встроенный OpenTelemetry exporter был доступен внутри образа,
включите его runtime dependencies:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Установите официальный Plugin `@openclaw/diagnostics-otel` из ClawHub в
packaged Docker installs перед включением экспорта. Custom source-built images все еще могут
включать локальный исходник Plugin с
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Чтобы включить экспорт, разрешите и включите
Plugin `diagnostics-otel` в конфигурации, затем задайте
`diagnostics.otel.enabled=true` или используйте пример конфигурации в [экспорте OpenTelemetry
](/ru/gateway/opentelemetry). Auth headers collector настраиваются через
`diagnostics.otel.headers`, а не через переменные окружения Docker.

Метрики Prometheus используют уже опубликованный порт Gateway. Установите
`clawhub:@openclaw/diagnostics-prometheus`, включите Plugin
`diagnostics-prometheus`, затем собирайте метрики:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route защищен authentication Gateway. Не открывайте отдельный
публичный порт `/metrics` или unauthenticated reverse-proxy path. См.
[метрики Prometheus](/ru/gateway/prometheus).

### Проверки работоспособности

Endpoints container probe (аутентификация не требуется):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Образ Docker включает встроенный `HEALTHCHECK`, который опрашивает `/healthz`.
Если проверки продолжают завершаться ошибкой, Docker помечает контейнер как `unhealthy`, а
системы оркестрации могут перезапустить или заменить его.

Аутентифицированный глубокий снимок состояния:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN и loopback

`scripts/docker/setup.sh` по умолчанию задает `OPENCLAW_GATEWAY_BIND=lan`, чтобы доступ с хоста к
`http://127.0.0.1:18789` работал через публикацию портов Docker.

- `lan` (по умолчанию): браузер хоста и CLI хоста могут обращаться к опубликованному порту Gateway.
- `loopback`: только процессы внутри сетевого пространства имен контейнера могут обращаться
  к Gateway напрямую.

<Note>
Используйте значения режима привязки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдонимы хостов вроде `0.0.0.0` или `127.0.0.1`.
</Note>

### Локальные провайдеры хоста

Когда OpenClaw работает в Docker, `127.0.0.1` внутри контейнера — это сам контейнер,
а не ваша хост-машина. Используйте `host.docker.internal` для AI-провайдеров, которые
работают на хосте:

| Провайдер | URL хоста по умолчанию  | URL для настройки Docker             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Встроенная настройка Docker использует эти URL хоста как значения по умолчанию
для онбординга LM Studio и Ollama, а `docker-compose.yml` сопоставляет `host.docker.internal`
со шлюзом хоста Docker для Linux Docker Engine. Docker Desktop уже предоставляет
то же имя хоста в macOS и Windows.

Сервисы хоста также должны слушать адрес, доступный из Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Если вы используете собственный Compose-файл или команду `docker run`, добавьте такое же
сопоставление хоста самостоятельно, например
`--add-host=host.docker.internal:host-gateway`.

### Бэкенд Claude CLI в Docker

Официальный образ Docker OpenClaw не устанавливает Claude Code заранее. Установите
Claude Code и войдите в него внутри пользователя контейнера, от имени которого работает OpenClaw,
затем сохраните домашний каталог контейнера, чтобы обновления образа не стирали бинарный файл
или состояние аутентификации Claude.

Для новых установок Docker включите постоянный том `/home/node` перед запуском
настройки:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Для существующей установки Docker сначала остановите стек и заново загрузите текущие
значения Docker `.env` перед повторным запуском настройки. Скрипт настройки не читает
`.env` сам по себе; он перезаписывает `.env` из текущей оболочки и значений по умолчанию. Для
сгенерированного `.env` выполните:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Если ваш `.env` содержит значения, которые ваша оболочка не может загрузить через source, сначала
вручную заново экспортируйте существующие значения, на которые вы полагаетесь, такие как `OPENCLAW_IMAGE`,
порты, режим привязки, пользовательские пути, `OPENCLAW_EXTRA_MOUNTS`, песочница
и настройки пропуска онбординга. Сгенерированный overlay монтирует домашний том
и для `openclaw-gateway`, и для `openclaw-cli`.

Запускайте остальные команды со сгенерированным Compose overlay, чтобы оба сервиса
монтировали постоянный домашний каталог. Если ваша настройка также использует
`docker-compose.override.yml`, включите его перед `docker-compose.extra.yml`.

Установите Claude Code в этот постоянный домашний каталог:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Нативный установщик записывает бинарный файл `claude` в
`/home/node/.local/bin/claude`. Укажите OpenClaw использовать этот путь контейнера:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Войдите и проверьте изнутри того же постоянного домашнего каталога контейнера:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

После этого можно использовать встроенный бэкенд `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` сохраняет нативную установку Claude Code в
`/home/node/.local/bin` и `/home/node/.local/share/claude`, а также настройки
Claude Code и состояние аутентификации в `/home/node/.claude` и `/home/node/.claude.json`.
Сохранения только `/home/node/.openclaw` недостаточно для повторного использования Claude CLI. Если
вы используете `OPENCLAW_EXTRA_MOUNTS` вместо домашнего тома, смонтируйте все эти
пути Claude в оба сервиса Docker.

<Note>
Для общей производственной автоматизации или предсказуемого биллинга Anthropic предпочитайте
путь с API-ключом Anthropic. Повторное использование Claude CLI следует установленной
версии Claude Code, входу в аккаунт, биллингу и поведению обновлений.
</Note>

### Bonjour / mDNS

Сетевой мост Docker обычно не пересылает multicast Bonjour/mDNS
(`224.0.0.251:5353`) надежно. Поэтому встроенная настройка Compose по умолчанию задает
`OPENCLAW_DISABLE_BONJOUR=1`, чтобы Gateway не входил в цикл падений или многократно
не перезапускал анонсирование, когда мост отбрасывает multicast-трафик.

Используйте опубликованный URL Gateway, Tailscale или wide-area DNS-SD для хостов Docker.
Задавайте `OPENCLAW_DISABLE_BONJOUR=0` только при запуске с host networking, macvlan
или другой сетью, где multicast mDNS точно работает.

Подводные камни и устранение неполадок см. в [обнаружении Bonjour](/ru/gateway/bonjour).

### Хранилище и постоянное хранение

Docker Compose монтирует bind mount `OPENCLAW_CONFIG_DIR` в `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` в `/home/node/.openclaw/workspace` и
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` в `/home/node/.config/openclaw`, поэтому эти
пути сохраняются при замене контейнера. Когда какая-либо переменная не задана,
встроенный `docker-compose.yml` использует запасной путь внутри `${HOME}` или `/tmp`, если сам
`HOME` тоже отсутствует. Это не дает `docker compose up` вывести спецификацию тома
с пустым источником в минимальных окружениях.

В этом смонтированном каталоге конфигурации OpenClaw хранит:

- `openclaw.json` для конфигурации поведения
- `agents/<agentId>/agent/auth-profiles.json` для сохраненной OAuth/API-key-аутентификации провайдеров
- `.env` для runtime-секретов на основе env, таких как `OPENCLAW_GATEWAY_TOKEN`

Каталог секретного ключа профиля аутентификации хранит локальный ключ шифрования, используемый для
материала токенов профиля аутентификации на основе OAuth. Держите его вместе с состоянием хоста Docker,
но отдельно от `OPENCLAW_CONFIG_DIR`.

Установленные загружаемые plugins хранят состояние своих пакетов в смонтированном
домашнем каталоге OpenClaw, поэтому записи установки plugin и корни пакетов сохраняются при
замене контейнера. Запуск Gateway не генерирует деревья зависимостей встроенных plugins.

Полные сведения о постоянном хранении в развертываниях VM см. в
[Docker VM Runtime — что где сохраняется](/ru/install/docker-vm-runtime#what-persists-where).

**Горячие точки роста диска:** следите за `media/`, файлами JSONL сессий, общей
базой данных состояния SQLite, корнями пакетов установленных plugins и ротируемыми файловыми логами
в `/tmp/openclaw/`.

### Помощники оболочки (необязательно)

Для более простого повседневного управления Docker установите `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Если вы установили ClawDock из старого raw-пути `scripts/shell-helpers/clawdock-helpers.sh`, повторно выполните команду установки выше, чтобы ваш локальный файл помощников отслеживал новое расположение.

Затем используйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` и т. д. Выполните
`clawdock-help`, чтобы увидеть все команды.
Полное руководство по помощникам см. в [ClawDock](/ru/install/clawdock).

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Пользовательский путь сокета (например, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтирует `docker.sock` только после успешного прохождения предварительных условий песочницы. Если
    настройка песочницы не может завершиться, скрипт сбрасывает `agents.defaults.sandbox.mode`
    в `off`. Ходы Codex в code-mode все еще ограничены Codex
    `workspace-write`, пока песочница OpenClaw активна; не монтируйте
    сокет Docker хоста в контейнеры песочницы агента.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Отключите выделение Compose pseudo-TTY с помощью `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` использует `network_mode: "service:openclaw-gateway"`, чтобы команды CLI
    могли обращаться к Gateway через `127.0.0.1`. Рассматривайте это как общую
    границу доверия. Конфигурация compose удаляет `NET_RAW`/`NET_ADMIN` и включает
    `no-new-privileges` и для `openclaw-gateway`, и для `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    В некоторых настройках Docker Desktop DNS-запросы из shared-network
    sidecar `openclaw-cli` завершаются ошибкой после удаления `NET_RAW`, что проявляется как
    `EAI_AGAIN` во время команд на основе npm, таких как `openclaw plugins install`.
    Сохраняйте стандартный усиленный compose-файл для обычной работы Gateway. Локальное
    переопределение ниже ослабляет профиль безопасности контейнера CLI, восстанавливая
    возможности Docker по умолчанию, поэтому используйте его только для разовой команды CLI,
    которой нужен доступ к реестру пакетов, а не как стандартный вызов Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Если вы уже создали долгоживущий контейнер `openclaw-cli`, пересоздайте его
    с тем же переопределением. `docker compose exec` и `docker exec` не могут
    изменить возможности Linux у уже созданного контейнера.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    Образ запускается от имени `node` (uid 1000). Если вы видите ошибки прав на
    `/home/node/.openclaw`, убедитесь, что ваши bind mounts на хосте принадлежат uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Такое же несоответствие может проявляться как предупреждение plugin вроде
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    с последующим `plugin present but blocked`. Это означает, что uid процесса и владелец
    смонтированного каталога plugin не совпадают. Предпочитайте запуск контейнера с
    uid 1000 по умолчанию и исправление владельца bind mount. Выполняйте chown
    `/path/to/openclaw-config/npm` в `root:root` только если вы намеренно запускаете
    OpenClaw от root в долгосрочной перспективе.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Упорядочьте Dockerfile так, чтобы слои зависимостей кэшировались. Это позволяет не запускать повторно
    `pnpm install`, если lockfiles не изменились:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Параметры контейнера для опытных пользователей">
    Образ по умолчанию ориентирован на безопасность и запускается без прав root от имени `node`. Для более
    полнофункционального контейнера:

    1. **Сохранить `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Встроить системные зависимости**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Встроить зависимости Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Встроить Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Или установить браузеры Playwright в сохраняемый том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Сохранить загрузки браузера**: используйте `OPENCLAW_HOME_VOLUME` или
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw автоматически обнаруживает управляемый Playwright
       Chromium из Docker-образа в Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (безголовый Docker)">
    Если в мастере выбрать OpenAI Codex OAuth, он откроет URL браузера. В
    Docker или безголовых средах скопируйте полный URL перенаправления, на который вы попали, и вставьте
    его обратно в мастер, чтобы завершить аутентификацию.
  </Accordion>

  <Accordion title="Метаданные базового образа">
    Основной Docker-образ runtime использует `node:24-bookworm-slim` и включает `tini` как init-процесс точки входа (PID 1), чтобы процессы-зомби удалялись, а сигналы корректно обрабатывались в долгоживущих контейнерах. Он публикует аннотации базового OCI-образа, включая `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` и другие. Дайджест базового образа Node
    обновляется через PR Dependabot для базовых Docker-образов; релизные сборки не запускают
    слой обновления дистрибутива. См.
    [аннотации OCI-образов](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаете на VPS?

См. [Hetzner (Docker VPS)](/ru/install/hetzner) и
[Docker VM Runtime](/ru/install/docker-vm-runtime) для общих шагов развертывания VM,
включая встраивание бинарных файлов, сохраняемость и обновления.

## Песочница агента

Когда `agents.defaults.sandbox` включен с Docker-бэкендом, Gateway
запускает выполнение инструментов агента (shell, чтение/запись файлов и т. д.) внутри изолированных Docker-
контейнеров, при этом сам Gateway остается на хосте. Это создает жесткую границу
вокруг недоверенных или многопользовательских сессий агентов без контейнеризации всего
Gateway.

Область песочницы может быть на уровне агента (по умолчанию), сессии или общей. Каждая область
получает собственное рабочее пространство, смонтированное в `/workspace`. Также можно настроить
политики разрешения/запрета инструментов, изоляцию сети, лимиты ресурсов и браузерные
контейнеры.

Полную конфигурацию, образы, заметки по безопасности и профили для нескольких агентов см.:

- [Песочница](/ru/gateway/sandboxing) -- полный справочник по песочнице
- [OpenShell](/ru/gateway/openshell) -- интерактивный shell-доступ к контейнерам песочницы
- [Песочница и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools) -- переопределения на уровне агента

### Быстрое включение

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Соберите образ песочницы по умолчанию (из checkout исходного кода):

```bash
scripts/sandbox-setup.sh
```

Для установок npm без checkout исходного кода см. [Песочница § Образы и настройка](/ru/gateway/sandboxing#images-and-setup), где приведены встроенные команды `docker build`.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Образ отсутствует или контейнер песочницы не запускается">
    Соберите образ песочницы с помощью
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout исходного кода) или встроенной команды `docker build` из [Песочница § Образы и настройка](/ru/gateway/sandboxing#images-and-setup) (установка npm),
    либо задайте `agents.defaults.sandbox.docker.image` для своего пользовательского образа.
    Контейнеры автоматически создаются для каждой сессии по требованию.
  </Accordion>

  <Accordion title="Ошибки разрешений в песочнице">
    Задайте `docker.user` как UID:GID, совпадающие с владельцем смонтированного рабочего пространства,
    или выполните chown для папки рабочего пространства.
  </Accordion>

  <Accordion title="Пользовательские инструменты не найдены в песочнице">
    OpenClaw запускает команды через `sh -lc` (login shell), который загружает
    `/etc/profile` и может сбросить PATH. Задайте `docker.env.PATH`, чтобы добавить ваши
    пути пользовательских инструментов в начало, или добавьте скрипт в `/etc/profile.d/` в Dockerfile.
  </Accordion>

  <Accordion title="Сборка образа завершена OOM-kill (код выхода 137)">
    VM требуется минимум 2 ГБ RAM. Используйте более крупный класс машины и повторите попытку.
  </Accordion>

  <Accordion title="Unauthorized или требуется pairing в Control UI">
    Получите новую ссылку на dashboard и подтвердите браузерное устройство:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Подробнее: [Dashboard](/ru/web/dashboard), [Устройства](/ru/cli/devices).

  </Accordion>

  <Accordion title="Цель Gateway показывает ws://172.x.x.x или ошибки pairing из Docker CLI">
    Сбросьте режим Gateway и bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор установки](/ru/install) — все способы установки
- [Podman](/ru/install/podman) — альтернатива Podman для Docker
- [ClawDock](/ru/install/clawdock) — настройка Docker Compose от сообщества
- [Обновление](/ru/install/updating) — поддержание OpenClaw в актуальном состоянии
- [Конфигурация](/ru/gateway/configuration) — конфигурация Gateway после установки
