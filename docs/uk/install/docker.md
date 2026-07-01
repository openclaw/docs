---
read_when:
    - Вам потрібен контейнеризований gateway замість локальних установок
    - Ви перевіряєте Docker-потік
summary: Необов’язкове налаштування й онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:18:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований gateway або потрібно перевірити Docker flow.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище gateway або запуск OpenClaw на хості без локальних інсталяцій.
- **Ні**: ви запускаєте на власній машині й хочете лише найшвидший dev loop. Натомість використовуйте звичайний процес інсталяції.
- **Примітка щодо sandboxing**: стандартний backend sandbox використовує Docker, коли sandboxing увімкнено, але sandboxing вимкнено за замовчуванням і **не** вимагає запускати весь gateway у Docker. Також доступні backend sandbox SSH і OpenShell. Див. [Sandboxing](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої доступності](/uk/gateway/security),
  особливо політику firewall Docker `DOCKER-USER`.

## Контейнеризований gateway

<Steps>
  <Step title="Зберіть образ">
    З кореня репозиторію запустіть setup script:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи спершу публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR є основним registry для автоматизації релізів, pinned deployments
    і перевірок походження. Той самий release workflow також публікує офіційне
    дзеркало Docker Hub у `openclaw/openclaw` для хостів, які віддають перевагу Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Використовуйте `ghcr.io/openclaw/openclaw` або `openclaw/openclaw`. Уникайте community
    дзеркал Docker Hub, оскільки OpenClaw не контролює їхній час релізу,
    перебудови або політику зберігання. Поширені офіційні теги: `main`, `latest`,
    `<version>` (наприклад, `2026.2.26`) і beta-версії, як-от
    `2026.2.26-beta.1`. Beta-теги не переміщують `latest` або `main`.

  </Step>

  <Step title="Повторний запуск в airgapped-середовищі">
    На офлайн-хостах спершу перенесіть і завантажте образ:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` перевіряє, що `OPENCLAW_IMAGE` вже існує локально, вимикає
    неявні Compose pulls і builds, а потім запускає звичайний setup flow, зокрема
    синхронізацію `.env`, виправлення дозволів, onboarding, синхронізацію конфігурації gateway
    і запуск Compose.

    Якщо `OPENCLAW_SANDBOX=1`, offline setup також перевіряє налаштовані стандартні
    та активні per-agent sandbox images у daemon за
    `OPENCLAW_DOCKER_SOCKET`. Docker-backed browser images також мають містити
    поточну мітку browser contract OpenClaw. Коли потрібний образ відсутній або
    несумісний, setup завершується без зміни конфігурації sandbox, замість того щоб
    повідомляти про успіх із непридатним sandbox.

  </Step>

  <Step title="Завершіть onboarding">
    Setup script автоматично запускає onboarding. Він:

    - запитає ключі API provider
    - згенерує токен gateway і запише його в `.env`
    - створить каталог secret key auth-profile
    - запустить gateway через Docker Compose

    Під час setup pre-start onboarding і записи конфігурації виконуються безпосередньо через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    shared secret у Settings. Setup script за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на password auth, використовуйте
    натомість цей пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте channels (необов’язково)">
    Використовуйте CLI container, щоб додати messaging channels:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord)

  </Step>
</Steps>

### Ручний flow

Якщо ви віддаєте перевагу запускати кожен крок самостійно замість використання setup script:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Запускайте `docker compose` з кореня репозиторію. Якщо ви увімкнули `OPENCLAW_EXTRA_MOUNTS`
або `OPENCLAW_HOME_VOLUME`, setup script записує `docker-compose.extra.yml`;
додавайте його після будь-якого стандартного override file, наприклад
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
коли існують обидва override files.
</Note>

<Note>
Оскільки `openclaw-cli` використовує network namespace `openclaw-gateway`, це
post-start tool. Перед `docker compose up -d openclaw-gateway` запускайте onboarding
і записи конфігурації під час setup через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Setup script приймає такі необов’язкові змінні середовища:

| Змінна                                         | Призначення                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                               | Використати віддалений образ замість локального збирання              |
| `OPENCLAW_IMAGE_APT_PACKAGES`                  | Встановити додаткові apt-пакети під час build (розділені пробілами)   |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                  | Встановити додаткові Python-пакети під час build (розділені пробілами) |
| `OPENCLAW_EXTENSIONS`                          | Попередньо встановити залежності plugin під час build (назви, розділені пробілами) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`           | Перевизначити параметри Node для локального source-build              |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Перевизначити heap tsdown для локального source-build у МБ            |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`               | Пропустити declaration output під час runtime-only local image builds |
| `OPENCLAW_EXTRA_MOUNTS`                        | Додаткові bind mounts хоста (розділені комами `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                         | Зберігати `/home/node` у named Docker volume                          |
| `OPENCLAW_SANDBOX`                             | Увімкнути sandbox bootstrap (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                     | Пропустити інтерактивний крок onboarding (`1`, `true`, `yes`, `on`)   |
| `OPENCLAW_DOCKER_SOCKET`                       | Перевизначити шлях до Docker socket                                   |
| `OPENCLAW_DISABLE_BONJOUR`                     | Вимкнути рекламу Bonjour/mDNS (за замовчуванням `1` для Docker)       |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`     | Вимкнути bind-mount overlays вихідного коду bundled plugin            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                  | Спільний endpoint OTLP/HTTP collector для експорту OpenTelemetry      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                | Signal-specific OTLP endpoints для traces, metrics або logs           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                  | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                            | Назва сервісу, що використовується для ресурсів OpenTelemetry         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                | Увімкнути найновіші експериментальні semantic attributes GenAI        |
| `OPENCLAW_OTEL_PRELOADED`                      | Пропустити запуск другого OpenTelemetry SDK, якщо один уже preloaded  |

Офіційний Docker image не постачається з Homebrew. Під час onboarding OpenClaw
приховує інсталятори залежностей Skills, доступні лише через brew, коли він працює в Linux
container без `brew`; ці залежності мають бути надані custom image
або встановлені вручну. Для залежностей, доступних із пакетів Debian, використовуйте
`OPENCLAW_IMAGE_APT_PACKAGES` під час збирання образу. Legacy-назва
`OPENCLAW_DOCKER_APT_PACKAGES` досі приймається.
Для Python-залежностей використовуйте `OPENCLAW_IMAGE_PIP_PACKAGES`. Це запускає
`python3 -m pip install --break-system-packages` під час збирання образу, тому закріплюйте
версії пакетів і використовуйте лише індекси пакетів, яким довіряєте.
Source builds встановлюють `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` за замовчуванням на
`--max-old-space-size=8192` і залишають
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` невстановленою, щоб wrapper tsdown міг
враховувати memory limits контейнера. Вони також встановлюють
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` за замовчуванням, оскільки runtime images видаляють declaration
files після build. Якщо Docker повідомляє `ResourceExhausted`, `cannot allocate
memory` або переривається під час `tsdown`, збільште memory limit Docker builder або
повторіть із меншими явними heaps, наприклад
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Maintainers можуть тестувати вихідний код bundled plugin із packaged image, монтувавши
один каталог вихідного коду plugin поверх його packaged source path, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого plugin id.

### Спостережуваність

Експорт OpenTelemetry є outbound із контейнера Gateway до вашого OTLP
collector. Він не потребує опублікованого Docker port. Якщо ви локально збираєте образ
і хочете, щоб bundled OpenTelemetry exporter був доступний усередині образу,
додайте його runtime dependencies:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Встановіть офіційний plugin `@openclaw/diagnostics-otel` із ClawHub у
packaged Docker installs перед увімкненням експорту. Custom source-built images все ще можуть
містити локальний вихідний код plugin через
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте й увімкніть
plugin `diagnostics-otel` у конфігурації, а потім встановіть
`diagnostics.otel.enabled=true` або скористайтеся прикладом конфігурації в [Експорт OpenTelemetry
](/uk/gateway/opentelemetry). Заголовки auth collector налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Prometheus metrics використовують уже опублікований порт Gateway. Встановіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть
plugin `diagnostics-prometheus`, а потім scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route захищено автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або unauthenticated reverse-proxy path. Див.
[Prometheus metrics](/uk/gateway/prometheus).

### Health checks

Container probe endpoints (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Образ Docker містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки й далі не проходять, Docker позначає контейнер як `unhealthy`, а
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ із хоста до
`http://127.0.0.1:18789` працював через публікацію порту Docker.

- `lan` (за замовчуванням): браузер хоста й CLI хоста можуть дістатися опублікованого порту gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть напряму дістатися
  gateway.

<Note>
Використовуйте значення режиму прив’язування в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` всередині контейнера — це сам контейнер,
а не ваша хост-машина. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | URL хоста за замовчуванням | URL для налаштування Docker |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Вбудоване налаштування Docker використовує ці URL хоста як стандартні значення
онбордингу для LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` із
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
те саме ім’я хоста в macOS і Windows.

Сервіси хоста також мають слухати на адресі, доступній із Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте те саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Бекенд Claude CLI у Docker

Офіційний образ Docker OpenClaw не встановлює Claude Code наперед. Установіть і
увійдіть у Claude Code всередині користувача контейнера, який запускає OpenClaw, а потім збережіть
домашній каталог цього контейнера, щоб оновлення образу не стерли бінарний файл або стан
автентифікації Claude.

Для нових інсталяцій Docker увімкніть постійний том `/home/node` перед запуском
налаштування:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Для наявної інсталяції Docker спершу зупиніть стек і повторно завантажте поточні
значення Docker `.env` перед повторним запуском налаштування. Скрипт налаштування не читає
`.env` самостійно; він перезаписує `.env` з поточної оболонки та стандартних значень. Для
згенерованого `.env` виконайте:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Якщо ваш `.env` містить значення, які ваша оболонка не може завантажити, вручну повторно експортуйте
наявні значення, на які ви покладаєтеся, як-от `OPENCLAW_IMAGE`, порти, режим прив’язування,
користувацькі шляхи, `OPENCLAW_EXTRA_MOUNTS`, пісочницю та налаштування пропуску онбордингу.
Згенероване накладання монтує домашній том і для `openclaw-gateway`, і для
`openclaw-cli`.

Запускайте решту команд зі згенерованим накладанням Compose, щоб обидва сервіси
монтували збережений домашній каталог. Якщо ваше налаштування також використовує `docker-compose.override.yml`,
додайте його перед `docker-compose.extra.yml`.

Установіть Claude Code у цей збережений домашній каталог:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Нативний інсталятор записує бінарний файл `claude` у
`/home/node/.local/bin/claude`. Вкажіть OpenClaw використовувати цей шлях контейнера:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Увійдіть і перевірте зсередини того самого збереженого домашнього каталогу контейнера:

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

Після цього можна використовувати вбудований бекенд `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` зберігає нативну інсталяцію Claude Code у
`/home/node/.local/bin` і `/home/node/.local/share/claude`, а також налаштування Claude Code
і стан автентифікації в `/home/node/.claude` та `/home/node/.claude.json`.
Зберігати лише `/home/node/.openclaw` недостатньо для повторного використання Claude CLI. Якщо
ви використовуєте `OPENCLAW_EXTRA_MOUNTS` замість домашнього тому, змонтуйте всі ці
шляхи Claude в обидва сервіси Docker.

<Note>
Для спільної виробничої автоматизації або передбачуваного білінгу Anthropic надавайте перевагу
шляху з API-ключем Anthropic. Повторне використання Claude CLI залежить від установленої
версії Claude Code, входу в обліковий запис, білінгу та поведінки оновлення.
</Note>

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл аварійних перезапусків і не
перезапускав рекламування повторно, коли bridge відкидає multicast-трафік.

Використовуйте опублікований URL Gateway, Tailscale або wide-area DNS-SD для хостів Docker.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де відомо, що multicast mDNS працює.

Підводні камені та усунення несправностей див. у [виявленні Bonjour](/uk/gateway/bonjour).

### Сховище та збереження

Docker Compose bind-монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, а
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` у `/home/node/.config/openclaw`, тож ці
шляхи переживають заміну контейнера. Коли будь-яку змінну не встановлено, вбудований
`docker-compose.yml` повертається до шляхів під `${HOME}` або `/tmp`, якщо самого `HOME`
також немає. Це не дає `docker compose up` виводити специфікацію тому з порожнім джерелом
у мінімальних середовищах.

Цей змонтований каталог конфігурації — місце, де OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для runtime-секретів на основі env, як-от `OPENCLAW_GATEWAY_TOKEN`

Каталог секретного ключа профілю автентифікації зберігає локальний ключ шифрування, який використовується для
матеріалу токенів профілю автентифікації на основі OAuth. Тримайте його разом зі станом вашого Docker-хоста,
але окремо від `OPENCLAW_CONFIG_DIR`.

Установлені завантажувані plugins зберігають стан своїх пакетів у змонтованому
домашньому каталозі OpenClaw, тож записи встановлення plugin і корені пакетів переживають
заміну контейнера. Запуск Gateway не генерує дерева залежностей вбудованих plugins.

Повні відомості про збереження в розгортаннях VM див.
[Docker VM Runtime - Що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій, спільною
базою даних стану SQLite, коренями пакетів установлених plugins і ротаційними файловими логами
в `/tmp/openclaw/`.

### Допоміжні засоби оболонки (необов’язково)

Для простішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте команду встановлення вище, щоб ваш локальний допоміжний файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Повний посібник із допоміжних засобів див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Користувацький шлях до сокета (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після проходження передумов пісочниці. Якщо
    налаштування пісочниці не може завершитися, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`. Ходи Codex у code-mode все ще обмежені Codex
    `workspace-write`, поки пісочниця OpenClaw активна; не монтуйте
    сокет Docker хоста в контейнери пісочниці агента.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Вимкніть виділення псевдо-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб команди CLI
    могли дістатися gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` як для `openclaw-gateway`, так і для `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    Деякі налаштування Docker Desktop не можуть виконувати DNS-пошуки зі shared-network
    sidecar `openclaw-cli` після скидання `NET_RAW`, що проявляється як
    `EAI_AGAIN` під час команд на основі npm, як-от `openclaw plugins install`.
    Залишайте стандартний посилений compose-файл для звичайної роботи gateway. Наведене нижче
    локальне перевизначення послаблює безпекову позицію контейнера CLI, відновлюючи
    стандартні capabilities Docker, тому використовуйте його лише для одноразової команди CLI,
    якій потрібен доступ до реєстру пакетів, а не як ваш стандартний виклик Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Якщо ви вже створили довготривалий контейнер `openclaw-cli`, пересоздайте його
    з тим самим перевизначенням. `docker compose exec` і `docker exec` не можуть
    змінити Linux capabilities у вже створеному контейнері.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    Образ працює як `node` (uid 1000). Якщо ви бачите помилки прав доступу для
    `/home/node/.openclaw`, переконайтеся, що ваші bind mounts на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Та сама невідповідність може проявлятися як попередження plugin, наприклад
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    з подальшим `plugin present but blocked`. Це означає, що uid процесу та власник
    змонтованого каталогу plugin не збігаються. Надавайте перевагу запуску контейнера зі
    стандартним uid 1000 і виправленню власника bind mount. Виконуйте chown
    `/path/to/openclaw-config/npm` до `root:root` лише якщо навмисно запускаєте
    OpenClaw як root довгостроково.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу уникнути повторного запуску
    `pnpm install`, якщо lockfiles не змінюються:

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

  <Accordion title="Параметри контейнера для досвідчених користувачів">
    Стандартний образ насамперед орієнтований на безпеку й запускається як некореневий користувач `node`. Для
    більш функціонального контейнера:

    1. **Збережіть `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Вбудуйте залежності Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Вбудуйте Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Або встановіть браузери Playwright у збережений том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Збережіть завантаження браузера**: використовуйте `OPENCLAW_HOME_VOLUME` або
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw автоматично виявляє керований Playwright
       Chromium з Docker-образу в Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker без графічного інтерфейсу)">
    Якщо в майстрі вибрати OpenAI Codex OAuth, він відкриє URL браузера. У
    Docker або середовищах без графічного інтерфейсу скопіюйте повну URL-адресу переспрямування, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний образ середовища виконання Docker використовує `node:24-bookworm-slim` і включає `tini` як init-процес точки входу (PID 1), щоб гарантувати прибирання zombie-процесів і коректну обробку сигналів у довготривалих контейнерах. Він публікує анотації базового образу OCI, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового образу Node
    оновлюється через PR Dependabot для базових Docker-образів; релізні збірки не запускають
    шар оновлення дистрибутива. Див.
    [анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[середовище виконання Docker VM](/uk/install/docker-vm-runtime), щоб дізнатися про спільні кроки розгортання VM,
зокрема вбудовування бінарних файлів, збереження даних та оновлення.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
запускає виконання інструментів агента (оболонку, читання/запис файлів тощо) всередині ізольованих Docker-
контейнерів, тоді як сам Gateway залишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких сеансів агентів без контейнеризації всього
Gateway.

Область пісочниці може бути окремою для кожного агента (стандартно), кожного сеансу або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Також можна налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, нотатки щодо безпеки та профілі для кількох агентів див. тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник із пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ оболонки до контейнерів пісочниці
- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

### Швидке ввімкнення

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

Зберіть стандартний образ пісочниці (з робочої копії джерельного коду):

```bash
scripts/sandbox-setup.sh
```

Для встановлень npm без робочої копії джерельного коду див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) з вбудованими командами `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (робоча копія джерельного коду) або вбудованої команди `docker build` з [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (встановлення npm),
    або встановіть для `agents.defaults.sandbox.docker.image` ваш власний образ.
    Контейнери автоматично створюються для кожного сеансу на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Установіть `docker.user` на UID:GID, що відповідає власнику змонтованого робочого простору,
    або змініть власника теки робочого простору за допомогою chown.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (оболонка входу), що зчитує
    `/etc/profile` і може скинути PATH. Установіть `docker.env.PATH`, щоб додати на початок ваші
    шляхи до користувацьких інструментів, або додайте сценарій у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Збірку образу завершено через OOM-kill (код виходу 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Потрібна авторизація або сполучення в Control UI">
    Отримайте свіже посилання на панель керування та схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [панель керування](/uk/web/dashboard), [пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки сполучення з Docker CLI">
    Скиньте режим Gateway і прив’язку:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Podman для Docker
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
