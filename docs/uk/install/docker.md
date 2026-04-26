---
read_when:
    - Ви хочете контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T21:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd8a20ac45744bb02a324de86f9b374ca1a96d7c6be2b6216967813bf0139fd5
    source_path: install/docker.md
    workflow: 15
---

Docker є **необов’язковим**. Використовуйте його лише тоді, коли вам потрібен контейнеризований Gateway або якщо ви хочете перевірити Docker-потік.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних встановлень.
- **Ні**: ви працюєте на власній машині й просто хочете найшвидший цикл розробки. Натомість скористайтеся звичайним потоком встановлення.
- **Примітка щодо ізоляції**: типовий бекенд sandbox використовує Docker, коли ізоляцію ввімкнено, але за замовчуванням ізоляція вимкнена і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди sandbox SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути примусово завершено через OOM на хостах із 1 ГБ із кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запуск відбувається на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої експозиції](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    Із кореня репозиторію запустіть скрипт налаштування:

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
    Скрипт налаштування автоматично запускає онбординг. Він:

    - запропонує ввести ключі API провайдерів
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед стартом і записи конфігурації виконуються безпосередньо через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
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

Якщо ви віддаєте перевагу запуску кожного кроку самостійно замість використання скрипта налаштування:

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
Оскільки `openclaw-cli` використовує той самий простір імен мережі, що й `openclaw-gateway`, це
інструмент після запуску. До `docker compose up -d openclaw-gateway` виконуйте онбординг
і записи конфігурації на етапі налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Variable                                   | Purpose                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Установити додаткові apt-пакунки під час збирання (назви через пробіл) |
| `OPENCLAW_EXTENSIONS`                      | Попередньо встановити залежності Plugin під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind-монтування хоста (через кому у форматі `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому Docker-томі                |
| `OPENCLAW_SANDBOX`                         | Увімкнути початкове налаштування sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до Docker socket                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути рекламу Bonjour/mDNS (для Docker за замовчуванням `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlay для вихідного коду вбудованих Plugin |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільна кінцева точка колектора OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Кінцеві точки OTLP для конкретних сигналів трасування, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Назва сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                  | Не запускати другий SDK OpenTelemetry, якщо один уже попередньо завантажено |

Супровідники можуть тестувати вихідний код вбудованого Plugin на основі пакетованого образу, змонтувавши
один каталог вихідного коду Plugin поверх його пакетованого шляху вихідного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний скомпільований
пакет `/app/dist/extensions/synology-chat` для того самого ідентифікатора Plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним із контейнера Gateway до вашого OTLP
колектора. Для цього не потрібен опублікований порт Docker. Якщо ви локально збираєте образ і хочете, щоб вбудований експортер OpenTelemetry був доступний усередині образу,
додайте його залежності виконання:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний Docker-образ релізу OpenClaw містить вихідний код вбудованого
Plugin `diagnostics-otel`. Залежно від образу та стану кешу,
Gateway може все одно підготувати локальні залежності виконання OpenTelemetry Plugin
під час першого ввімкнення Plugin, тому дозвольте під час першого запуску доступ до
реєстру пакунків або попередньо прогрійте образ у вашому релізному потоці. Щоб увімкнути експорт, дозвольте та
увімкніть Plugin `diagnostics-otel` у конфігурації, а потім задайте
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації колектора налаштовуються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
Plugin `diagnostics-prometheus`, а потім виконуйте збирання:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях зворотного проксі. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки працездатності

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # live-перевірка
curl -fsS http://127.0.0.1:18789/readyz     # перевірка готовності
```

Docker-образ містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки продовжують завершуватися помилкою, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок працездатності:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням використовує `OPENCLAW_GATEWAY_BIND=lan`, тож доступ хоста до
`http://127.0.0.1:18789` працює з опублікованим портом Docker.

- `lan` (за замовчуванням): браузер хоста та CLI хоста можуть досягти опублікованого порту Gateway.
- `loopback`: лише процеси всередині простору імен мережі контейнера можуть
  напряму досягти Gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережа моста Docker зазвичай ненадійно пересилає multicast-трафік Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose за замовчуванням використовує
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл збоїв або не
перезапускав рекламу повторно, коли міст відкидає multicast-трафік.

Для хостів Docker використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD.
Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де достеменно відомо, що multicast mDNS працює.

Щоб дізнатися про типові проблеми та способи усунення несправностей, див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та збереження даних

Docker Compose bind-монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдерів
- `.env` для секретів часу виконання на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Докладніше про повне збереження даних у розгортаннях на VM див.
[Docker VM Runtime - Що зберігається і де](/uk/install/docker-vm-runtime#what-persists-where).

**Основні джерела зростання дискового простору:** стежте за `media/`, JSONL-файлами сеансів, `cron/runs/*.jsonl`
і циклічними файловими журналами в `/tmp/openclaw/`.

### Shell helper-и (необов’язково)

Для простішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановлювали ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний helper-файл відстежував нове розташування.

Після цього використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб переглянути всі команди.
Повний посібник з helper-ів див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнути sandbox агента для Docker Gateway">
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
    налаштування sandbox неможливо завершити, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY для Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тож команди CLI
    можуть звертатися до gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ працює від імені `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind-монтування хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте ваш Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу уникнути повторного запуску
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
    Типовий образ орієнтований насамперед на безпеку й працює від непривілейованого `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Додайте системні залежності в образ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
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
    Якщо у майстрі ви виберете OpenAI Codex OAuth, він відкриє URL-адресу в браузері. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker-образ використовує `node:24-bookworm` і публікує OCI-анотації
    базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Digest базового образу Node
    оновлюється через PR Dependabot для базових Docker-образів; збірки релізів не виконують
    шар оновлення дистрибутива. Див.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для кроків розгортання на спільних VM,
зокрема підготовки бінарних файлів в образі, збереження даних і оновлень.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з Docker-бекендом, gateway
виконує інструменти агента (shell, читання/запис файлів тощо) в ізольованих Docker-
контейнерах, тоді як сам gateway залишається на хості. Це дає вам жорстку межу
навколо недовірених або багатокористувацьких сеансів агента без контейнеризації всього
gateway.

Область sandbox може бути для кожного агента окремо (за замовчуванням), для кожного сеансу або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну інформацію про конфігурацію, образи, примітки щодо безпеки та профілі з кількома агентами див. тут:

- [Ізоляція](/uk/gateway/sandboxing) -- повний довідник з sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ до shell контейнерів sandbox
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

Зберіть типовий образ sandbox:

```bash
scripts/sandbox-setup.sh
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер sandbox не запускається">
    Зберіть образ sandbox за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або задайте `agents.defaults.sandbox.docker.image` для вашого власного образу.
    Контейнери автоматично створюються за потреби для кожного сеансу.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Задайте `docker.user` як UID:GID, що відповідає правам власності змонтованого робочого простору,
    або змініть власника теки робочого простору через chown.
  </Accordion>

  <Accordion title="У sandbox не знайдено власні інструменти">
    OpenClaw запускає команди через `sh -lc` (login shell), який зчитує
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати
    ваші власні шляхи до інструментів на початок, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Процес завершено через OOM під час збирання образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини та повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pairинг у Control UI">
    Отримайте нове посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль gateway показує ws://172.x.x.x або помилки pairингy з Docker CLI">
    Скиньте режим і bind gateway:

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
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація gateway після встановлення
