---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте Docker-процес
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-05-02T07:52:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8467618438209c1c7c74eadf2c793dbae21622eb92fa3ddbd13d668d8be5bf1f
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або перевірка Docker-процесу.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або запуск OpenClaw на хості без локального встановлення.
- **Ні**: ви запускаєте на власній машині й хочете найшвидший цикл розробки. Натомість використайте звичайний процес встановлення.
- **Примітка щодо ізоляції**: типовий бекенд sandbox використовує Docker, коли sandboxing увімкнено, але sandboxing вимкнено типово й **не** вимагає запуску всього Gateway у Docker. Також доступні SSH і OpenShell sandbox backends. Див. [Sandboxing](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо дискового простору для образів і логів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Security hardening for network exposure](/uk/gateway/security),
  особливо Docker `DOCKER-USER` firewall policy.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    З кореня repo запустіть setup script:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це збирає образ Gateway локально. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть onboarding">
    Setup script автоматично запускає onboarding. Він:

    - запитає provider API keys
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування pre-start onboarding і записи конфігурації виконуються напряму через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте після того, як
    контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Setup script типово записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на password auth, натомість використайте цей
    пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використайте контейнер CLI, щоб додати канали повідомлень:

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

Якщо ви віддаєте перевагу запуску кожного кроку вручну замість використання setup script:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Запускайте `docker compose` з кореня repo. Якщо ви ввімкнули `OPENCLAW_EXTRA_MOUNTS`
або `OPENCLAW_HOME_VOLUME`, setup script записує `docker-compose.extra.yml`;
додайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує network namespace `openclaw-gateway`, це
post-start інструмент. Перед `docker compose up -d openclaw-gateway` запускайте onboarding
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Setup script приймає ці необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                    |
| ----------------------------------------- | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального збирання       |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Встановити додаткові apt packages під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`                     | Додати вибрані вбудовані helper-и Plugin під час збирання      |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові host bind mounts (розділені комами `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` у named Docker volume                   |
| `OPENCLAW_SANDBOX`                        | Увімкнути sandbox bootstrap (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок onboarding (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до Docker socket                            |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути Bonjour/mDNS advertising (типово `1` для Docker)      |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlays для джерел вбудованих Plugin      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільний endpoint OTLP/HTTP collector для OpenTelemetry export |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Signal-specific OTLP endpoints для traces, metrics або logs    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення OTLP protocol. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Назва service, що використовується для OpenTelemetry resources |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні GenAI semantic attributes |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, коли один уже preloaded |

Maintainers можуть тестувати джерело вбудованого Plugin проти packaged image, монтувавши
одну директорію джерела Plugin поверх її packaged source path, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ця змонтована директорія джерела перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого plugin id.

### Observability

OpenTelemetry export виконується назовні з контейнера Gateway до вашого OTLP
collector. Для нього не потрібен опублікований Docker port. Якщо ви збираєте образ
локально й хочете, щоб вбудований OpenTelemetry exporter був доступний всередині образу,
додайте його runtime dependencies:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Встановіть офіційний Plugin `@openclaw/diagnostics-otel` у packaged Docker
installs перед увімкненням export. Custom source-built images усе ще можуть додавати
локальне джерело Plugin через `OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути
export, дозвольте й увімкніть Plugin `diagnostics-otel` у конфігурації, а потім задайте
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в [OpenTelemetry
export](/uk/gateway/opentelemetry). Collector auth headers налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Prometheus metrics використовують уже опублікований порт Gateway. Увімкніть
Plugin `diagnostics-prometheus`, потім scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований reverse-proxy path. Див.
[Prometheus metrics](/uk/gateway/prometheus).

### Health checks

