---
read_when:
    - Ви хочете контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T10:55:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker **необов’язковий**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити потік Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте його на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік встановлення.
- **Примітка щодо sandboxing**: стандартний бекенд sandbox використовує Docker, коли sandboxing увімкнено, але sandboxing за замовчуванням вимкнений і **не** вимагає запуску всього Gateway у Docker. Також доступні SSH і OpenShell бекенди sandbox. Див. [Sandboxing](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо дискового простору для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої доступності](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    У корені репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ Gateway. Щоб натомість використовувати попередньо зібраний образ:

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

    - запросить API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед запуском і запис конфігурації під час налаштування виконуються безпосередньо через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway вже існує.

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
    Використовуйте контейнер CLI для додавання каналів обміну повідомленнями:

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

Якщо ви віддаєте перевагу запуску кожного кроку вручну замість використання скрипта налаштування:

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
Оскільки `openclaw-cli` використовує той самий мережевий простір імен, що й `openclaw-gateway`, це
інструмент для використання після запуску. До `docker compose up -d openclaw-gateway` виконуйте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Variable                                   | Purpose                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використовувати віддалений образ замість локального збирання    |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Установити додаткові apt-пакунки під час збирання (імена через пробіл) |
| `OPENCLAW_EXTENSIONS`                      | Попередньо встановити залежності плагінів під час збирання (імена через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind mounts хоста (через кому у форматі `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому Docker volume              |
| `OPENCLAW_SANDBOX`                         | Увімкнути початкове налаштування sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до Docker socket                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути рекламу через Bonjour/mDNS (для Docker за замовчуванням `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlays для вбудованих вихідних кодів плагінів |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільна кінцева точка OTLP/HTTP collector для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Кінцеві точки OTLP для окремих сигналів traces, metrics або logs |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Назва сервісу для ресурсів OpenTelemetry                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                  | Не запускати другий SDK OpenTelemetry, якщо один уже попередньо завантажено |

Супроводжувачі можуть тестувати вихідний код вбудованого плагіна з пакованим образом, змонтувавши
один каталог вихідного коду плагіна поверх його пакованого шляху вихідного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний скомпільований
бандл `/app/dist/extensions/synology-chat` для того самого ідентифікатора плагіна.

### Спостережуваність

Експорт OpenTelemetry є вихідним із контейнера Gateway до вашого OTLP
collector. Для цього не потрібен опублікований Docker port. Якщо ви локально збираєте образ
і хочете, щоб вбудований експортер OpenTelemetry був доступний всередині образу,
додайте його залежності часу виконання:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний релізний Docker image OpenClaw включає вбудований вихідний код плагіна
`diagnostics-otel`. Залежно від образу та стану кешу,
Gateway може все одно підготувати локальні залежності часу виконання OpenTelemetry для плагіна
під час першого ввімкнення плагіна, тож дозвольте цьому першому запуску доступ до реєстру пакунків
або попередньо прогрійте образ у вашому релізному конвеєрі. Щоб увімкнути експорт, дозвольте та
увімкніть плагін `diagnostics-otel` у конфігурації, а потім задайте
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації collector налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований Gateway port. Увімкніть
плагін `diagnostics-prometheus`, а потім виконуйте збирання:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний port `/metrics` або неавтентифікований шлях reverse proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image включає вбудований `HEALTHCHECK`, який звертається до `/healthz`.
Якщо перевірки продовжують завершуватися невдачею, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ із хоста до
`http://127.0.0.1:18789` працював із публікацією Docker port.

- `lan` (за замовчуванням): браузер і CLI на хості можуть досягати опублікованого port Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  напряму досягати Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не входив у цикл аварійного завершення або не
перезапускав рекламу повторно, коли bridge відкидає multicast-трафік.

Для Docker-хостів використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де mDNS multicast гарантовано працює.

Про типові проблеми та усунення несправностей див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище і збереження даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` через bind-mount у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для секретів часу виконання на основі змінних середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про збереження даних у розгортаннях на VM див. у
[Docker VM Runtime - Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Точки зростання диска:** відстежуйте `media/`, файли сеансів JSONL, `cron/runs/*.jsonl`,
і циклічні файлові журнали в `/tmp/openclaw/`.

### Допоміжні команди оболонки (необов’язково)

Для зручнішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановлювали ClawDock зі старого шляху raw `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний файл helper відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Повний посібник з helper-команд див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнути sandbox агента для Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Власний шлях до socket (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішного проходження передумов sandbox. Якщо
    налаштування sandbox не може бути завершене, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення pseudo-TTY для Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тому CLI
    команди можуть досягати Gateway через `127.0.0.1`. Сприймайте це як спільну
    межу довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається від імені `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що ваші host bind mounts належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте ваш Dockerfile так, щоб шари залежностей кешувалися. Це дозволяє уникнути повторного запуску
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

  <Accordion title="Додаткові параметри контейнера для досвідчених користувачів">
    Стандартний образ орієнтований насамперед на безпеку й працює від імені непривілейованого користувача `node`. Для більш
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

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо у майстрі ви виберете OpenAI Codex OAuth, він відкриє URL-адресу в браузері. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker image використовує `node:24-bookworm` і публікує анотації OCI базового образу,
    зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Див.
    [Анотації OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для кроків розгортання на спільній VM,
зокрема підготовки бінарних файлів, збереження даних і оновлень.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з Docker-бекендом, Gateway
виконує інструменти агента (shell, читання/запис файлів тощо) в ізольованих Docker
контейнерах, тоді як сам Gateway залишається на хості. Це дає вам жорстке розмежування
для недовірених або багатокористувацьких сесій агента без контейнеризації всього
Gateway.

Область дії sandbox може бути для окремого агента (за замовчуванням), для сесії або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки щодо безпеки та профілі для кількох агентів див. тут:

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до контейнерів sandbox
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

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

Зберіть стандартний образ sandbox:

```bash
scripts/sandbox-setup.sh
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер sandbox не запускається">
    Зберіть образ sandbox за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або встановіть `agents.defaults.sandbox.docker.image` на ваш власний образ.
    Контейнери автоматично створюються за потреби для кожної сесії.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Установіть `docker.user` на UID:GID, який відповідає власнику змонтованого workspace,
    або змініть власника теки workspace.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в sandbox">
    OpenClaw запускає команди з `sh -lc` (login shell), який зчитує
    `/etc/profile` і може скидати PATH. Установіть `docker.env.PATH`, щоб додати на початок
    шляхи до ваших власних інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Завершення через OOM під час збирання образу (код виходу 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини та повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pairing у Control UI">
    Отримайте нове посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки pairing із Docker CLI">
    Скиньте режим і прив’язку Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на базі Podman
- [ClawDock](/uk/install/clawdock) — налаштування спільноти на Docker Compose
- [Оновлення](/uk/install/updating) — як підтримувати OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
