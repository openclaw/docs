---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте Docker-процес
summary: Необов’язкове налаштування та початкове введення в роботу OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-05-01T20:38:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2647caae7debfe0647842249a3a6000bfa73b191b1aa1d7ced1e9c0eb22228db
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити Docker-процес.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або запуск OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте на власній машині й хочете просто найшвидший цикл розробки. Натомість використовуйте звичайний процес встановлення.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція за замовчуванням вимкнена і **не** потребує запуску всього Gateway у Docker. Також доступні бекенди ізоляції SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для складання образу (`pnpm install` може бути завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запуск відбувається на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    З кореня репозиторію запустіть сценарій налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збирає образ Gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть початкове налаштування">
    Сценарій налаштування автоматично запускає початкове налаштування. Він:

    - запросить API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування початкове налаштування перед стартом і записи конфігурації виконуються через
    `openclaw-gateway` напряму. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Сценарій налаштування за замовчуванням записує токен у `.env`;
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

### Ручний процес

Якщо ви віддаєте перевагу самостійному запуску кожного кроку замість використання сценарію налаштування:

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
або `OPENCLAW_HOME_VOLUME`, сценарій налаштування записує `docker-compose.extra.yml`;
додайте його за допомогою `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує мережевий простір імен `openclaw-gateway`, це
інструмент після старту. Перед `docker compose up -d openclaw-gateway` запускайте початкове налаштування
та записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Сценарій налаштування приймає ці необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального складання       |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Встановити додаткові apt-пакети під час складання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                     | Включити вибрані допоміжні засоби вбудованих plugin під час складання |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind-монтування хоста (через кому `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_SANDBOX`                        | Увімкнути початкове налаштування ізоляції (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок початкового налаштування (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути рекламу Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount-накладання джерельного коду вбудованих plugin |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільний endpoint колектора OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Специфічні для сигналів OTLP endpoint для трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Сьогодні підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Назва сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, коли один уже попередньо завантажено |

Супровідники можуть тестувати джерельний код вбудованого plugin із пакетованим образом, змонтувавши
один каталог джерельного коду plugin поверх його пакетованого шляху до джерел, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерельного коду перевизначає відповідний скомпільований
пакет `/app/dist/extensions/synology-chat` для того самого ідентифікатора plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого OTLP
колектора. Він не потребує опублікованого порту Docker. Якщо ви локально збираєте образ
і хочете, щоб вбудований експортер OpenTelemetry був доступний всередині образу,
включіть його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний Docker-образ релізу OpenClaw включає джерельний код вбудованого
plugin `diagnostics-otel`. Щоб увімкнути експорт, дозвольте й увімкніть
plugin `diagnostics-otel` у конфігурації, потім задайте
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації колектора
налаштовуються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
plugin `diagnostics-prometheus`, потім виконуйте scraping:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Endpoint для перевірок контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, а
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював з публікацією портів Docker.

- `lan` (за замовчуванням): браузер хоста та CLI хоста можуть звертатися до опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть напряму звертатися
  до Gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` всередині контейнера є самим контейнером,
а не вашою хост-машиною. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | URL хоста за замовчуванням | URL для налаштування Docker        |
| --------- | -------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`    | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`   | `http://host.docker.internal:11434` |

Вбудоване налаштування Docker використовує ці URL хоста як стандартні значення початкового налаштування
LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` з
хостовим gateway Docker для Linux Docker Engine. Docker Desktop уже надає
таке саме ім’я хоста на macOS і Windows.

Сервіси хоста також мають слухати на адресі, доступній з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте те саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose за замовчуванням задає
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у crash loop і не перезапускав
рекламу повторно, коли bridge відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для Docker-хостів.
Задавайте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де multicast mDNS точно працює.

Про типові проблеми й усунення несправностей див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та збереження даних

Docker Compose bind-монтує `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера. Коли будь-яка зі змінних не задана, вбудований
`docker-compose.yml` повертається до `${HOME}/.openclaw` (і
`${HOME}/.openclaw/workspace` для монтування робочого простору), або до `/tmp/.openclaw`,
коли сам `HOME` також відсутній. Це запобігає тому, щоб `docker compose up`
виводив специфікацію тому з порожнім джерелом у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key-автентифікації провайдера
- `.env` для runtime-секретів на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Встановлені завантажувані plugin зберігають свій стан пакета під змонтованим
home OpenClaw, тому записи встановлення plugin і корені пакетів зберігаються після
заміни контейнера. Запуск Gateway не генерує дерева залежностей для вбудованих plugin.

Повні відомості про збереження даних у розгортаннях VM див.
[Docker VM Runtime - Що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Місця активного зростання диска:** стежте за `media/`, файлами session JSONL,
`cron/runs/*.jsonl`, коренями пакетів встановлених plugin і ротаційними файловими журналами
під `/tmp/openclaw/`.

### Допоміжні засоби оболонки (необов’язково)

Для простішого щоденного керування Docker встановіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний helper-файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Див. [ClawDock](/uk/install/clawdock), щоб переглянути повний посібник із helper.

<AccordionGroup>
  <Accordion title="Увімкнути sandbox агента для Docker Gateway">
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

    Скрипт монтує `docker.sock` лише після успішного проходження передумов sandbox. Якщо
    налаштування sandbox не може завершитися, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб команди CLI
    могли підключатися до Gateway через `127.0.0.1`. Сприймайте це як спільну
    межу довіри. Конфігурація compose вимикає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind mounts на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це допоможе не запускати повторно
    `pnpm install`, якщо lockfiles не змінювалися:

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
    Стандартний образ орієнтований передусім на безпеку й запускається як непривілейований `node`. Для більш
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
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL браузера. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, на якій опинитеся, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний runtime-образ Docker використовує `node:24-bookworm-slim` і публікує OCI
    анотації базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Digest базового образу Node
    оновлюється через Dependabot PR для базового Docker-образу; release builds не запускають
    шар distro upgrade. Див.
    [анотації OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime), щоб переглянути кроки розгортання на спільній VM,
зокрема вбудовування бінарних файлів, persistence та оновлення.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з backend Docker, Gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) в ізольованих Docker
контейнерах, тоді як сам Gateway залишається на хості. Це створює надійну межу
навколо недовірених або multi-tenant сеансів агентів без контейнеризації всього
Gateway.

Область sandbox може бути для кожного агента (стандартно), для кожного сеансу або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки щодо безпеки та профілі multi-agent дивіться тут:

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до sandbox-контейнерів
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

Зберіть стандартний sandbox-образ (із checkout вихідного коду):

```bash
scripts/sandbox-setup.sh
```

Для встановлень через npm без checkout вихідного коду див. [Sandboxing § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) для inline-команд `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або sandbox-контейнер не запускається">
    Зберіть sandbox-образ за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout вихідного коду) або inline-команди `docker build` з [Sandboxing § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (встановлення через npm),
    або задайте `agents.defaults.sandbox.docker.image` для свого користувацького образу.
    Контейнери автоматично створюються для кожного сеансу на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Задайте `docker.user` як UID:GID, що відповідає власнику вашого змонтованого workspace,
    або змініть власника теки workspace через chown.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати на початок ваші
    користувацькі шляхи до інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed під час збирання образу (exit 137)">
    VM потрібно щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pairing у Control UI">
    Отримайте свіже посилання на dashboard і схваліть браузерний пристрій:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки pairing з Docker CLI">
    Скиньте режим Gateway і bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі методи встановлення
- [Podman](/uk/install/podman) — альтернатива Podman для Docker
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
