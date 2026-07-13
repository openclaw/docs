---
read_when:
    - Вам нужен контейнеризированный Gateway вместо локальной установки
    - Вы проверяете работу Docker-процесса
summary: Необязательная настройка и первоначальная настройка OpenClaw на базе Docker
title: Docker
x-i18n:
    generated_at: "2026-07-13T18:15:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker — **необязательный** компонент. Используйте его для изолированной временной среды Gateway или на хосте без локально установленных компонентов. Если вы уже ведёте разработку на собственном компьютере, используйте обычный процесс установки.

Стандартный бэкенд песочницы использует Docker, когда включён `agents.defaults.sandbox`, но по умолчанию песочница отключена, и для неё не требуется запускать сам Gateway в Docker. Также доступны бэкенды песочницы SSH и OpenShell; см. раздел [Песочница](/ru/gateway/sandboxing).

Размещаете нескольких пользователей? Модель с одной изолированной средой на арендатора описана в разделе [Мультитенантный хостинг](/gateway/multi-tenant-hosting).

## Предварительные требования

- Docker Desktop (или Docker Engine) + Docker Compose v2
- Не менее 2 GB ОЗУ для сборки образа (`pnpm install` может быть завершён системой из-за нехватки памяти на хостах с 1 GB ОЗУ с кодом выхода 137)
- Достаточно места на диске для образов и журналов
- На VPS или общедоступном хосте ознакомьтесь с разделом [Усиление безопасности при доступе по сети](/ru/gateway/security), особенно с цепочкой брандмауэра Docker `DOCKER-USER`

## Контейнеризованный Gateway

