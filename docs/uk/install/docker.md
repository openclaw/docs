---
read_when:
    - Ви хочете контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте процес Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-28T11:16:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2fe308bdcc243b59923d2b05ba543d63fa146747b9df9bdd59eef76bac187c8
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов'язковим**. Використовуйте його лише якщо вам потрібен контейнеризований gateway або потрібно перевірити Docker-потік.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище gateway або запуск OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте на власній машині й хочете лише найшвидший цикл розробки. Натомість використовуйте звичайний потік встановлення.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція типово вимкнена й **не** потребує запуску всього gateway у Docker. Також доступні бекенди ізоляції SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ із кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої доступності](/uk/gateway/security),
  особливо політику Docker `DOCKER-USER` для firewall.

## Контейнеризований gateway

<Steps>
  <Step title="Build the image">
    З кореня репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збирає образ gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    Скрипт налаштування автоматично запускає onboarding. Він:

    - запитає API-ключі провайдера
    - згенерує токен gateway і запише його в `.env`
    - запустить gateway через Docker Compose

    Під час налаштування onboarding перед запуском і записи конфігурації виконуються
    напряму через `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер gateway уже існує.

  </Step>

  <Step title="Open the Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    спільний секрет у Settings. Скрипт налаштування типово записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте
    цей пароль натомість.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
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
інструмент після запуску. Перед `docker compose up -d openclaw-gateway` запускайте onboarding
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов'язкові змінні середовища:

| Змінна                                    | Призначення                                                    |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Встановити додаткові apt-пакети під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                      | Попередньо встановити залежності плагінів під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind-mount хоста (через кому `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому Docker-томі                |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | Шлях у контейнері для згенерованих залежностей і дзеркал bundled-плагінів |
| `OPENCLAW_SANDBOX`                         | Увімкнути bootstrap ізоляції (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до Docker socket                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути рекламування Bonjour/mDNS (типово `1` для Docker)      |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlay для джерел bundled-плагінів         |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільний endpoint колектора OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | OTLP endpoint-и для конкретних сигналів: трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Назва сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                  | Пропустити запуск другого OpenTelemetry SDK, якщо один уже попередньо завантажено |

Maintainers можуть тестувати джерело bundled-плагіна з packaged-образом, змонтувавши
один каталог джерела плагіна поверх його packaged-шляху джерела, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерела перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого id плагіна.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого OTLP
колектора. Він не потребує опублікованого Docker-порту. Якщо ви збираєте образ
локально й хочете, щоб bundled-експортер OpenTelemetry був доступний усередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний release-образ Docker для OpenClaw містить джерело bundled-плагіна
`diagnostics-otel`. Залежно від образу й стану кешу,
Gateway усе ще може staged-залежності OpenTelemetry runtime, локальні для плагіна,
під час першого ввімкнення плагіна, тож дозвольте цьому першому запуску дістатися package
registry або prewarm образ у вашій release lane. Щоб увімкнути експорт, дозвольте й
увімкніть плагін `diagnostics-otel` у конфігурації, потім встановіть
`diagnostics.otel.enabled=true` або скористайтеся прикладом конфігурації в
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації колектора
налаштовуються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
плагін `diagnostics-prometheus`, потім збирайте:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищено автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Endpoint-и проб контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який звертається до `/healthz`.
Якщо перевірки й далі не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` типово встановлює `OPENCLAW_GATEWAY_BIND=lan`, тож доступ хоста до
`http://127.0.0.1:18789` працює через публікацію порту Docker.

- `lan` (типово): браузер хоста й CLI хоста можуть дістатися опублікованого порту gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть дістатися
  gateway напряму.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` усередині контейнера є самим контейнером,
а не вашою хост-машиною. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | Типова URL-адреса хоста | URL-адреса для Docker setup         |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Bundled Docker setup використовує ці URL-адреси хоста як onboarding-значення за замовчуванням
для LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` з
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
те саме ім'я хоста на macOS і Windows.

Сервіси хоста також мають слухати адресу, доступну з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний Compose-файл або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Мережа Docker bridge зазвичай не пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`) надійно. Тому bundled Compose setup типово встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у crash-loop і не перезапускав
рекламування повторно, коли bridge відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для Docker-хостів.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де mDNS multicast гарантовано працює.

Підводні камені й усунення несправностей див. у [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та сталість

Docker Compose bind-mount-ить `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої автентифікації провайдера OAuth/API-key
- `.env` для runtime-секретів на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Bundled runtime-залежності плагінів і дзеркальні runtime-файли є згенерованим
станом, а не користувацькою конфігурацією. Compose зберігає їх в іменованому Docker-томі
`openclaw-plugin-runtime-deps`, змонтованому в
`/var/lib/openclaw/plugin-runtime-deps`. Утримання цього дерева з високою частотою змін поза
bind mount конфігурації хоста запобігає повільним файловим операціям Docker Desktop/WSL і застарілим
дескрипторам Windows під час холодного запуску Gateway.

Стандартний Compose-файл встановлює `OPENCLAW_PLUGIN_STAGE_DIR` у цей шлях як для
`openclaw-gateway`, так і для `openclaw-cli`, тож `openclaw doctor --fix`, команди
login/setup каналів і запуск Gateway усі використовують той самий згенерований runtime
volume.

Докладні відомості про повне збереження даних у розгортаннях VM див.
[Docker VM Runtime - Що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій, `cron/runs/*.jsonl`,
томом Docker `openclaw-plugin-runtime-deps` і ротаційними файловими журналами в
`/tmp/openclaw/`.

### Допоміжні shell-скрипти (необов’язково)

Для простішого щоденного керування Docker встановіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний допоміжний файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Запустіть
`clawdock-help`, щоб переглянути всі команди.
Повний посібник із допоміжного інструмента див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнути пісочницю агента для Docker Gateway">
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

    Скрипт монтує `docker.sock` лише після виконання передумов пісочниці. Якщо
    налаштування пісочниці неможливо завершити, скрипт скидає `agents.defaults.sandbox.mode`
    на `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення Compose pseudo-TTY за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб CLI
    команди могли звертатися до Gateway через `127.0.0.1`. Вважайте це спільною
    межею довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
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
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу уникнути повторного запуску
    `pnpm install`, якщо lockfile-и не змінилися:

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
    Стандартний образ орієнтований насамперед на безпеку й запускається як непривілейований `node`. Для більш
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
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL у браузері. У
    Docker або headless-середовищах скопіюйте повний URL перенаправлення, на який ви потрапите, і вставте
    його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний runtime-образ Docker використовує `node:24-bookworm-slim` і публікує анотації базового образу OCI,
    зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Digest базового образу Node
    оновлюється через PR Dependabot для базового образу Docker; release-збірки не запускають
    шар оновлення дистрибутива. Див.
    [Анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для спільних кроків розгортання VM,
зокрема вбудовування бінарних файлів, збереження даних і оновлення.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) всередині ізольованих Docker
контейнерів, тоді як сам Gateway лишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких агентських сесій без контейнеризації всього
Gateway.

Область дії пісочниці може бути для кожного агента (за замовчуванням), для кожної сесії або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки з безпеки та багатоагентні профілі див. тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник із пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до контейнерів пісочниці
- [Багатоагентна пісочниця та інструменти](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для кожного агента

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

Зберіть стандартний образ пісочниці:

```bash
scripts/sandbox-setup.sh
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або задайте `agents.defaults.sandbox.docker.image` для власного образу.
    Контейнери автоматично створюються для кожної сесії за запитом.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Задайте `docker.user` як UID:GID, що відповідає власнику вашого змонтованого робочого простору,
    або змініть власника папки робочого простору за допомогою chown.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати
    шляхи до власних інструментів на початок, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed під час збирання образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Неавторизовано або потрібне сполучення в Control UI">
    Отримайте свіже посилання на dashboard і схваліть пристрій браузера:

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
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
