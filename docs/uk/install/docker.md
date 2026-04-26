---
read_when:
    - Ви хочете контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T21:53:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66e79a53377c394ed581b856ee65946bc2a08a6fe66a85ed4f46fd4c7635e5e0
    source_path: install/docker.md
    workflow: 15
---

Docker **необов’язковий**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або якщо ви хочете перевірити потік Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запустити OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте все на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік встановлення.
- **Примітка щодо пісочниці**: типовий бекенд пісочниці використовує Docker, коли пісочницю ввімкнено, але пісочниця за замовчуванням вимкнена і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди пісочниці SSH і OpenShell. Див. [Пісочниця](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути примусово завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої доступності](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    У корені репозиторію виконайте скрипт налаштування:

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

  <Step title="Завершіть онбординг">
    Скрипт налаштування запускає онбординг автоматично. Він:

    - запитає API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг до старту та запис конфігурації виконуються
    безпосередньо через `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви виконуєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`; якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість цей
    пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використайте контейнер CLI, щоб додати канали обміну повідомленнями:

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

Якщо ви віддаєте перевагу виконанню кожного кроку вручну замість використання скрипта налаштування:

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
додавайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує той самий простір мережевих імен, що й `openclaw-gateway`, це
інструмент для використання після старту. До `docker compose up -d openclaw-gateway` виконуйте онбординг
і запис конфігурації на етапі налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Variable                                   | Purpose                                                          |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використати віддалений образ замість локального збирання         |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Встановити додаткові apt-пакети під час збирання (через пробіл)  |
| `OPENCLAW_EXTENSIONS`                      | Попередньо встановити залежності плагінів під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind mount-и хоста (через кому `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому Docker volume               |
| `OPENCLAW_SANDBOX`                         | Увімкнути початкове налаштування пісочниці (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до сокета Docker                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути рекламу Bonjour/mDNS (для Docker за замовчуванням `1`)  |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlay для вбудованих вихідних кодів плагінів |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільна адреса OTLP/HTTP collector для експорту OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Окремі адреси OTLP для трас, метрик або журналів                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Назва сервісу для ресурсів OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути найновіші експериментальні семантичні атрибути GenAI   |
| `OPENCLAW_OTEL_PRELOADED`                  | Не запускати другий OpenTelemetry SDK, якщо один уже попередньо завантажено |

Супроводжувачі можуть тестувати вихідний код вбудованого плагіна з упакованим образом, змонтувавши
один каталог вихідного коду плагіна поверх його упакованого шляху до вихідного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний зібраний
бандл `/app/dist/extensions/synology-chat` для того самого ідентифікатора плагіна.

### Спостережуваність

Експорт OpenTelemetry є вихідним із контейнера Gateway до вашого OTLP
collector. Для цього не потрібен опублікований порт Docker. Якщо ви локально збираєте образ
і хочете, щоб у ньому був доступний вбудований експортер OpenTelemetry,
додайте його залежності часу виконання:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний релізний Docker-образ OpenClaw містить вбудований вихідний код плагіна
`diagnostics-otel`. Залежно від образу та стану кешу,
Gateway може все ще підготувати локальні залежності часу виконання OpenTelemetry для плагіна
під час першого ввімкнення плагіна, тому дозвольте цьому першому завантаженню мати доступ до
реєстру пакетів або попередньо прогрійте образ у вашому релізному конвеєрі. Щоб увімкнути експорт, дозвольте і
увімкніть плагін `diagnostics-otel` у конфігурації, а потім встановіть
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації collector налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
плагін `diagnostics-prometheus`, а потім збирайте:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Кінцеві точки probes контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який звертається до `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований розгорнутий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, тож доступ хоста до
`http://127.0.0.1:18789` працює з публікацією портів Docker.

- `lan` (за замовчуванням): браузер хоста і CLI хоста можуть звертатися до опублікованого порту Gateway.
- `loopback`: лише процеси всередині простору мережевих імен контейнера можуть безпосередньо звертатися
  до Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережа мосту Docker зазвичай ненадійно пересилає мультикаст Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл аварійних перезапусків і не
перезапускав рекламу знову і знову, коли міст втрачає мультикаст-трафік.

Для Docker-хостів використовуйте опубліковану URL-адресу Gateway, Tailscale або DNS-SD широкої зони.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час роботи з host networking, macvlan
або іншою мережею, де точно відомо, що мультикаст mDNS працює.

Щоб дізнатися про типові проблеми й усунення неполадок, див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та збереження даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для секретів часу виконання на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про збереження даних у розгортаннях на VM див. у
[Docker VM Runtime - Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Точки зростання дискового простору:** стежте за `media/`, файлами JSONL сеансів, `cron/runs/*.jsonl`,
і циклічними файловими журналами в `/tmp/openclaw/`.

### Допоміжні команди оболонки (необов’язково)

Для зручнішого повсякденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний файл помічника відстежував нове розташування.

Після цього використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Повний посібник із допоміжних команд див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнення пісочниці агента для Docker Gateway">
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

    Скрипт монтує `docker.sock` лише після проходження перевірки передумов пісочниці. Якщо
    налаштування пісочниці не вдасться завершити, скрипт скине `agents.defaults.sandbox.mode`
    на `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тож команди CLI
    можуть звертатися до Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ працює від імені `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що ваші bind mount-и хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дозволяє уникнути повторного запуску
    `pnpm install`, якщо lockfile-и не змінювалися:

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
    Типовий образ орієнтований насамперед на безпеку й працює від імені непривілейованого `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: установіть
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker без графічного інтерфейсу)">
    Якщо у майстрі ви виберете OAuth OpenAI Codex, він відкриє URL-адресу в браузері. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний runtime-образ Docker використовує `node:24-bookworm-slim` і публікує OCI
    анотації базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Digest базового образу Node
    оновлюється через PR Dependabot для базових Docker-образів; релізні збірки не запускають
    шар оновлення дистрибутива. Див.
    [Анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для кроків розгортання на спільних VM,
включно з вбудовуванням бінарних файлів, збереженням даних і оновленнями.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
виконує інструменти агента (shell, читання/запис файлів тощо) в ізольованих Docker-
контейнерах, тоді як сам Gateway залишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких сеансів агента без контейнеризації всього
Gateway.

Область дії пісочниці може бути на рівні агента (за замовчуванням), сеансу або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і
контейнери браузера.

Повну інформацію про конфігурацію, образи, примітки щодо безпеки та профілі з кількома агентами див. тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник із пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ shell до контейнерів пісочниці
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

Зберіть типовий образ пісочниці:

```bash
scripts/sandbox-setup.sh
```

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або встановіть `agents.defaults.sandbox.docker.image` на ваш власний образ.
    Контейнери автоматично створюються для кожного сеансу за потреби.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Встановіть `docker.user` на UID:GID, що відповідає правам власності змонтованого workspace,
    або змініть власника папки workspace через chown.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скидати PATH. Встановіть `docker.env.PATH`, щоб додати
    ваші власні шляхи до інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Примусове завершення через OOM під час збирання образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне сполучення в Control UI">
    Отримайте нове посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки сполучення з Docker CLI">
    Скиньте режим і прив’язку Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на базі Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримка OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