Container probe endpoints (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image містить вбудований `HEALTHCHECK`, який ping-ить `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
orchestration systems можуть перезапустити або замінити його.

Автентифікований deep health snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` типово задає `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із Docker port publishing.

- `lan` (типово): браузер хоста й CLI хоста можуть звертатися до опублікованого порту Gateway.
- `loopback`: лише процеси всередині network namespace контейнера можуть звертатися
  до Gateway напряму.

<Note>
Використовуйте значення bind mode у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не host aliases на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` всередині контейнера — це сам контейнер,
а не ваша host machine. Використовуйте `host.docker.internal` для AI providers, які
працюють на хості:

| Провайдер | Типова URL хоста        | URL для Docker setup                 |
| --------- | ----------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234` | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Вбудований Docker setup використовує ці host URLs як типові значення onboarding
для LM Studio та Ollama, а `docker-compose.yml` мапить `host.docker.internal` на
Docker's host gateway для Linux Docker Engine. Docker Desktop уже надає
той самий hostname у macOS і Windows.

Host services також мають слухати на адресі, доступній із Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний Compose file або команду `docker run`, додайте таке саме host
mapping самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge networking зазвичай не пересилає Bonjour/mDNS multicast
(`224.0.0.251:5353`) надійно. Тому вбудований Compose setup типово задає
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не входив у crash-loop і не перезапускав
advertising багато разів, коли bridge відкидає multicast traffic.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для Docker hosts.
Задавайте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де відомо, що mDNS multicast працює.

Підводні камені та troubleshooting див. у [Bonjour discovery](/uk/gateway/bonjour).

### Сховище та збереження

Docker Compose bind-mounts `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тому ці шляхи
переживають заміну контейнера. Коли будь-яка зі змінних не задана, вбудований
`docker-compose.yml` повертається до `${HOME}/.openclaw` (і
`${HOME}/.openclaw/workspace` для workspace mount), або до `/tmp/.openclaw`,
коли сам `HOME` також відсутній. Це не дає `docker compose up`
вивести volume spec із порожнім джерелом у мінімальних середовищах.

У цій змонтованій директорії конфігурації OpenClaw зберігає:

- `openclaw.json` для behavior config
- `agents/<agentId>/agent/auth-profiles.json` для збереженої provider OAuth/API-key auth
- `.env` для runtime secrets на основі env, як-от `OPENCLAW_GATEWAY_TOKEN`

Встановлені downloadable plugins зберігають свій package state у змонтованому
OpenClaw home, тому plugin install records і package roots переживають заміну контейнера.
Запуск Gateway не генерує dependency trees для вбудованих Plugin.

Повні деталі persistence для VM deployments див.
[Docker VM Runtime - What persists where](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, session JSONL файлами, `cron/runs/*.jsonl`, коренями пакетів установлених plugin, а також ротаційними файловими логами в `/tmp/openclaw/`.

### Shell-помічники (необов'язково)

Для простішого щоденного керування Docker встановіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний файл-помічник відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте `clawdock-help`, щоб переглянути всі команди.
Повний посібник із помічником див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнути пісочницю агента для Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Користувацький шлях до socket (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішного проходження передумов пісочниці. Якщо налаштування пісочниці неможливо завершити, скрипт скидає `agents.defaults.sandbox.mode` до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб CLI-команди могли звертатися до Gateway через `127.0.0.1`. Розглядайте це як спільну межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ працює як `node` (uid 1000). Якщо ви бачите помилки дозволів для `/home/node/.openclaw`, переконайтеся, що bind mount-и хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу не запускати `pnpm install` повторно, доки lockfile-и не зміняться:

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
    Типовий образ орієнтований насамперед на безпеку й запускається як нерутовий користувач `node`. Для функціональнішого контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: задайте `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL у браузері. У Docker або headless-середовищах скопіюйте повний URL перенаправлення, на який ви потрапите, і вставте його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний runtime-образ Docker використовує `node:24-bookworm-slim` і публікує OCI-анотації базового образу, зокрема `org.opencontainers.image.base.name`, `org.opencontainers.image.source` та інші. Digest базового образу Node оновлюється через PR Dependabot для базових образів Docker; release-збірки не запускають шар оновлення дистрибутива. Див.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime), щоб переглянути кроки розгортання на спільній VM, зокрема вбудовування binary, persistence та оновлення.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway запускає виконання інструментів агента (shell, читання/запис файлів тощо) всередині ізольованих контейнерів Docker, тоді як сам Gateway залишається на хості. Це дає жорстку межу навколо недовірених або multi-tenant сесій агентів без контейнеризації всього Gateway.

Область дії пісочниці може бути per-agent (типово), per-session або shared. Кожна область отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати політики allow/deny для інструментів, ізоляцію мережі, обмеження ресурсів і браузерні контейнери.

Повну конфігурацію, образи, примітки щодо безпеки та multi-agent профілі див. тут:

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до контейнерів пісочниці
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення per-agent

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

Зберіть типовий образ пісочниці (із checkout вихідного коду):

```bash
scripts/sandbox-setup.sh
```

Для npm-установок без checkout вихідного коду див. [Sandboxing § Images and setup](/uk/gateway/sandboxing#images-and-setup), де наведено inline-команди `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout вихідного коду) або inline-команди `docker build` з [Sandboxing § Images and setup](/uk/gateway/sandboxing#images-and-setup) (npm install),
    або задайте `agents.defaults.sandbox.docker.image` як ваш користувацький образ.
    Контейнери автоматично створюються per session на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Задайте `docker.user` як UID:GID, що відповідає власнику змонтованого workspace,
    або змініть власника папки workspace за допомогою chown.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (login shell), що завантажує `/etc/profile` і може скинути PATH. Задайте `docker.env.PATH`, щоб додати на початок ваші шляхи до користувацьких інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed під час збирання образу (exit 137)">
    VM потрібно щонайменше 2 GB RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pairing у Control UI">
    Отримайте свіже посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки pairing із Docker CLI">
    Скиньте режим і bind Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Огляд встановлення](/uk/install) — усі методи встановлення
- [Podman](/uk/install/podman) — альтернатива Podman для Docker
- [ClawDock](/uk/install/clawdock) — community-налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