<Steps>
  <Step title="Сборка образа">
    Из корня репозитория:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Эта команда локально собирает образ Gateway как `openclaw:local`. Чтобы вместо него использовать предварительно собранный образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Предварительно собранные образы сначала публикуются в [реестре контейнеров GitHub](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR — основной реестр для автоматизации выпусков, развёртываний с закреплёнными версиями и проверок происхождения. Для того же выпуска в Docker Hub публикуется зеркало по адресу `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Используйте `ghcr.io/openclaw/openclaw` или `openclaw/openclaw` и избегайте неофициальных зеркал, которые не следуют графику выпусков и политике хранения OpenClaw. Официальные теги: `main`, `latest`, `<version>` (например, `2026.2.26`), а также бета-теги, такие как `2026.2.26-beta.1` (бета-версии никогда не перемещают `latest`/`main`). Стандартный образ `main`/`latest`/`<version>` включает плагины `codex` и `diagnostics-otel`. Вариант `-browser` (например, `latest-browser`) также поставляется со встроенным Chromium, что удобно для инструмента [браузера в песочнице](/ru/gateway/sandboxing#sandboxed-browser) без установки Playwright при первом запуске.

  </Step>

  <Step title="Повторный запуск без доступа к сети">
    На автономных хостах сначала перенесите и загрузите образ:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` проверяет, что `OPENCLAW_IMAGE` уже существует локально, отключает неявное получение и сборку образов Compose, а затем выполняет обычный процесс: синхронизацию `.env`, исправление разрешений, первоначальную настройку, синхронизацию конфигурации Gateway и запуск Compose.

    Если `OPENCLAW_SANDBOX=1`, автономная настройка также проверяет настроенный стандартный образ песочницы и образы песочницы отдельных агентов в службе Docker, доступной через `OPENCLAW_DOCKER_SOCKET`, включая метку контракта браузера в образах браузера на основе Docker. Если обязательный образ отсутствует или устарел, настройка завершается без изменения конфигурации песочницы, а не сообщает об успешном завершении с неработоспособной конфигурацией.

  </Step>

  <Step title="Завершение первоначальной настройки">
    Скрипт настройки автоматически выполняет первоначальную настройку:

    - запрашивает ключи API провайдера
    - создаёт токен Gateway и записывает его в `.env`
    - создаёт каталог секретного ключа профиля аутентификации
    - запускает Gateway через Docker Compose

    Первоначальная настройка перед запуском и запись конфигурации выполняются непосредственно через `openclaw-gateway` (с `--no-deps --entrypoint node`), поскольку `openclaw-cli` использует общее с Gateway сетевое пространство имён и работает только после создания контейнера Gateway.

  </Step>

  <Step title="Открытие интерфейса управления">
    Откройте `http://127.0.0.1:18789/` и вставьте токен, записанный в `.env`, в Settings. Если вы переключили контейнер на аутентификацию по паролю, используйте вместо токена этот пароль.

    Снова нужен URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Настройка каналов (необязательно)">
    ```bash
    # WhatsApp (QR-код)
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Контекст Docker исключает `.git`. Передайте сведения об исходном коде в аргументах сборки,
как показано выше, чтобы на экране «О программе» образа отображались зафиксированный коммит и
одна временная метка сборки. `scripts/docker/setup.sh` определяет и передаёт оба значения
автоматически.

<Note>
Запускайте `docker compose` из корня репозитория. Если вы включили `OPENCLAW_EXTRA_MOUNTS` или `OPENCLAW_HOME_VOLUME`, скрипт настройки записывает `docker-compose.extra.yml`; подключите его после всех файлов `docker-compose.override.yml`, которые вы поддерживаете самостоятельно, например `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Обновление образов контейнеров

Когда вы заменяете образ OpenClaw, но сохраняете те же подключённые состояние и конфигурацию,
новый Gateway перед переходом в состояние готовности выполняет безопасные для запуска миграции обновления и согласование плагинов.
Для обычных обновлений образа не должен требоваться отдельный
запуск `openclaw doctor --fix`.

Если при запуске невозможно безопасно выполнить эти исправления, Gateway завершается вместо того,
чтобы сообщать о работоспособности. При наличии политики перезапуска Docker, Podman или Kubernetes могут показывать,
что контейнер Gateway перезапускается. Сохраните подключённый том состояния, а затем один раз запустите
тот же образ с `openclaw doctor --fix` в качестве команды контейнера, используя
те же подключения состояния и конфигурации, что и Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

После завершения работы doctor перезапустите контейнер Gateway с его стандартной командой.
В Kubernetes выполните ту же команду в одноразовом Job или отладочном поде с подключением к тому же
PVC, а затем перезапустите Deployment или StatefulSet.

### Переменные среды

Необязательные переменные, принимаемые `scripts/docker/setup.sh` (а для контейнера Gateway — непосредственно `docker-compose.yml`):

| Переменная                                        | Назначение                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Использовать удалённый образ вместо локальной сборки                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Установить дополнительные пакеты apt во время сборки (разделённые пробелами). Устаревший псевдоним: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Установить дополнительные пакеты Python во время сборки (разделённые пробелами)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Скомпилировать и упаковать выбранные поддерживаемые плагины и установить их зависимости среды выполнения (идентификаторы, разделённые запятыми или пробелами) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Переопределить параметры Node для локальной сборки из исходного кода (по умолчанию `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Переопределить размер кучи tsdown в MB для локальной сборки из исходного кода                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Пропустить создание деклараций при локальной сборке образов только для среды выполнения (по умолчанию `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Встроить Chromium + Xvfb в образ во время сборки                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Дополнительные привязанные подключения хоста (значения `source:target[:opts]`, разделённые запятыми)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | Сохранять `/home/node` в именованном томе Docker                                                                     |
| `OPENCLAW_SANDBOX`                              | Включить инициализацию песочницы (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Пропустить интерактивный этап первоначальной настройки (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Переопределить путь к сокету Docker                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Принудительно включить (`0`) или отключить (`1`) объявление Bonjour/mDNS; см. [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Отключить наложения привязанных подключений исходного кода встроенных плагинов                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Общая конечная точка сборщика OTLP/HTTP для экспорта OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Отдельные конечные точки OTLP для трассировок, метрик или журналов                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Переопределение протокола OTLP. В настоящее время поддерживается только `http/protobuf`                                                   |
| `OTEL_SERVICE_NAME`                             | Имя службы, используемое для ресурсов OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Включить новейшие экспериментальные семантические атрибуты GenAI                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Не запускать второй SDK OpenTelemetry, если один уже предварительно загружен                                                    |

Официальный образ не содержит Homebrew. Во время первоначальной настройки OpenClaw скрывает установщики зависимостей Skills, работающие только через brew, в контейнере Linux без `brew`; добавьте эти зависимости через собственный образ или установите вручную. Используйте `OPENCLAW_IMAGE_APT_PACKAGES` для зависимостей из пакетов Debian и `OPENCLAW_IMAGE_PIP_PACKAGES` для зависимостей Python (во время сборки запускается `python3 -m pip install --break-system-packages`, поэтому закрепляйте версии и используйте только доверенные индексы).

Если Docker сообщает `ResourceExhausted`, `cannot allocate memory` или прерывает работу во время `tsdown`, увеличьте ограничение памяти сборщика Docker или повторите попытку с меньшими явно заданными размерами кучи:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Образы, собранные из исходного кода с выбранными плагинами

`OPENCLAW_EXTENSIONS` выбирает идентификаторы манифестов плагинов из исходного дерева;
также принимаются существующие имена каталогов исходного кода, если они отличаются. При сборке Docker
выбранные элементы однократно сопоставляются с каталогами исходного кода, устанавливаются рабочие
зависимости, а если выбранный плагин публикуется отдельно с
`openclaw.build.bundledDist: false`, его среда выполнения компилируется в корневой комплектный
dist. Эта упаковка, используемая только в Docker, не изменяет контракт артефактов npm или ClawHub
плагина. Неизвестные, недопустимые или неоднозначные идентификаторы приводят к сбою сборки образа.
Известные идентификаторы, предназначенные только для зависимостей или исходного кода, сохраняют существующую подготовку
исходного кода и зависимостей без добавления скомпилированной записи в корневой dist. Выбранный плагин
с унифицированными точками сборки должен успешно компилироваться; исходный код и выходные данные среды выполнения
невыбранных внешних плагинов удаляются.

Например, эти команды собирают отдельные автономные многоархитектурные
образы Gateway FakeCo для ClickClack, Slack и Microsoft Teams. ClawRouter уже
входит в корневую среду выполнения OpenClaw, поэтому образ ClickClack выбирает только
`clickclack`. Явно заданный пустой аргумент браузера позволяет не включать
Chromium в образ по умолчанию:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Используйте `--platform linux/arm64 --load` или `--platform linux/amd64 --load` для
одной нативной локальной сборки. Для многоплатформенных выходных данных и прикреплённых SBOM/данных о происхождении
требуется реестр или другой выход Buildx, сохраняющий аттестации. После
отправки проверьте манифест и развёртывайте неизменяемый дайджест, а не
изменяемый тег SHA исходного кода:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Развёртывание: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Эти образы предназначены для автономных шлюзов на основе OCI и обычных пользователей Docker.
Шлюзы под управлением Crabhelm их не используют: этот путь доставки создаёт
отдельный архив устройства x86_64, содержащий tar-архив npm OpenClaw, и фиксирует
дайджесты Node, архива и манифеста. Собирайте это устройство отдельно
из того же принятого исходного кода OpenClaw.

Чтобы протестировать исходный код комплектного плагина в упакованном образе, смонтируйте один каталог исходного кода плагина поверх пути его упакованного исходного кода, например `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Это переопределит соответствующий скомпилированный комплект `/app/dist/extensions/synology-chat` для того же идентификатора плагина.

### Наблюдаемость

Экспорт OpenTelemetry выполняется из контейнера Gateway во внешний коллектор OTLP; для него не требуется публиковать порт Docker. Чтобы включить комплектный экспортёр в локально собранный образ:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Официальные готовые образы уже включают `diagnostics-otel`; устанавливайте `clawhub:@openclaw/diagnostics-otel` самостоятельно, только если вы его удалили. Чтобы включить экспорт, разрешите и включите плагин `diagnostics-otel` в конфигурации, затем задайте `diagnostics.otel.enabled=true` (полный пример см. в разделе [Экспорт OpenTelemetry](/ru/gateway/opentelemetry)). Заголовки аутентификации коллектора передаются через `diagnostics.otel.headers`, а не через переменные среды Docker.

Метрики Prometheus используют уже опубликованный порт Gateway. Установите `clawhub:@openclaw/diagnostics-prometheus`, включите плагин `diagnostics-prometheus`, затем выполняйте сбор метрик по адресу:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут защищён аутентификацией Gateway; не публикуйте отдельный общедоступный порт `/metrics` и не создавайте маршрут обратного прокси без аутентификации. См. раздел [Метрики Prometheus](/ru/gateway/prometheus).

### Проверки работоспособности

Конечные точки проверок контейнера (аутентификация не требуется):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # работоспособность
curl -fsS http://127.0.0.1:18789/readyz     # готовность
```

Встроенная в образ проверка `HEALTHCHECK` опрашивает `/healthz`; повторяющиеся сбои помечают контейнер как `unhealthy`, чтобы оркестраторы могли перезапустить или заменить его.

Расширенный снимок состояния с аутентификацией:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN и loopback

`scripts/docker/setup.sh` по умолчанию задаёт `OPENCLAW_GATEWAY_BIND=lan`, чтобы `http://127.0.0.1:18789` на хосте работал с публикацией портов Docker.

- `lan` (по умолчанию): браузер и CLI на хосте могут обращаться к опубликованному порту Gateway.
- `loopback`: напрямую обращаться к Gateway могут только процессы внутри сетевого пространства имён контейнера.

<Note>
Используйте значения режима привязки в `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), а не псевдонимы хоста вроде `0.0.0.0` или `127.0.0.1`.
</Note>

### Локальные провайдеры хоста

Внутри контейнера `127.0.0.1` обозначает сам контейнер, а не хост. Для провайдеров, работающих на хосте, используйте `host.docker.internal`:

| Провайдер | URL хоста по умолчанию   | URL для настройки Docker             |
| --------- | ------------------------ | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Комплектная настройка использует эти URL как значения по умолчанию при первоначальной настройке LM Studio/Ollama, а `docker-compose.yml` сопоставляет `host.docker.internal` со шлюзом хоста в Docker Engine для Linux (Docker Desktop предоставляет тот же псевдоним в macOS/Windows). Службы хоста должны прослушивать адрес, доступный из Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Используете собственный файл Compose или `docker run`? Добавьте такое же сопоставление самостоятельно, например `--add-host=host.docker.internal:host-gateway`.

### Бэкенд Claude CLI в Docker

Официальный образ не содержит предустановленного Claude Code. Установите его и войдите в учётную запись от имени пользователя `node` внутри контейнера, затем обеспечьте постоянное хранение домашнего каталога контейнера, чтобы обновления образа не удаляли исполняемый файл или состояние аутентификации.

Для новой установки включите постоянный том `/home/node` перед запуском настройки:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Для существующей установки сначала остановите стек и повторно загрузите текущие значения `.env` — скрипт настройки всегда перезаписывает `.env` значениями из текущей оболочки и значениями по умолчанию; самостоятельно он этот файл не читает:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Если `.env` содержит значения, которые оболочка не может загрузить, сначала вручную повторно экспортируйте используемые значения (`OPENCLAW_IMAGE`, порты, режим привязки, пользовательские пути, `OPENCLAW_EXTRA_MOUNTS`, песочницу, пропуск первоначальной настройки). Созданный слой монтирует домашний том для `openclaw-gateway` и `openclaw-cli`; выполняйте остальные команды с этим слоем (и сначала с `docker-compose.override.yml`, если вы его используете):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Нативный установщик записывает `claude` в `/home/node/.local/bin/claude`. Укажите OpenClaw этот путь:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Войдите в учётную запись и выполните проверку из того же постоянного домашнего каталога:

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

Затем используйте комплектный бэкенд `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Передай привет из Claude CLI в Docker"
```

`OPENCLAW_HOME_VOLUME` сохраняет нативную установку в `/home/node/.local/bin` и `/home/node/.local/share/claude`, а также настройки и состояние аутентификации Claude Code в `/home/node/.claude` и `/home/node/.claude.json`. Сохранять только `/home/node/.openclaw` недостаточно; если вместо домашнего тома вы используете `OPENCLAW_EXTRA_MOUNTS`, смонтируйте все эти пути Claude в обе службы.

<Note>
Для общей автоматизации в рабочей среде или предсказуемого выставления счетов Anthropic предпочтителен путь с ключом API Anthropic. Повторное использование Claude CLI зависит от установленной версии Claude Code, входа в учётную запись, выставления счетов и поведения при обновлении.
</Note>

### Bonjour / mDNS

Мостовая сеть Docker обычно не обеспечивает надёжную передачу многоадресного трафика Bonjour/mDNS (`224.0.0.251:5353`). Когда `OPENCLAW_DISABLE_BONJOUR` не задан, комплектный плагин Bonjour автоматически отключает объявления в LAN после обнаружения запуска в контейнере, чтобы не попадать в цикл аварийных перезапусков из-за повторных попыток отправить многоадресный трафик, отбрасываемый мостом. Задайте `OPENCLAW_DISABLE_BONJOUR=1`, чтобы принудительно отключить его независимо от результата обнаружения, или `0`, чтобы принудительно включить его (только при использовании сети хоста, macvlan или другой сети, в которой многоадресный трафик mDNS гарантированно работает).

В остальных случаях для хостов Docker используйте опубликованный URL Gateway, Tailscale или глобальный DNS-SD. Особенности и сведения об устранении неполадок см. в разделе [Обнаружение Bonjour](/ru/gateway/bonjour).

### Хранение и постоянство данных

Docker Compose монтирует `OPENCLAW_CONFIG_DIR` в `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` в `/home/node/.openclaw/workspace` и `OPENCLAW_AUTH_PROFILE_SECRET_DIR` в `/home/node/.config/openclaw` посредством bind mount, поэтому эти пути сохраняются при замене контейнера. Если переменная не задана, `docker-compose.yml` использует резервный путь в `${HOME}` или `/tmp`, если отсутствует и сам `HOME`, поэтому `docker compose up` никогда не создаёт спецификацию тома с пустым источником в минимальных окружениях.

Этот смонтированный каталог конфигурации содержит:

- `openclaw.json` для конфигурации поведения
- `agents/<agentId>/agent/auth-profiles.json` для сохранённых данных аутентификации провайдеров через OAuth или ключ API
- `.env` для секретов среды выполнения, поступающих из переменных среды, например `OPENCLAW_GATEWAY_TOKEN`

В каталоге секретов профилей аутентификации хранится локальный ключ шифрования для токенов профилей аутентификации на основе OAuth. Храните его вместе с состоянием хоста Docker, но отдельно от `OPENCLAW_CONFIG_DIR`.

Установленные загружаемые плагины хранят состояние пакетов в смонтированном домашнем каталоге OpenClaw, поэтому записи об установке и корневые каталоги пакетов сохраняются при замене контейнера; запуск Gateway не создаёт заново деревья зависимостей комплектных плагинов.

Подробные сведения о постоянстве данных виртуальной машины см. в разделе [Среда выполнения виртуальной машины Docker — где сохраняются данные](/ru/install/docker-vm-runtime#what-persists-where).

**Основные источники роста использования диска:** `media/`, базы данных SQLite отдельных агентов, устаревшие расшифровки сеансов JSONL, общая база данных состояния SQLite, корневые каталоги пакетов установленных плагинов и ротируемые файловые журналы в `/tmp/openclaw/`.

### Вспомогательные команды оболочки (необязательно)

Для более коротких повседневных команд установите [ClawDock](/ru/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Если вы устанавливали через старый путь `scripts/shell-helpers/clawdock-helpers.sh`, повторно выполните приведённую выше команду, чтобы локальный вспомогательный инструмент отслеживал текущее расположение. Затем используйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` и т. д. (выполните `clawdock-help`, чтобы получить полный список).

<AccordionGroup>
  <Accordion title="Включение песочницы агента для Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Пользовательский путь к сокету (например, для Docker без root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтирует `docker.sock` только после успешной проверки предварительных требований песочницы. Если настройку песочницы завершить не удаётся, он сбрасывает `agents.defaults.sandbox.mode` до `off`. Режим кода Codex отключается для обращений, при которых активна песочница OpenClaw (см. [Песочница § Бэкенд Docker](/ru/gateway/sandboxing#docker-backend)); никогда не монтируйте Docker-сокет хоста в контейнеры песочницы агента.

  </Accordion>

  <Accordion title="Автоматизация / CI (неинтерактивный режим)">
    Отключите выделение псевдотерминала Compose с помощью `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примечание о безопасности общей сети">
    `openclaw-cli` использует `network_mode: "service:openclaw-gateway"`, чтобы команды CLI могли обращаться к gateway через `127.0.0.1`. Считайте это общей границей доверия. Конфигурация Compose удаляет `NET_RAW`/`NET_ADMIN` и включает `no-new-privileges` как для `openclaw-gateway`, так и для `openclaw-cli`.
  </Accordion>

  <Accordion title="Сбои DNS в Docker Desktop для openclaw-cli">
    В некоторых конфигурациях Docker Desktop после удаления `NET_RAW` перестают работать DNS-запросы из вспомогательного контейнера `openclaw-cli` в общей сети, что проявляется как `EAI_AGAIN` при выполнении команд на основе npm, например `openclaw plugins install`. Для обычной работы сохраняйте стандартный усиленный файл Compose. Приведённое ниже переопределение восстанавливает стандартные разрешения только для контейнера `openclaw-cli` — используйте его для разовой команды, которой необходим доступ к реестру, а не как стандартный способ запуска:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Если вы уже создали долгоживущий контейнер `openclaw-cli`, пересоздайте его с тем же переопределением — `docker compose exec`/`docker exec` не могут изменить разрешения Linux у уже созданного контейнера.

  </Accordion>

  <Accordion title="Разрешения и EACCES">
    Образ запускается от имени `node` (uid 1000). Если возникают ошибки разрешений для `/home/node/.openclaw`, убедитесь, что подключаемые с хоста каталоги принадлежат uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    То же несоответствие может проявляться как `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, за которым следует `plugin present but blocked`: uid процесса не совпадает с владельцем подключённого каталога плагина. Предпочтительно запускать процесс со стандартным uid 1000 и исправить владельца подключаемого каталога. Изменяйте владельца `/path/to/openclaw-config/npm` на `root:root` только в том случае, если намерены постоянно запускать OpenClaw от имени root.

  </Accordion>

  <Accordion title="Ускорение повторных сборок">
    Расположите инструкции Dockerfile так, чтобы слои зависимостей кэшировались и повторный запуск `pnpm install` требовался только при изменении файлов блокировки:

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
    Стандартный образ прежде всего ориентирован на безопасность и запускается от имени пользователя без прав root `node`. Чтобы получить контейнер с более широкими возможностями:

    1. **Сохраняйте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Включите системные зависимости в образ**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Включите зависимости Python в образ**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Включите Playwright Chromium в образ**: `export OPENCLAW_INSTALL_BROWSER=1` или используйте официальный тег образа `-browser`
    5. **Либо установите браузеры Playwright в постоянный том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Сохраняйте загруженные браузеры**: используйте `OPENCLAW_HOME_VOLUME` или `OPENCLAW_EXTRA_MOUNTS`. В Linux OpenClaw автоматически обнаруживает управляемый Playwright Chromium из образа.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker без графического интерфейса)">
    Если в мастере выбрать OAuth OpenAI Codex, откроется URL в браузере. В Docker или среде без графического интерфейса скопируйте полный URL перенаправления, на который вы попадёте, и вставьте его обратно в мастер для завершения аутентификации.
  </Accordion>

  <Accordion title="Метаданные базового образа">
    Образ среды выполнения использует `node:24-bookworm-slim` и запускает `tini` как процесс с PID 1, чтобы корректно завершать зомби-процессы и обрабатывать сигналы в долгоживущих контейнерах. Он публикует аннотации базового образа OCI, включая `org.opencontainers.image.base.name` и `org.opencontainers.image.source`. Dependabot обновляет закреплённый дайджест базового образа Node; сборки релизов не запускают отдельный слой обновления дистрибутива. См. [Аннотации образов OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Инструкции по развёртыванию на общей виртуальной машине, включая включение бинарных файлов в образ, постоянное хранение данных и обновления, см. в разделах [Hetzner (Docker VPS)](/ru/install/hetzner) и [Среда выполнения Docker VM](/ru/install/docker-vm-runtime).

## Песочница агента

Когда `agents.defaults.sandbox` включён с бэкендом Docker, gateway выполняет инструменты агента (оболочку, чтение и запись файлов и т. д.) внутри изолированных контейнеров Docker, а сам gateway остаётся на хосте. Это создаёт жёсткую границу вокруг недоверенных или многопользовательских сеансов агента без необходимости помещать весь gateway в контейнер.

Область действия песочницы может задаваться для каждого агента (по умолчанию), каждого сеанса или быть общей; каждая область получает собственное рабочее пространство, подключённое по пути `/workspace`. Также можно настроить политики разрешения и запрета инструментов, изоляцию сети, ограничения ресурсов и контейнеры браузера.

Полное описание конфигурации, образов, мер безопасности и профилей нескольких агентов:

- [Песочница](/ru/gateway/sandboxing) -- полный справочник по песочнице
- [OpenShell](/ru/gateway/openshell) -- интерактивный доступ к оболочке контейнеров песочницы
- [Песочница и инструменты для нескольких агентов](/ru/tools/multi-agent-sandbox-tools) -- переопределения для отдельных агентов

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

Соберите стандартный образ песочницы (из рабочей копии исходного кода):

```bash
scripts/sandbox-setup.sh
```

Для установки через npm без рабочей копии исходного кода см. встроенные команды `docker build` в разделе [Песочница § Образы и настройка](/ru/gateway/sandboxing#images-and-setup).

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Образ отсутствует или контейнер песочницы не запускается">
    Соберите образ песочницы с помощью [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (для рабочей копии исходного кода) или встроенной команды `docker build` из раздела [Песочница § Образы и настройка](/ru/gateway/sandboxing#images-and-setup) (для установки через npm), либо задайте пользовательский образ в `agents.defaults.sandbox.docker.image`. Контейнеры автоматически создаются для каждого сеанса по мере необходимости.
  </Accordion>

  <Accordion title="Ошибки разрешений в песочнице">
    Задайте для `docker.user` значение UID:GID, соответствующее владельцу подключённого рабочего пространства, либо измените владельца каталога рабочего пространства.
  </Accordion>

  <Accordion title="Пользовательские инструменты не найдены в песочнице">
    OpenClaw выполняет команды с помощью `sh -lc` (оболочка входа), которая загружает `/etc/profile` и может сбросить PATH. Задайте `docker.env.PATH`, чтобы добавить пути к пользовательским инструментам в начало PATH, либо добавьте скрипт в `/etc/profile.d/` в Dockerfile.
  </Accordion>

  <Accordion title="Процесс завершён из-за нехватки памяти при сборке образа (код выхода 137)">
    Виртуальной машине требуется не менее 2 GB оперативной памяти. Выберите класс машины с большим объёмом памяти и повторите попытку.
  </Accordion>

  <Accordion title="В Control UI отображается ошибка авторизации или требуется сопряжение">
    Получите новую ссылку на панель управления и подтвердите устройство браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Подробнее: [Панель управления](/ru/web/dashboard), [Устройства](/ru/cli/devices).

  </Accordion>

  <Accordion title="Целевой адрес Gateway показывает ws://172.x.x.x или Docker CLI сообщает об ошибках сопряжения">
    Сбросьте режим и привязку gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Связанные разделы

- [Обзор установки](/ru/install) — все способы установки
- [Podman](/ru/install/podman) — альтернатива Docker на основе Podman
- [ClawDock](/ru/install/clawdock) — конфигурация Docker Compose от сообщества
- [Обновление](/ru/install/updating) — поддержание OpenClaw в актуальном состоянии
- [Конфигурация](/ru/gateway/configuration) — настройка gateway после установки
