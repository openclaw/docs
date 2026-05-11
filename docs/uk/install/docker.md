---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних установлень
    - Ви перевіряєте Docker-процес
summary: Необов’язкове налаштування на основі Docker та ознайомлення з OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:42:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише тоді, коли вам потрібен контейнеризований Gateway або потрібно перевірити Docker-потік.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, одноразове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних інсталяцій.
- **Ні**: ви запускаєте на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік інсталяції.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція вимкнена за замовчуванням і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди ізоляції SSH та OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ із кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Зміцнення безпеки для мережевого доступу](/uk/gateway/security),
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

    - запитає ключі API провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед стартом і записи конфігурації виконуються напряму через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте
    цей пароль натомість.

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

| Змінна                                    | Призначення                                                    |
| ----------------------------------------- | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального збирання       |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Установити додаткові пакети apt під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                     | Додати вибрані допоміжні засоби вбудованих Plugin під час збирання |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind mounts хоста (через кому `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому Docker volume             |
| `OPENCLAW_SANDBOX`                        | Увімкнути початкове налаштування ізоляції (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок онбордингу (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до Docker socket                            |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути оголошення Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlay для джерел вбудованих Plugin       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільна кінцева точка збирача OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Специфічні для сигналів кінцеві точки OTLP для трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Сьогодні підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Ім’я сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, якщо один уже попередньо завантажений |

Мейнтейнери можуть тестувати джерело вбудованого Plugin із пакетованим образом, змонтувавши
один каталог джерела Plugin поверх його пакетованого шляху джерела, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерела перевизначає відповідний скомпільований
пакет `/app/dist/extensions/synology-chat` для того самого ідентифікатора Plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним із контейнера Gateway до вашого збирача OTLP.
Він не потребує опублікованого Docker-порту. Якщо ви локально збираєте образ
і хочете, щоб вбудований експортер OpenTelemetry був доступний усередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Установіть офіційний Plugin `@openclaw/diagnostics-otel` із ClawHub у
пакетованих Docker-інсталяціях перед увімкненням експорту. Користувацькі образи,
зібрані з джерела, усе ще можуть містити локальне джерело Plugin через
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте та ввімкніть
Plugin `diagnostics-otel` у конфігурації, потім встановіть
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в [Експорт
OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації збирача налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Установіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть Plugin
`diagnostics-prometheus`, потім збирайте метрики:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Кінцеві точки проб контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки продовжують не проходити, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із публікацією портів Docker.

- `lan` (за замовчуванням): браузер хоста та CLI хоста можуть досягати опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть напряму
  досягати Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` усередині контейнера — це сам контейнер,
а не ваша хост-машина. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | Стандартна URL-адреса хоста | URL-адреса для Docker setup       |
| --------- | --------------------------- | --------------------------------- |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434` |

Вбудоване налаштування Docker використовує ці URL-адреси хоста як стандартні значення
онбордингу для LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` із
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
таке саме ім’я хоста на macOS і Windows.

Сервіси хоста також мають слухати на адресі, доступній із Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Мережа Docker bridge зазвичай не пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`) надійно. Тому вбудоване налаштування Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл аварійних перезапусків і не
перезапускав оголошення повторно, коли bridge відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для Docker-хостів.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де multicast mDNS гарантовано працює.

Про типові проблеми та усунення несправностей див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та сталість

Docker Compose bind-mount-ить `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера. Якщо будь-яку зі змінних не встановлено, вбудований
`docker-compose.yml` повертається до `${HOME}/.openclaw` (і
`${HOME}/.openclaw/workspace` для монтування робочої області) або до `/tmp/.openclaw`,
коли самого `HOME` також немає. Це не дає `docker compose up`
виводити специфікацію тому з порожнім джерелом у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої автентифікації провайдера OAuth/API-key
- `.env` для runtime-секретів на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Установлені завантажувані Plugin зберігають свій стан пакета під змонтованим
домашнім каталогом OpenClaw, тому записи інсталяції Plugin і корені пакетів зберігаються після
заміни контейнера. Запуск Gateway не генерує дерева залежностей вбудованих Plugin.

Повні відомості про сталість у VM-розгортаннях див.
[Docker VM Runtime - Що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання використання диска:** стежте за `media/`, файлами JSONL сеансів,
`cron/runs/*.jsonl`, кореневими каталогами встановлених пакетів Plugin і файловими журналами з ротацією
у `/tmp/openclaw/`.

### Допоміжні засоби оболонки (необов'язково)

Щоб спростити щоденне керування Docker, установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого шляху до необробленого файлу `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний файл помічника відповідав новому розташуванню.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Повний посібник із допоміжних засобів див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнення пісочниці агента для Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Власний шлях до сокета (наприклад, Docker без root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішної перевірки передумов пісочниці. Якщо
    налаштування пісочниці неможливо завершити, скрипт скидає `agents.defaults.sandbox.mode`
    на `off`. Звернення в режимі коду Codex усе ще обмежені Codex
    `workspace-write`, доки пісочниця OpenClaw активна; не монтуйте
    сокет Docker хоста в контейнери пісочниці агента.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб CLI
    команди могли досягати Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація Compose відкидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-gateway` і `openclaw-cli`.
  </Accordion>

  <Accordion title="Збої DNS у Docker Desktop в openclaw-cli">
    У деяких налаштуваннях Docker Desktop після відкидання `NET_RAW` не працюють DNS-запити зі спільномережевого
    допоміжного контейнера `openclaw-cli`, що проявляється як
    `EAI_AGAIN` під час команд, які спираються на npm, наприклад `openclaw plugins install`.
    Залишайте стандартний посилений файл Compose для звичайної роботи Gateway. Наведене
    нижче локальне перевизначення послаблює профіль безпеки контейнера CLI,
    відновлюючи стандартні можливості Docker, тому використовуйте його лише для одноразової CLI
    команди, якій потрібен доступ до реєстру пакетів, а не як ваш стандартний виклик Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Якщо ви вже створили довготривалий контейнер `openclaw-cli`, створіть його повторно
    з тим самим перевизначенням. `docker compose exec` і `docker exec` не можуть
    змінити можливості Linux для вже створеного контейнера.

  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що ваші bind-монтування хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Така сама невідповідність може проявлятися як попередження щодо Plugin, наприклад
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    із подальшим `plugin present but blocked`. Це означає, що uid процесу й
    власник змонтованого каталогу Plugin не збігаються. Надавайте перевагу запуску контейнера від
    стандартного uid 1000 і виправленню власника bind-монтування. Виконуйте chown
    `/path/to/openclaw-config/npm` на `root:root` лише якщо ви навмисно запускаєте
    OpenClaw від root довгостроково.

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це запобігає повторному запуску
    `pnpm install`, доки не зміняться файли блокування:

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
    Стандартний образ передусім орієнтований на безпеку й запускається як не root-користувач `node`. Для контейнера
    з ширшими можливостями:

    1. **Зберігати `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудувати системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Вбудувати Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Або встановити браузери Playwright у збережений том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Зберігати завантаження браузера**: використовуйте `OPENCLAW_HOME_VOLUME` або
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw автоматично виявляє Chromium, яким керує Playwright, в образі Docker
       на Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker без графічного інтерфейсу)">
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL браузера. У
    Docker або середовищах без графічного інтерфейсу скопіюйте повний URL переспрямування, на який ви потрапите, і вставте
    його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker-образ середовища виконання використовує `node:24-bookworm-slim` і містить `tini` як процес ініціалізації точки входу (PID 1), щоб забезпечити прибирання зомбі-процесів і правильну обробку сигналів у довготривалих контейнерах. Він публікує анотації базового образу OCI, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового образу Node
    оновлюється через запити на злиття Dependabot для базових образів Docker; релізні збірки не запускають
    шар оновлення дистрибутива. Див.
    [анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[середовище виконання Docker VM](/uk/install/docker-vm-runtime) щодо кроків розгортання на спільній VM,
зокрема вбудовування бінарних файлів, постійного зберігання й оновлень.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
запускає виконання інструментів агента (оболонка, читання/запис файлів тощо) всередині ізольованих Docker
контейнерів, тоді як сам Gateway залишається на хості. Це дає жорсткий бар'єр
навколо недовірених або мультитенантних сеансів агентів без контейнеризації всього
Gateway.

Область дії пісочниці може бути для кожного агента (за замовчуванням), для кожного сеансу або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки з безпеки й профілі для кількох агентів див. тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ через оболонку до контейнерів пісочниці
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

Зберіть стандартний образ пісочниці (з робочої копії вихідного коду):

```bash
scripts/sandbox-setup.sh
```

Для встановлень npm без робочої копії вихідного коду див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (робоча копія вихідного коду) або вбудованої команди `docker build` з [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (встановлення npm),
    або задайте для `agents.defaults.sandbox.docker.image` власний образ.
    Контейнери автоматично створюються для кожного сеансу на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Задайте `docker.user` як UID:GID, що відповідає власнику вашого змонтованого робочого простору,
    або змініть власника папки робочого простору через chown.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (оболонку входу), яка зчитує
    `/etc/profile` і може скинути PATH. Задайте `docker.env.PATH`, щоб додати ваші
    власні шляхи до інструментів на початок, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Завершено через OOM під час збирання образу (код виходу 137)">
    VM потрібно щонайменше 2 ГБ оперативної пам'яті. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Неавторизовано або потрібне сполучення в Control UI">
    Отримайте нове посилання на панель керування й схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Панель керування](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки сполучення з Docker CLI">
    Скиньте режим і прив'язку Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
