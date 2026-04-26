---
read_when:
    - Ви хочете контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T04:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b2d73da68266946f62feca240bdd94336a3f15e9ca48f0a52209f4ae4a85ffe
    source_path: install/docker.md
    workflow: 15
---

Docker **необов’язковий**. Використовуйте його лише якщо хочете контейнеризований Gateway або перевірити потік Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік встановлення.
- **Примітка щодо ізоляції**: типовий бекенд sandbox використовує Docker, коли ізоляцію ввімкнено, але за замовчуванням ізоляція вимкнена і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди sandbox SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо дискового простору для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої доступності](/uk/gateway/security),
  особливо політику файрвола Docker `DOCKER-USER`.

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
    Скрипт налаштування запускає онбординг автоматично. Він:

    - запросить API-ключі провайдерів
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування передстартовий онбординг і запис конфігурації виконуються
    безпосередньо через `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`; якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість цей
    пароль.

    Потрібна URL-адреса знову?

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
додавайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує мережевий простір імен `openclaw-gateway`, це
інструмент після запуску. До `docker compose up -d openclaw-gateway` запускайте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Variable                       | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Використовувати віддалений образ замість локального збирання    |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Встановити додаткові apt-пакети під час збирання (імена через пробіл) |
| `OPENCLAW_EXTENSIONS`          | Попередньо встановити залежності плагінів під час збирання (імена через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`        | Додаткові bind mounts хоста (через кому у форматі `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Зберігати `/home/node` в іменованому Docker volume              |
| `OPENCLAW_SANDBOX`             | Увімкнути bootstrap sandbox (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`       | Перевизначити шлях до Docker socket                             |
| `OPENCLAW_DISABLE_BONJOUR`     | Вимкнути рекламу Bonjour/mDNS (для Docker за замовчуванням `1`) |

### Перевірки здоров’я

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Образ Docker містить вбудований `HEALTHCHECK`, який виконує ping до `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану здоров’я:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN чи loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб
доступ хоста до `http://127.0.0.1:18789` працював із публікацією порту Docker.

- `lan` (за замовчуванням): браузер хоста і CLI хоста можуть досягати опублікованого порту gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  напряму досягати gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не хост-аліаси на кшталт `0.0.0.0` чи `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережа мосту Docker зазвичай ненадійно пересилає багатокастовий трафік Bonjour/mDNS
(`224.0.0.251:5353`). Тому комплектна конфігурація Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у crash-loop і не
перезапускав рекламу повторно, коли міст втрачає багатокастовий трафік.

Для хостів Docker використовуйте опубліковану URL-адресу Gateway, Tailscale або DNS-SD широкої зони.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час роботи з host networking, macvlan
або іншою мережею, де багатокастовий mDNS точно працює.

### Сховище та збереження даних

Docker Compose виконує bind-mount `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для секретів середовища виконання, що передаються через env, як-от `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про збереження даних у розгортаннях на VM див. у
[Docker VM Runtime - Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Точки росту використання диска:** стежте за `media/`, файлами JSONL сеансів, `cron/runs/*.jsonl`,
і ротаційними файловими журналами в `/tmp/openclaw/`.

### Допоміжні команди shell (необов’язково)

Для зручнішого повсякденного керування Docker встановіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб локальний файл helper відстежував нове розташування.

Після цього використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Запустіть
`clawdock-help`, щоб переглянути всі команди.
Повний посібник із helper-команд див. у [ClawDock](/uk/install/clawdock).

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
    налаштування sandbox не вдається завершити, скрипт скидає `agents.defaults.sandbox.mode`
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
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тож CLI
    команди можуть досягати gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose видаляє `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ працює від імені `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що ваші bind mounts хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дозволяє уникнути повторного запуску
    `pnpm install`, доки lockfile не зміниться:

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

  <Accordion title="Контейнерні параметри для досвідчених користувачів">
    Типовий образ орієнтований на безпеку й працює від непривілейованого `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Встановіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузера**: встановіть
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (headless Docker)">
    Якщо у майстрі ви оберете OAuth OpenAI Codex, він відкриє URL-адресу в браузері. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний образ Docker використовує `node:24-bookworm` і публікує анотації OCI базового образу,
    зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Див.
    [Анотації образу OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для кроків розгортання на спільній VM,
зокрема підготовки бінарних файлів, збереження даних і оновлень.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з Docker-бекендом, gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) в ізольованих Docker
контейнерах, тоді як сам gateway залишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких сеансів агентів без контейнеризації всього
gateway.

Область sandbox може бути для кожного агента окремо (за замовчуванням), для кожного сеансу або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки щодо безпеки та профілі для кількох агентів див. тут:

- [Ізоляція](/uk/gateway/sandboxing) -- повний довідник із sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ shell до контейнерів sandbox
- [Sandbox і інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

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
    або встановіть власний образ у `agents.defaults.sandbox.docker.image`.
    Контейнери автоматично створюються для кожного сеансу за потреби.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Встановіть `docker.user` у UID:GID, що відповідає власнику змонтованого workspace,
    або змініть власника папки workspace через chown.
  </Accordion>

  <Accordion title="У sandbox не знайдено користувацькі інструменти">
    OpenClaw запускає команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скинути PATH. Встановіть `docker.env.PATH`, щоб додати
    шляхи до ваших користувацьких інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Під час збирання образу завершено через OOM (код виходу 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pairing у Control UI">
    Отримайте нове посилання dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль gateway показує ws://172.x.x.x або помилки pairing з Docker CLI">
    Скиньте режим і bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на базі Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — як підтримувати OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація gateway після встановлення
