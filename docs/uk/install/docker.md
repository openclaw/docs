---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних інсталяцій
    - Ви перевіряєте Docker-процес
summary: Необов’язкове налаштування та онбординг на базі Docker для OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо потрібен контейнеризований Gateway або потрібно перевірити Docker-процес.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище Gateway або запуск OpenClaw на хості без локальних установок.
- **Ні**: ви запускаєте на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний процес установлення.
- **Примітка щодо пісочниці**: типовий бекенд пісочниці використовує Docker, коли пісочницю ввімкнено, але пісочниця вимкнена за замовчуванням і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди пісочниці SSH і OpenShell. Див. [Пісочниця](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Принаймні 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ із кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику firewall Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зібрати образ">
    З кореня репозиторію запустіть сценарій налаштування:

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

  <Step title="Завершити онбординг">
    Сценарій налаштування автоматично запускає онбординг. Він:

    - запросить API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - створить каталог секретного ключа auth-profile
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед стартом і записи конфігурації виконуються напряму через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрити Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Сценарій налаштування за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте
    натомість цей пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштувати канали (необов’язково)">
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

### Ручний процес

Якщо ви віддаєте перевагу самостійному запуску кожного кроку замість використання сценарію налаштування:

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
або `OPENCLAW_HOME_VOLUME`, сценарій налаштування записує `docker-compose.extra.yml`;
додайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує мережевий простір імен `openclaw-gateway`, це
інструмент після старту. До `docker compose up -d openclaw-gateway` запускайте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Сценарій налаштування приймає такі необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                    |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Установити додаткові apt-пакети під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                      | Додати вибрані вбудовані допоміжні засоби Plugin під час збирання |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind mount з хоста (через кому: `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_SANDBOX`                         | Увімкнути bootstrap пісочниці (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_SKIP_ONBOARDING`                 | Пропустити інтерактивний крок онбордингу (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути оголошення Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlay для джерел вбудованих Plugin        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільна кінцева точка збирача OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Специфічні для сигналів кінцеві точки OTLP для трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Ім’я сервісу, що використовується для ресурсів OpenTelemetry    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                  | Пропустити запуск другого OpenTelemetry SDK, якщо один уже попередньо завантажено |

Супровідники можуть тестувати джерела вбудованого Plugin із запакованим образом, монтувавши
один каталог джерел Plugin поверх його запакованого шляху джерел, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог джерел перевизначає відповідний скомпільований пакет
`/app/dist/extensions/synology-chat` для того самого id Plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого збирача OTLP.
Він не потребує опублікованого порту Docker. Якщо ви збираєте образ локально
і хочете, щоб вбудований експортер OpenTelemetry був доступний всередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Установіть офіційний Plugin `@openclaw/diagnostics-otel` з ClawHub у
запакованих установках Docker перед увімкненням експорту. Користувацькі образи,
зібрані з джерел, усе ще можуть додати локальні джерела Plugin через
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте й увімкніть
Plugin `diagnostics-otel` у конфігурації, потім встановіть
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в [Експорт
OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації збирача налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Установіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть Plugin
`diagnostics-prometheus`, потім виконуйте scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищено автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки справності

Кінцеві точки проб контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Образ Docker містить вбудований `HEALTHCHECK`, який перевіряє `/healthz`.
Якщо перевірки продовжують не проходити, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок справності:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN і loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював через публікацію порту Docker.

- `lan` (за замовчуванням): браузер хоста і CLI хоста можуть досягти опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть напряму досягти
  Gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` всередині контейнера — це сам контейнер,
а не ваша хост-машина. Використовуйте `host.docker.internal` для провайдерів ШІ, які
запускаються на хості:

| Провайдер | Типова URL-адреса хоста | URL-адреса для Docker setup        |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Вбудоване налаштування Docker використовує ці URL-адреси хоста як типові значення
онбордингу LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` з
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
те саме ім’я хоста на macOS і Windows.

Сервіси хоста також мають слухати адресу, доступну з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Мережева bridge-схема Docker зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у crash-loop і не перезапускав
оголошення повторно, коли bridge відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для хостів Docker.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де відомо, що multicast mDNS працює.

Щодо нюансів і усунення несправностей див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та сталість

Docker Compose bind-mount-ить `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, а
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` до `/home/node/.config/openclaw`, тому ці
шляхи зберігаються після заміни контейнера. Якщо будь-яка змінна не задана, вбудований
`docker-compose.yml` використовує fallback під `${HOME}`, або `/tmp`, якщо сам `HOME`
також відсутній. Це запобігає виведенню `docker compose up` специфікації тому
з порожнім джерелом у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для runtime-секретів із середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Каталог секретного ключа auth-profile зберігає локальний ключ шифрування, що використовується для
матеріалу токенів auth profile на основі OAuth. Зберігайте його разом зі станом вашого Docker-хоста,
але окремо від `OPENCLAW_CONFIG_DIR`.

Установлені завантажувані компоненти Plugin зберігають стан своїх пакетів у змонтованому домашньому каталозі OpenClaw, тому записи встановлення компонентів Plugin і кореневі каталоги пакетів переживають заміну контейнера. Запуск Gateway не створює дерева залежностей вбудованих компонентів Plugin.

Повні відомості про збереження даних у розгортаннях на ВМ див.
[Середовище виконання Docker VM - що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сеансів,
`cron/runs/*.jsonl`, кореневими каталогами пакетів установлених компонентів Plugin і змінними файловими журналами
у `/tmp/openclaw/`.

### Допоміжні засоби оболонки (необов’язково)

Для простішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб локальний файл допоміжних засобів відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб переглянути всі команди.
Повний посібник із допоміжних засобів див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнути пісочницю агента для Docker Gateway">
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

    Скрипт монтує `docker.sock` лише після успішного проходження передумов пісочниці. Якщо
    налаштування пісочниці не вдається завершити, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`. Ходи режиму коду Codex усе ще обмежені Codex
    `workspace-write`, поки пісочниця OpenClaw активна; не монтуйте
    Docker-сокет хоста в контейнери пісочниці агента.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб команди CLI
    могли звертатися до Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` як для `openclaw-gateway`, так і для `openclaw-cli`.
  </Accordion>

  <Accordion title="Збої DNS Docker Desktop в openclaw-cli">
    У деяких налаштуваннях Docker Desktop DNS-запити зі спільномережевого
    сайдкара `openclaw-cli` не виконуються після скидання `NET_RAW`, що проявляється як
    `EAI_AGAIN` під час команд на базі npm, як-от `openclaw plugins install`.
    Для звичайної роботи Gateway залишайте типовий посилений compose-файл. Наведене
    нижче локальне перевизначення послаблює безпекову конфігурацію контейнера CLI,
    відновлюючи типові можливості Docker, тож використовуйте його лише для одноразової команди CLI,
    якій потрібен доступ до реєстру пакетів, а не як типовий виклик Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Якщо ви вже створили довготривалий контейнер `openclaw-cli`, відтворіть його
    з тим самим перевизначенням. `docker compose exec` і `docker exec` не можуть
    змінити можливості Linux у вже створеному контейнері.

  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (UID 1000). Якщо ви бачите помилки дозволів на
    `/home/node/.openclaw`, переконайтеся, що ваші bind mount на хості належать UID 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Та сама невідповідність може проявлятися як попередження Plugin на кшталт
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    із подальшим `plugin present but blocked`. Це означає, що UID процесу та
    власник змонтованого каталогу Plugin не збігаються. Надавайте перевагу запуску контейнера з
    типовим UID 1000 і виправленню власника bind mount. Виконуйте chown
    `/path/to/openclaw-config/npm` до `root:root` лише якщо ви навмисно запускаєте
    OpenClaw як root у довгостроковій перспективі.

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це запобігає повторному виконанню
    `pnpm install`, якщо lockfile не змінилися:

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

  <Accordion title="Опції контейнера для досвідчених користувачів">
    Типовий образ орієнтований передусім на безпеку й запускається як non-root `node`. Для
    повнішого за можливостями контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Вбудуйте Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Або встановіть браузери Playwright у збережений том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Зберігайте завантаження браузера**: використовуйте `OPENCLAW_HOME_VOLUME` або
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw автоматично виявляє керований Playwright Chromium з Docker-образу
       на Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker без графічного інтерфейсу)">
    Якщо в майстрі ви виберете OpenAI Codex OAuth, він відкриє URL у браузері. У
    Docker або середовищах без графічного інтерфейсу скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker-образ середовища виконання використовує `node:24-bookworm-slim` і включає `tini` як init-процес точки входу (PID 1), щоб процеси-зомбі прибиралися, а сигнали коректно оброблялися в довготривалих контейнерах. Він публікує анотації базового образу OCI, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Базовий digest Node
    оновлюється через PR Dependabot для базового Docker-образу; збірки випусків не запускають
    шар оновлення дистрибутива. Див.
    [анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Середовище виконання Docker VM](/uk/install/docker-vm-runtime) для спільних кроків розгортання на ВМ,
зокрема вбудовування бінарних файлів, збереження даних і оновлення.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
виконує інструменти агента (оболонка, читання/запис файлів тощо) в ізольованих Docker-контейнерах,
поки сам Gateway залишається на хості. Це створює жорстку межу
навколо ненадійних або багатокористувацьких сеансів агентів без контейнеризації всього
Gateway.

Область дії пісочниці може бути на агента (типово), на сеанс або спільною. Кожна область
отримує власну робочу область, змонтовану в `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки щодо безпеки та багатоагентні профілі див. тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ до оболонки контейнерів пісочниці
- [Багатоагентна пісочниця та інструменти](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

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

Зберіть типовий образ пісочниці (з робочої копії вихідного коду):

```bash
scripts/sandbox-setup.sh
```

Для встановлень через npm без робочої копії вихідного коду див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (робоча копія вихідного коду) або вбудованої команди `docker build` з [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (встановлення через npm),
    або встановіть для `agents.defaults.sandbox.docker.image` свій користувацький образ.
    Контейнери автоматично створюються для кожного сеансу за потреби.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Встановіть `docker.user` у UID:GID, що відповідає власнику змонтованої робочої області,
    або змініть власника папки робочої області за допомогою chown.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (login shell), яка зчитує
    `/etc/profile` і може скинути PATH. Встановіть `docker.env.PATH`, щоб додати ваші
    шляхи до користувацьких інструментів на початок, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Процес завершено через OOM під час збирання образу (код виходу 137)">
    ВМ потребує щонайменше 2 GB RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Не авторизовано або в Control UI потрібне сполучення">
    Отримайте нове посилання на панель керування та схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Панель керування](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

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
- [Podman](/uk/install/podman) — альтернатива Podman для Docker
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
