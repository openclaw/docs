---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте процес Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-28T22:58:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71027022ab9fe1c5a14aa67f0e3edabb0e2aa3c668752637caef49bab5a591de
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов'язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або потрібно перевірити Docker-процес.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище Gateway або запуск OpenClaw на хості без локальних встановлень.
- **Ні**: ви працюєте на власному комп'ютері й хочете лише найшвидший цикл розробки. Натомість використовуйте звичайний процес встановлення.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляцію вимкнено за замовчуванням і вона **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди ізоляції SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути примусово завершено через OOM на хостах з 1 ГБ з кодом виходу 137)
- Достатньо дискового простору для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику Docker `DOCKER-USER` для брандмауера.

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

    - запросить API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед запуском і записи конфігурації виконуються напряму через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість
    цей пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов'язково)">
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

Якщо ви бажаєте запускати кожен крок самостійно замість використання скрипта налаштування:

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
додайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує простір імен мережі `openclaw-gateway`, це
інструмент після запуску. Перед `docker compose up -d openclaw-gateway` запускайте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов'язкові змінні середовища:

| Змінна                                    | Призначення                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Встановити додаткові пакети apt під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                     | Попередньо встановити залежності Plugin під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind mounts хоста (розділені комами `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_PLUGIN_STAGE_DIR`               | Шлях контейнера для згенерованих залежностей і дзеркал bundled Plugin |
| `OPENCLAW_SANDBOX`                        | Увімкнути bootstrap ізоляції (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок онбордингу (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути рекламу Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlays джерельного коду bundled Plugin    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільна кінцева точка колектора OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Сигнально-специфічні кінцеві точки OTLP для трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Назва сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, коли один уже попередньо завантажено |

Мейнтейнери можуть перевіряти джерельний код bundled Plugin проти упакованого образу, монтувавши
один каталог джерельного коду Plugin поверх його упакованого шляху джерельного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерельного коду перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого id Plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого
колектора OTLP. Він не потребує опублікованого порту Docker. Якщо ви збираєте образ
локально й хочете, щоб bundled exporter OpenTelemetry був доступний всередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний release-образ Docker OpenClaw містить джерельний код bundled
Plugin `diagnostics-otel`. Залежно від образу та стану кешу,
Gateway все ще може підготувати локальні для Plugin runtime-залежності OpenTelemetry під час
першого ввімкнення Plugin, тому дозвольте цьому першому запуску дістатися до реєстру пакетів
або попередньо прогрійте образ у вашій release-лінії. Щоб увімкнути експорт, дозвольте й
увімкніть Plugin `diagnostics-otel` у конфігурації, потім установіть
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації колектора
налаштовуються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
Plugin `diagnostics-prometheus`, потім виконуйте scrape:

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

Образ Docker містить вбудований `HEALTHCHECK`, який звертається до `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, а
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням задає `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із публікацією порту Docker.

- `lan` (за замовчуванням): браузер хоста й CLI хоста можуть звертатися до опублікованого порту Gateway.
- `loopback`: лише процеси всередині простору імен мережі контейнера можуть звертатися
  до Gateway напряму.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` всередині контейнера є самим контейнером,
а не вашою хост-машиною. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | Стандартна URL-адреса хоста | URL-адреса налаштування Docker |
| --------- | --------------------------- | ------------------------------ |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434` |

Bundled налаштування Docker використовує ці URL-адреси хоста як стандартні значення онбордингу
LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` із
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
те саме ім'я хоста на macOS і Windows.

Сервіси хоста також мають слухати адресу, доступну з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Bridge-мережа Docker зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому bundled налаштування Compose за замовчуванням задає
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у crash-loop або не перезапускав
рекламу повторно, коли bridge відкидає multicast-трафік.

Для Docker-хостів використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD.
Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де multicast mDNS гарантовано працює.

Підводні камені й усунення несправностей див. у [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та сталість

Docker Compose bind-mounts `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для runtime-секретів із середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Bundled runtime-залежності Plugin і дзеркальовані runtime-файли є згенерованим
станом, а не користувацькою конфігурацією. Compose зберігає їх в іменованому томі Docker
`openclaw-plugin-runtime-deps`, змонтованому в
`/var/lib/openclaw/plugin-runtime-deps`. Винесення цього дерева з великою кількістю змін за межі
bind mount конфігурації хоста запобігає повільним файловим операціям Docker Desktop/WSL і застарілим
дескрипторам Windows під час холодного запуску Gateway.

Стандартний файл Compose задає `OPENCLAW_PLUGIN_STAGE_DIR` на цей шлях як для
`openclaw-gateway`, так і для `openclaw-cli`, тому `openclaw doctor --fix`, команди
входу/налаштування каналів і запуск Gateway використовують той самий згенерований
том середовища виконання.

Повні відомості про сталість даних у розгортаннях VM див.
[Середовище виконання Docker VM - що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій, `cron/runs/*.jsonl`,
томом Docker `openclaw-plugin-runtime-deps` і ротаційними файловими журналами в
`/tmp/openclaw/`.

### Допоміжні shell-скрипти (необов'язково)

Для простішого щоденного керування Docker встановіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний допоміжний файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Запустіть
`clawdock-help`, щоб переглянути всі команди.
Повний посібник із допоміжних скриптів див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнути пісочницю агента для Docker gateway">
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

    Скрипт монтує `docker.sock` лише після успішної перевірки передумов пісочниці. Якщо
    налаштування пісочниці не може завершитися, скрипт скидає `agents.defaults.sandbox.mode`
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
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб команди CLI
    могли звертатися до gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind-монтування на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу не запускати
    `pnpm install` повторно, якщо lock-файли не змінилися:

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
    Стандартний образ орієнтований передусім на безпеку й запускається як непривілейований `node`. Для
    функціональнішого контейнера:

    1. **Зберігайте `/home/node` стало**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів стало**: задайте
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL браузера. У
    Docker або headless-налаштуваннях скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker-образ середовища виконання використовує `node:24-bookworm-slim` і публікує OCI
    анотації базового образу, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового образу Node
    оновлюється через PR Dependabot для базових Docker-образів; release-збірки не запускають
    шар оновлення дистрибутива. Див.
    [Анотації OCI-образів](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Середовище виконання Docker VM](/uk/install/docker-vm-runtime) щодо спільних кроків розгортання VM,
зокрема вбудовування бінарних файлів, сталості даних і оновлень.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) в ізольованих Docker
контейнерах, тоді як сам gateway залишається на хості. Це створює жорстку межу
навколо ненадійних або багатокористувацьких сесій агентів без контейнеризації всього
gateway.

Область пісочниці може бути для окремого агента (стандартно), для окремої сесії або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Також можна налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки щодо безпеки та профілі для кількох агентів див.:

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

Зберіть стандартний образ пісочниці:

```bash
scripts/sandbox-setup.sh
```

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або задайте `agents.defaults.sandbox.docker.image` на ваш власний образ.
    Контейнери автоматично створюються для кожної сесії на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Установіть `docker.user` на UID:GID, що відповідає власнику змонтованого робочого простору,
    або змініть власника папки робочого простору за допомогою chown.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (login shell), який зчитує
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати на початок ваші
    власні шляхи до інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed під час збирання образу (exit 137)">
    VM потребує щонайменше 2 GB RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Неавторизовано або потрібне сполучення в інтерфейсі керування">
    Отримайте свіже посилання на панель керування й схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Панель керування](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки сполучення з Docker CLI">
    Скиньте режим gateway і прив'язку:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Podman для Docker
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація gateway після встановлення
