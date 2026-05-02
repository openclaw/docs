---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних інсталяцій
    - Ви перевіряєте Docker-процес
summary: Необов’язкове налаштування на основі Docker та ознайомлення з OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T15:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити Docker-процес.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або запуск OpenClaw на хості без локальних інсталяцій.
- **Ні**: ви працюєте на власній машині й хочете найшвидший цикл розробки. Натомість використовуйте звичайний процес інсталяції.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція вимкнена за замовчуванням і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди ізоляції SSH та OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через нестачу пам’яті на хостах із 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику firewall Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    З кореня репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це збирає образ Gateway локально. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть початкове налаштування">
    Скрипт налаштування запускає початкове налаштування автоматично. Він:

    - запитає API-ключі провайдерів
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування початкове налаштування перед стартом і записи конфігурації виконуються через
    `openclaw-gateway` напряму. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. За замовчуванням скрипт налаштування записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, натомість використовуйте цей
    пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використовуйте контейнер CLI, щоб додати канали повідомлень:

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

Якщо ви волієте запускати кожен крок самостійно, а не використовувати скрипт налаштування:

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
підключіть його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує мережевий простір імен `openclaw-gateway`, це
інструмент після запуску. Перед `docker compose up -d openclaw-gateway` запускайте початкове налаштування
та записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Встановити додаткові apt-пакети під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                     | Додати вибрані допоміжні засоби bundled Plugin під час збирання |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind mounts хоста (розділені комами `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_SANDBOX`                        | Увімкнути початкове налаштування ізоляції (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок початкового налаштування (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути оголошення Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlays джерел bundled Plugin             |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільна кінцева точка OTLP/HTTP-колектора для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Кінцеві точки OTLP для окремих сигналів: трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Ім’я сервісу, що використовується для ресурсів OpenTelemetry    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, коли один уже попередньо завантажено |

Мейнтейнери можуть тестувати джерело bundled Plugin із пакетованим образом, змонтувавши
один каталог джерела Plugin поверх його пакетованого шляху джерела, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерела перевизначає відповідний скомпільований
пакет `/app/dist/extensions/synology-chat` для того самого ідентифікатора Plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним із контейнера Gateway до вашого OTLP
колектора. Він не потребує опублікованого порту Docker. Якщо ви збираєте образ
локально й хочете, щоб bundled експортер OpenTelemetry був доступний усередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Встановіть офіційний Plugin `@openclaw/diagnostics-otel` з ClawHub у
пакетованих інсталяціях Docker перед увімкненням експорту. Користувацькі образи, зібрані з джерела, усе ще можуть
додавати локальне джерело Plugin через
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте й увімкніть
Plugin `diagnostics-otel` у конфігурації, потім задайте
`diagnostics.otel.enabled=true` або скористайтеся прикладом конфігурації в [експорті OpenTelemetry
](/uk/gateway/opentelemetry). Заголовки автентифікації колектора налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Встановіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть Plugin
`diagnostics-prometheus`, потім виконайте збирання:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Кінцеві точки контейнерних проб (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Образ Docker містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював через публікацію портів Docker.

- `lan` (за замовчуванням): браузер хоста й CLI хоста можуть дістатися опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть дістатися
  Gateway напряму.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` всередині контейнера означає сам
контейнер, а не вашу хост-машину. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | URL хоста за замовчуванням | URL для налаштування Docker         |
| --------- | -------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`    | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`   | `http://host.docker.internal:11434` |

Bundled налаштування Docker використовує ці URL хоста як стандартні значення початкового налаштування
LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` з
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
те саме ім’я хоста на macOS і Windows.

Сервіси хоста також мають прослуховувати адресу, доступну з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Bridge-мережа Docker зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому bundled налаштування Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не входив у цикл аварійних перезапусків або не перезапускав
оголошення повторно, коли bridge відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для хостів Docker.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де відомо, що multicast mDNS працює.

Про типові проблеми та усунення несправностей див. [виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та сталість

Docker Compose bind-mounts `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера. Коли будь-яку зі змінних не задано, bundled
`docker-compose.yml` повертається до `${HOME}/.openclaw` (і
`${HOME}/.openclaw/workspace` для монтування робочого простору) або `/tmp/.openclaw`,
коли сам `HOME` також відсутній. Це не дає `docker compose up`
виводити специфікацію тому з порожнім джерелом у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key-автентифікації провайдера
- `.env` для runtime-секретів із середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Встановлені завантажувані Plugin зберігають стан своїх пакетів у змонтованому
домашньому каталозі OpenClaw, тож записи інсталяції Plugin і корені пакетів зберігаються після
заміни контейнера. Запуск Gateway не генерує дерева залежностей bundled Plugin.

Повні відомості про сталість у розгортаннях VM див.
[Docker VM Runtime - що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій,
`cron/runs/*.jsonl`, коренями встановлених пакетів plugin і ротаційними файловими журналами
у `/tmp/openclaw/`.

### Допоміжні засоби Shell (необов’язково)

Для зручнішого щоденного керування Docker встановіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте команду встановлення вище, щоб ваш локальний допоміжний файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Повний посібник із допоміжних засобів див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнути пісочницю агента для Docker gateway">
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

    Скрипт монтує `docker.sock` лише після успішної перевірки передумов пісочниці. Якщо
    налаштування пісочниці не вдається завершити, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення pseudo-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб CLI
    команди могли звертатися до gateway через `127.0.0.1`. Сприймайте це як спільну
    межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind mount на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші повторні збірки">
    Впорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу не запускати повторно
    `pnpm install`, якщо lockfile не змінювалися:

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
    Типовий образ орієнтований насамперед на безпеку й запускається як непривілейований `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Встановіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: задайте
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо ви виберете OpenAI Codex OAuth у майстрі налаштування, він відкриє URL браузера. У
    Docker або headless-середовищах скопіюйте повний URL перенаправлення, на який потрапите, і вставте
    його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний runtime-образ Docker використовує `node:24-bookworm-slim` і публікує OCI
    анотації базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового образу Node
    оновлюється через PR Dependabot для базових Docker-образів; release-збірки не запускають
    шар оновлення дистрибутива. Див.
    [анотації OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[середовище виконання Docker VM](/uk/install/docker-vm-runtime), щоб переглянути кроки розгортання на спільній VM,
зокрема вбудовування бінарного файла, збереження даних і оновлення.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) всередині ізольованих Docker
контейнерів, тоді як сам gateway залишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких сесій агентів без контейнеризації всього
gateway.

Область пісочниці може бути для окремого агента (типово), сесії або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Також можна налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і контейнери
браузера.

Повну конфігурацію, образи, примітки щодо безпеки та профілі для кількох агентів див. тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник із пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до контейнерів пісочниці
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

Зберіть типовий образ пісочниці (з checkout вихідного коду):

```bash
scripts/sandbox-setup.sh
```

Для npm-встановлень без checkout вихідного коду див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup), де наведено вбудовані команди `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout вихідного коду) або вбудованої команди `docker build` з [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (npm-встановлення),
    або задайте `agents.defaults.sandbox.docker.image` як ваш користувацький образ.
    Контейнери автоматично створюються для кожної сесії на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Задайте `docker.user` як UID:GID, що відповідає власнику змонтованого workspace,
    або змініть власника папки workspace за допомогою chown.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (login shell), який підвантажує
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати на початок ваші
    користувацькі шляхи до інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed під час збірки образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне сполучення в Control UI">
    Отримайте свіже посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки сполучення з Docker CLI">
    Скиньте режим gateway і bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на Podman
- [ClawDock](/uk/install/clawdock) — community-налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація gateway після встановлення
