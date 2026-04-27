---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних установок
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-27T07:08:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56766c90b2751d186b0e9a7b55241fb45f05a37c2e8d7c0d0155b41eefc2177a
    source_path: install/docker.md
    workflow: 15
---

Docker **необов’язковий**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити потік Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних установок.
- **Ні**: ви запускаєте його на власному комп’ютері й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік встановлення.
- **Примітка щодо ізоляції**: типовий бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція за замовчуванням вимкнена і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди ізоляції SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути примусово завершено через OOM на хостах із 1 ГБ із кодом виходу 137)
- Достатньо дискового простору для образів і журналів
- Якщо запуск відбувається на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику фаєрвола Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    Із кореня репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ Gateway. Щоб замість цього використовувати попередньо зібраний образ:

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

    - запросить API-ключі провайдера
    - згенерує токен Gateway і запише його до `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг до запуску й запис конфігурації виконуються
    безпосередньо через `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того, як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`; якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість цей пароль.

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
додайте його за допомогою `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує спільний простір імен мережі з `openclaw-gateway`, це інструмент для використання після запуску. До `docker compose up -d openclaw-gateway` виконуйте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Variable                                   | Purpose                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використовувати віддалений образ замість локального збирання    |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Встановити додаткові пакети apt під час збирання (імена через пробіл) |
| `OPENCLAW_EXTENSIONS`                      | Попередньо встановити залежності plugin під час збирання (імена через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind mounts хоста (через кому у форматі `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_SANDBOX`                         | Увімкнути початкове налаштування ізоляції (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути рекламу Bonjour/mDNS (для Docker за замовчуванням `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlays для вихідного коду вбудованих plugin |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільна кінцева точка колектора OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Кінцеві точки OTLP для traces, metrics або logs, специфічні для сигналу |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Назва сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути новітні експериментальні семантичні атрибути GenAI    |
| `OPENCLAW_OTEL_PRELOADED`                  | Пропустити запуск другого SDK OpenTelemetry, якщо один уже попередньо завантажено |

Супровідники можуть тестувати вихідний код вбудованого plugin із запакованим образом, змонтувавши
один каталог вихідного коду plugin поверх його шляху запакованого вихідного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний скомпільований
бандл `/app/dist/extensions/synology-chat` для того самого ідентифікатора plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним із контейнера Gateway до вашого колектора OTLP.
Для нього не потрібен опублікований порт Docker. Якщо ви локально збираєте образ і хочете, щоб вбудований експортер OpenTelemetry був доступний усередині образу,
додайте його залежності часу виконання:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний релізний Docker-образ OpenClaw містить вихідний код вбудованого
plugin `diagnostics-otel`. Залежно від стану образу й кешу,
Gateway може все одно підготувати локальні залежності OpenTelemetry для plugin
під час першого ввімкнення plugin, тому дозвольте цьому першому запуску мати доступ до реєстру пакетів
або попередньо прогрійте образ у вашому релізному потоці. Щоб увімкнути експорт, дозвольте й
увімкніть plugin `diagnostics-otel` у конфігурації, а потім установіть
`diagnostics.otel.enabled=true` або скористайтеся прикладом конфігурації з
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації колектора
налаштовуються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
plugin `diagnostics-prometheus`, а потім виконуйте збирання:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищено автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях зворотного проксі. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки продовжують завершуватися помилкою, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований докладний знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN чи loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із публікацією портів Docker.

- `lan` (типово): браузер і CLI на хості можуть отримати доступ до опублікованого порту Gateway.
- `loopback`: лише процеси всередині простору імен мережі контейнера можуть
  напряму отримати доступ до Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає мультикаст Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose типово встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл аварійних перезапусків і
не перезапускав рекламу знову й знову, коли bridge втрачає мультикаст-трафік.

Для Docker-хостів використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD.
Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час роботи з host networking, macvlan
або іншою мережею, де мультикаст mDNS гарантовано працює.

Про типові проблеми та усунення несправностей див.
[Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та збереження даних

Docker Compose монтує через bind `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для секретів часу виконання на основі змінних середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про збереження даних у розгортаннях на VM див. у
[Середовище виконання Docker VM — що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Точки зростання диска:** стежте за `media/`, файлами JSONL сеансів, `cron/runs/*.jsonl`,
і файлами циклічних журналів у `/tmp/openclaw/`.

### Допоміжні команди оболонки (необов’язково)

Для зручнішого повсякденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановлювали ClawDock зі старого шляху raw `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте команду встановлення вище, щоб ваш локальний файл helper відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Див. [ClawDock](/uk/install/clawdock), щоб ознайомитися з повним посібником з helper.

<AccordionGroup>
  <Accordion title="Увімкнути ізоляцію агента для Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Нестандартний шлях до сокета (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішного проходження передумов ізоляції. Якщо
    налаштування ізоляції не вдається завершити, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

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
    межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Права доступу та EACCES">
    Образ працює від імені `node` (uid 1000). Якщо ви бачите помилки прав доступу на
    `/home/node/.openclaw`, переконайтеся, що bind mounts на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дозволяє уникнути повторного запуску
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

  <Accordion title="Розширені параметри контейнера">
    Типовий образ насамперед орієнтований на безпеку й працює від імені непривілейованого `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Встановіть браузери Playwright**:
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
    Основний Docker-образ середовища виконання використовує `node:24-bookworm-slim` і публікує OCI
    анотації базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Digest базового образу Node
    оновлюється через PR Dependabot для базових Docker-образів; релізні збірки не виконують
    шар оновлення дистрибутива. Див.
    [Анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime), щоб переглянути кроки розгортання на спільних VM
включно з вбудовуванням бінарних файлів, збереженням даних і оновленнями.

## Ізоляція агента

Коли `agents.defaults.sandbox` увімкнено з Docker-бекендом, Gateway
виконує інструменти агента (shell, читання/запис файлів тощо) в ізольованих Docker-
контейнерах, тоді як сам Gateway залишається на хості. Це створює жорстку межу
навколо недовірених або мультитенантних сеансів агентів без контейнеризації всього
Gateway.

Область ізоляції може бути для кожного агента окремо (типово), для кожного сеансу або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і
контейнери браузера.

Повну інформацію про конфігурацію, образи, примітки щодо безпеки й профілі з кількома агентами див. у:

- [Ізоляція](/uk/gateway/sandboxing) -- повний довідник з ізоляції
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ shell до контейнерів ізоляції
- [Ізоляція й інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

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

Зберіть типовий образ ізоляції:

```bash
scripts/sandbox-setup.sh
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер ізоляції не запускається">
    Зберіть образ ізоляції за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або встановіть `agents.defaults.sandbox.docker.image` на ваш власний образ.
    Контейнери автоматично створюються за потреби для кожного сеансу.
  </Accordion>

  <Accordion title="Помилки прав доступу в ізоляції">
    Установіть `docker.user` на UID:GID, що відповідає власнику змонтованого workspace,
    або змініть власника папки workspace через chown.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в ізоляції">
    OpenClaw запускає команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скинути PATH. Установіть `docker.env.PATH`, щоб додати
    ваші власні шляхи до інструментів на початок, або додайте скрипт до `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Примусове завершення через OOM під час збирання образу (код виходу 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини та повторіть спробу.
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
    Скиньте режим Gateway і прив’язку:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker у вигляді Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — як підтримувати OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
