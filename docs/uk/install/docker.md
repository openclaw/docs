---
read_when:
    - Ви хочете контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T04:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6da0543ce143aeb9d3cdb2086704aaa146a5e385a7e36a7cb9f444097f86e50
    source_path: install/docker.md
    workflow: 15
---

Docker **необов’язковий**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити потік Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте все на власній машині й просто хочете найшвидший цикл розробки. Натомість скористайтеся звичайним потоком встановлення.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але за замовчуванням ізоляцію вимкнено, і для неї **не** потрібно запускати весь Gateway у Docker. Також доступні бекенди ізоляції SSH та OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах із 1 ГБ із кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої експозиції](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    У корені репозиторію запустіть скрипт налаштування:

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

    - запропонує ввести API-ключі провайдерів
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування попередній онбординг перед стартом і записи конфігурації виконуються безпосередньо через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після
    того, як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`; якщо ви переключите конфігурацію контейнера на автентифікацію за паролем, натомість використайте цей
    пароль.

    Потрібна URL-адреса знову?

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
додавайте його за допомогою `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує спільний мережевий простір імен із `openclaw-gateway`, це
інструмент для використання після запуску. До `docker compose up -d openclaw-gateway` виконуйте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Variable                       | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Встановити додаткові apt-пакети під час збирання (імена через пробіл) |
| `OPENCLAW_EXTENSIONS`          | Попередньо встановити залежності Plugin під час збирання (імена через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`        | Додаткові bind mount хоста (через кому `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Зберігати `/home/node` в іменованому Docker-томі                |
| `OPENCLAW_SANDBOX`             | Увімкнути bootstrap ізоляції (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_DOCKER_SOCKET`       | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`     | Вимкнути рекламу Bonjour/mDNS (для Docker за замовчуванням `1`) |

### Перевірки стану

Кінцеві точки probe контейнера (автентифікація не потрібна):

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
`http://127.0.0.1:18789` працював із публікацією портів Docker.

- `lan` (за замовчуванням): браузер і CLI на хості можуть звертатися до опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  напряму звертатися до Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережевий міст Docker зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому в комплектному налаштуванні Compose за замовчуванням
встановлюється `OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не переходив у crash-loop і не
перезапускав рекламу повторно, коли міст втрачає multicast-трафік.

Для хостів Docker використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або в іншій мережі, де multicast mDNS гарантовано працює.

Щоб ознайомитися з нюансами й усуненням проблем, див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та збереження даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдерів
- `.env` для секретів середовища виконання на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про збереження даних у розгортаннях на VM див. у
[Середовище виконання Docker VM — що й де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Проблемні місця зростання дискового простору:** стежте за `media/`, JSONL-файлами сеансів, `cron/runs/*.jsonl`,
і циклічними файловими журналами в `/tmp/openclaw/`.

### Допоміжні команди оболонки (необов’язково)

Для зручнішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний допоміжний файл відстежував нове розташування.

Після цього використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Запустіть
`clawdock-help`, щоб побачити всі команди.
Повний посібник із допоміжних команд див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнення ізоляції агента для Docker Gateway">
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

    Скрипт монтує `docker.sock` лише після успішної перевірки передумов ізоляції. Якщо
    налаштування ізоляції не може бути завершено, скрипт скидає `agents.defaults.sandbox.mode`
    на `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY для Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тому CLI-команди
    можуть звертатися до Gateway через `127.0.0.1`. Розглядайте це як спільну межу довіри. Конфігурація
    compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається від імені `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind mount хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дозволяє уникнути повторного запуску
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
    Стандартний образ орієнтований на безпеку й запускається від непривілейованого користувача `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Додавайте системні залежності в образ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: встановіть
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо у майстрі ви вибираєте OpenAI Codex OAuth, відкривається URL-адреса в браузері. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, куди ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний образ Docker використовує `node:24-bookworm` і публікує анотації OCI базового образу,
    включно з `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та іншими. Див.
    [Анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Середовище виконання Docker VM](/uk/install/docker-vm-runtime) для кроків розгортання на спільних VM,
включно з додаванням бінарних файлів в образ, збереженням даних і оновленнями.

## Ізоляція агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
виконує запуск інструментів агента (shell, читання/запис файлів тощо) всередині ізольованих Docker-контейнерів, тоді як сам Gateway залишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких сеансів агентів без контейнеризації всього
Gateway.

Область ізоляції може бути на рівні агента (за замовчуванням), на рівні сеансу або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну інформацію про конфігурацію, образи, примітки щодо безпеки та профілі для кількох агентів див. тут:

- [Ізоляція](/uk/gateway/sandboxing) -- повний довідник з ізоляції
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до контейнерів ізоляції
- [Ізоляція та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення на рівні агента

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

Зберіть стандартний образ ізоляції:

```bash
scripts/sandbox-setup.sh
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер ізоляції не запускається">
    Зберіть образ ізоляції за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або встановіть `agents.defaults.sandbox.docker.image` на ваш власний образ.
    Контейнери автоматично створюються для кожного сеансу за потреби.
  </Accordion>

  <Accordion title="Помилки дозволів в ізоляції">
    Установіть `docker.user` на UID:GID, що відповідає власнику змонтованого робочого простору,
    або змініть власника теки робочого простору через `chown`.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в ізоляції">
    OpenClaw виконує команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скидати PATH. Установіть `docker.env.PATH`, щоб додати
    ваші шляхи до користувацьких інструментів на початок, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Завершення через OOM під час збирання образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pair-ing у Control UI">
    Отримайте нове посилання Dashboard і підтвердьте браузерний пристрій:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки pair-ing із Docker CLI">
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
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
