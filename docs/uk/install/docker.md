---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних інсталяцій
    - Ви перевіряєте процес Docker
summary: Необов’язкове встановлення та початкове налаштування OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-05-06T03:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити Docker-потік.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище Gateway або запуск OpenClaw на хості без локальних інсталяцій.
- **Ні**: ви запускаєте на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік інсталяції.
- **Примітка про пісочницю**: стандартний бекенд пісочниці використовує Docker, коли пісочницю ввімкнено, але пісочниця вимкнена за замовчуванням і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди пісочниці SSH і OpenShell. Див. [Пісочниця](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для складання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ із кодом виходу 137)
- Достатньо дискового простору для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    З кореня репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ Gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть первинне налаштування">
    Скрипт налаштування автоматично запускає первинне налаштування. Він:

    - попросить ключі API провайдера
    - згенерує токен Gateway і запише його до `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування первинне налаштування перед стартом і записи конфігурації виконуються напряму через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен до `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте
    натомість цей пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використовуйте контейнер CLI, щоб додати канали обміну повідомленнями:

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

### Ручний потік

Якщо ви віддаєте перевагу самостійному запуску кожного кроку замість використання скрипта налаштування:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Запускайте `docker compose` з кореня репозиторію. Якщо ви ввімкнули `OPENCLAW_EXTRA_MOUNTS`
або `OPENCLAW_HOME_VOLUME`, скрипт налаштування записує `docker-compose.extra.yml`;
додайте його за допомогою `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує мережевий простір імен `openclaw-gateway`, це
інструмент після запуску. Перед `docker compose up -d openclaw-gateway` запускайте первинне налаштування
та записи конфігурації під час налаштування через `openclaw-gateway` із
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає ці необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                       |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального складання         |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Встановити додаткові apt-пакети під час складання (розділені пробілами) |
| `OPENCLAW_EXTENSIONS`                     | Додати вибрані допоміжні засоби bundled Plugin під час складання  |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind mount хоста (розділені комами `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому томі Docker                  |
| `OPENCLAW_SANDBOX`                        | Увімкнути bootstrap пісочниці (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок первинного налаштування (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до сокета Docker                               |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути оголошення Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount накладання джерел bundled Plugin              |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільна кінцева точка колектора OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Специфічні для сигналів кінцеві точки OTLP для трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Ім’я сервісу, що використовується для ресурсів OpenTelemetry      |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI    |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, коли один уже попередньо завантажено |

Мейнтейнери можуть тестувати джерело bundled Plugin проти упакованого образу, монтувавши
один каталог джерела Plugin поверх його упакованого шляху джерела, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерела перевизначає відповідний скомпільований
пакет `/app/dist/extensions/synology-chat` для того самого ідентифікатора Plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого колектора OTLP.
Він не потребує опублікованого порту Docker. Якщо ви збираєте образ
локально й хочете, щоб bundled експортер OpenTelemetry був доступний усередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Установіть офіційний Plugin `@openclaw/diagnostics-otel` з ClawHub у
упакованих інсталяціях Docker перед увімкненням експорту. Власні образи, зібрані з джерел,
усе ще можуть додавати локальне джерело Plugin за допомогою
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте й увімкніть
Plugin `diagnostics-otel` у конфігурації, потім установіть
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в [Експорт OpenTelemetry](/uk/gateway/opentelemetry).
Заголовки автентифікації колектора налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Установіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть
Plugin `diagnostics-prometheus`, потім збирайте:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищено автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки справності

Кінцеві точки перевірок контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Образ Docker містить вбудований `HEALTHCHECK`, який пінгує `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, а
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок справності:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням установлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із публікацією портів Docker.

- `lan` (за замовчуванням): браузер хоста та CLI хоста можуть дістатися опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть напряму дістатися
  Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` усередині контейнера — це сам контейнер,
а не ваша хост-машина. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | Стандартна URL-адреса хоста | URL-адреса для Docker setup        |
| --------- | --------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434` |

Bundled Docker setup використовує ці URL-адреси хоста як стандартні значення первинного налаштування LM Studio й Ollama,
а `docker-compose.yml` зіставляє `host.docker.internal` із
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
те саме ім’я хоста на macOS і Windows.

Сервіси хоста також мають слухати адресу, доступну з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний Compose-файл або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Мережа мосту Docker зазвичай не пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`) надійно. Тому bundled Compose setup за замовчуванням установлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл падіння або багаторазово
не перезапускав оголошення, коли міст відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для хостів Docker.
Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з мережею хоста, macvlan
або іншою мережею, де відомо, що multicast mDNS працює.

Підводні камені й усунення несправностей див. у [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та сталість

Docker Compose bind-mount-ить `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера. Коли будь-яка зі змінних не задана, bundled
`docker-compose.yml` повертається до `${HOME}/.openclaw` (і
`${HOME}/.openclaw/workspace` для монтування workspace) або до `/tmp/.openclaw`,
коли самого `HOME` також немає. Це не дає `docker compose up`
видавати специфікацію тому з порожнім джерелом у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої автентифікації OAuth/API-key провайдерів
- `.env` для runtime-секретів на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Установлені завантажувані Plugin зберігають стан своїх пакетів у змонтованому
домашньому каталозі OpenClaw, тому записи встановлення Plugin і корені пакетів зберігаються після
заміни контейнера. Запуск Gateway не генерує дерева залежностей bundled Plugin.

Повні відомості про сталість у VM-розгортаннях див. у
[Docker VM Runtime - Що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій,
`cron/runs/*.jsonl`, коренями встановлених пакетів plugin і rolling file logs
у `/tmp/openclaw/`.

### Допоміжні засоби оболонки (необов'язково)

Для простішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний допоміжний файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб переглянути всі команди.
Див. [ClawDock](/uk/install/clawdock), щоб отримати повний посібник із допоміжних засобів.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Власний шлях до сокета (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішного проходження передумов sandbox. Якщо
    налаштування sandbox не може завершитися, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

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
    могли дістатися до Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose вимикає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` як для `openclaw-gateway`, так і для `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions and EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів у
    `/home/node/.openclaw`, переконайтеся, що bind mounts на вашому хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Така сама невідповідність може проявлятися як попередження plugin, наприклад
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    із подальшим `plugin present but blocked`. Це означає, що uid процесу та власник
    змонтованого каталогу plugin не збігаються. Бажано запускати контейнер із
    типовим uid 1000 і виправити власника bind mount. Виконуйте chown
    `/path/to/openclaw-config/npm` до `root:root` лише якщо ви навмисно запускаєте
    OpenClaw як root довгостроково.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це уникає повторного запуску
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

  <Accordion title="Power-user container options">
    Типовий образ орієнтований насамперед на безпеку й запускається як non-root `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: задайте
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL у браузері. У
    Docker або headless-налаштуваннях скопіюйте повний URL перенаправлення, на який ви потрапите, і вставте
    його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Base image metadata">
    Основний runtime-образ Docker використовує `node:24-bookworm-slim` і публікує OCI
    анотації базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового образу Node
    оновлюється через PR Dependabot для базового образу Docker; release-збірки не запускають
    шар оновлення дистрибутива. Див.
    [анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime), щоб отримати кроки розгортання на спільній VM,
зокрема вбудовування бінарного файлу, сталість даних і оновлення.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
запускає виконання інструментів агента (оболонка, читання/запис файлів тощо) всередині ізольованих Docker
контейнерів, тоді як сам Gateway залишається на хості. Це дає жорстку межу
навколо недовірених або multi-tenant сесій агентів без контейнеризації всього
Gateway.

Область sandbox може бути для кожного агента (типово), для кожної сесії або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, ліміти ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки щодо безпеки й профілі multi-agent див. тут:

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ оболонки до контейнерів sandbox
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для кожного агента

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

Зберіть типовий образ sandbox (із вихідного checkout):

```bash
scripts/sandbox-setup.sh
```

Для npm-встановлень без вихідного checkout див. [Sandboxing § Images and setup](/uk/gateway/sandboxing#images-and-setup) щодо inline-команд `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Зберіть образ sandbox за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (вихідний checkout) або inline-команди `docker build` з [Sandboxing § Images and setup](/uk/gateway/sandboxing#images-and-setup) (npm-встановлення),
    або задайте `agents.defaults.sandbox.docker.image` для вашого власного образу.
    Контейнери автоматично створюються для кожної сесії на вимогу.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Задайте `docker.user` як UID:GID, що відповідає власнику вашого змонтованого робочого простору,
    або змініть власника теки робочого простору через chown.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), що зчитує
    `/etc/profile` і може скинути PATH. Задайте `docker.env.PATH`, щоб додати ваші
    власні шляхи інструментів на початок, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Отримайте свіже посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    Скиньте режим Gateway і прив'язку:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на базі Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
