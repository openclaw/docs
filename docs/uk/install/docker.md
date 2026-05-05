---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних інсталяцій
    - Ви перевіряєте процес Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-05-05T07:42:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або перевірка Docker-потоку.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище Gateway або запуск OpenClaw на хості без локальних встановлень.
- **Ні**: ви працюєте на власній машині й хочете лише найшвидший цикл розробки. Натомість використовуйте звичайний потік встановлення.
- **Примітка щодо пісочниці**: стандартний бекенд пісочниці використовує Docker, коли пісочницю ввімкнено, але пісочниця вимкнена за замовчуванням і **не** потребує запуску всього Gateway у Docker. Також доступні бекенди пісочниці SSH і OpenShell. Див. [Пісочниця](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
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

    Це локально збирає образ Gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть онбординг">
    Скрипт налаштування автоматично запускає онбординг. Він:

    - запитає API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед запуском і записи конфігурації виконуються напряму через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте
    натомість цей пароль.

    Потрібен URL ще раз?

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
інструмент після запуску. Перед `docker compose up -d openclaw-gateway` запускайте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Установити додаткові apt-пакети під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                     | Додати вибрані допоміжні засоби вбудованих plugins під час збирання |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind mounts хоста (через кому `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_SANDBOX`                        | Увімкнути bootstrap пісочниці (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок онбордингу (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути рекламу Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount-накладання джерел вбудованих plugins        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільна кінцева точка OTLP/HTTP collector для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Специфічні для сигналів кінцеві точки OTLP для трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Ім’я сервісу, що використовується для ресурсів OpenTelemetry    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, якщо один уже попередньо завантажено |

Мейнтейнери можуть тестувати джерело вбудованого plugin проти пакетованого образу, змонтувавши
один каталог джерела plugin поверх його пакетованого шляху джерела, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерела перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого plugin id.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого OTLP
collector. Він не потребує опублікованого порту Docker. Якщо ви збираєте образ
локально й хочете, щоб вбудований експортер OpenTelemetry був доступний всередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Установіть офіційний plugin `@openclaw/diagnostics-otel` із ClawHub у
пакетованих встановленнях Docker перед увімкненням експорту. Власні образи, зібрані з джерел,
усе ще можуть додавати локальне джерело plugin через
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте й увімкніть
plugin `diagnostics-otel` у конфігурації, а потім установіть
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в [Експорті OpenTelemetry
](/uk/gateway/opentelemetry). Заголовки автентифікації collector налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Установіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть plugin
`diagnostics-prometheus`, а потім виконуйте scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищено автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Образ Docker містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки й надалі не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий snapshot стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював через публікацію портів Docker.

- `lan` (за замовчуванням): браузер хоста й CLI хоста можуть дістатися до опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть напряму дістатися
  до Gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` всередині контейнера — це сам контейнер,
а не ваша машина хоста. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | URL хоста за замовчуванням | URL налаштування Docker             |
| --------- | -------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`    | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`   | `http://host.docker.internal:11434` |

Вбудоване налаштування Docker використовує ці URL хоста як стандартні значення онбордингу
для LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` із
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
таке саме ім’я хоста на macOS і Windows.

Сервіси хоста також мають слухати на адресі, доступній із Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний Compose-файл або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у crash-loop і не перезапускав
рекламу повторно, коли bridge відкидає multicast-трафік.

Використовуйте опублікований URL Gateway, Tailscale або wide-area DNS-SD для хостів Docker.
Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де multicast mDNS точно працює.

Підводні камені та усунення несправностей див. у [виявленні Bonjour](/uk/gateway/bonjour).

### Сховище та збереження стану

Docker Compose bind-mount-ить `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера. Коли будь-яка зі змінних не задана, вбудований
`docker-compose.yml` повертається до `${HOME}/.openclaw` (і
`${HOME}/.openclaw/workspace` для монтування workspace) або до `/tmp/.openclaw`,
коли сам `HOME` також відсутній. Це не дає `docker compose up`
створювати специфікацію тому з порожнім джерелом у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої автентифікації провайдера OAuth/API-ключем
- `.env` для runtime-секретів на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Установлені завантажувані plugins зберігають стан своїх пакетів у змонтованому
домашньому каталозі OpenClaw, тому записи встановлення plugin і корені пакетів зберігаються після
заміни контейнера. Запуск Gateway не генерує дерева залежностей вбудованих plugins.

Повні відомості про збереження стану в розгортаннях VM див.
[Docker VM Runtime - що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій,
`cron/runs/*.jsonl`, коренями пакетів установлених plugin і ротаційними файловими журналами
у `/tmp/openclaw/`.

### Допоміжні засоби shell (необов’язково)

Для зручнішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний файл допоміжних засобів відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Запустіть
`clawdock-help`, щоб переглянути всі команди.
Див. [ClawDock](/uk/install/clawdock), щоб отримати повний посібник із допоміжних засобів.

<AccordionGroup>
  <Accordion title="Увімкнення sandbox агента для Docker gateway">
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

    Скрипт монтує `docker.sock` лише після успішного проходження попередніх умов sandbox. Якщо
    налаштування sandbox не вдається завершити, скрипт скидає `agents.defaults.sandbox.mode`
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
    могли звертатися до gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` і для `openclaw-gateway`, і для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind mount на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші повторні збірки">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це допоможе не запускати повторно
    `pnpm install`, якщо lockfile не змінилися:

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
    Типовий образ насамперед орієнтований на безпеку та запускається як не-root `node`. Для більш
    повнофункціонального контейнера:

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
    Docker або headless-налаштуваннях скопіюйте повний URL перенаправлення, на який ви потрапите, і вставте
    його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний runtime-образ Docker використовує `node:24-bookworm-slim` і публікує OCI
    анотації базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового Node
    оновлюється через PR Dependabot для базових образів Docker; release-збірки не запускають
    шар оновлення дистрибутива. Див.
    [анотації OCI-образів](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для кроків розгортання у спільній VM,
зокрема вбудовування binary, збереження даних і оновлення.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) всередині ізольованих Docker
контейнерів, тоді як сам gateway залишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких сесій агентів без контейнеризації всього
gateway.

Область дії sandbox може бути на рівні агента (типово), сесії або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки щодо безпеки та профілі кількох агентів див. тут:

- [Sandboxing](/uk/gateway/sandboxing) -- повна довідка щодо sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до sandbox-контейнерів
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення на рівні агента

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

Зберіть типовий sandbox-образ (із source checkout):

```bash
scripts/sandbox-setup.sh
```

Для npm-встановлень без source checkout див. [Sandboxing § Images and setup](/uk/gateway/sandboxing#images-and-setup), де наведено inline-команди `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або sandbox-контейнер не запускається">
    Зберіть sandbox-образ за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) або inline-команди `docker build` з [Sandboxing § Images and setup](/uk/gateway/sandboxing#images-and-setup) (npm install),
    або задайте для `agents.defaults.sandbox.docker.image` ваш власний образ.
    Контейнери автоматично створюються для кожної сесії на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Задайте `docker.user` як UID:GID, що відповідає власнику змонтованого workspace,
    або змініть власника папки workspace.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), який зчитує
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати на початок ваші
    шляхи до власних інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed під час збірки образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини та повторіть спробу.
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

  <Accordion title="Gateway target показує ws://172.x.x.x або помилки pairing з Docker CLI">
    Скиньте режим gateway і прив’язку:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Install Overview](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на базі Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Updating](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Configuration](/uk/gateway/configuration) — конфігурація gateway після встановлення
