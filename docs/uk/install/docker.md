---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте процес Docker
summary: Необов’язкове налаштування й онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-29T00:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або перевірка Docker-потоку.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, одноразове середовище Gateway або запуск OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте на власній машині й просто хочете найшвидший цикл розробки. Натомість скористайтеся звичайним потоком встановлення.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція вимкнена за замовчуванням і **не** потребує запуску всього Gateway у Docker. Також доступні бекенди ізоляції SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для складання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику firewall Docker `DOCKER-USER`.

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

  <Step title="Завершіть onboarding">
    Скрипт налаштування автоматично запускає onboarding. Він:

    - попросить API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування onboarding перед стартом і записи конфігурації виконуються через
    `openclaw-gateway` напряму. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте
    натомість цей пароль.

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
додайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує мережевий простір імен `openclaw-gateway`, це
інструмент після старту. Перед `docker compose up -d openclaw-gateway` запускайте onboarding
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                     |
| ----------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального складання       |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Встановити додаткові пакунки apt під час складання (розділені пробілами) |
| `OPENCLAW_EXTENSIONS`                     | Попередньо встановити залежності Plugin під час складання (імена, розділені пробілами) |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind mounts хоста (розділені комами `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_PLUGIN_STAGE_DIR`               | Шлях контейнера для згенерованих залежностей bundled Plugin і дзеркал |
| `OPENCLAW_SANDBOX`                        | Увімкнути bootstrap ізоляції (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок onboarding (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути рекламу Bonjour/mDNS (за замовчуванням `1` для Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути накладення bind-mount для вихідного коду bundled Plugin |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільна кінцева точка колектора OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Кінцеві точки OTLP для окремих сигналів: трас, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Назва сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, коли один уже попередньо завантажений |

Maintainers можуть тестувати вихідний код bundled Plugin проти упакованого образу, змонтувавши
один каталог вихідного коду Plugin поверх його упакованого шляху вихідного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний скомпільований bundle
`/app/dist/extensions/synology-chat` для того самого Plugin id.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого колектора OTLP.
Він не потребує опублікованого порту Docker. Якщо ви збираєте образ
локально й хочете, щоб bundled експортер OpenTelemetry був доступний усередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний Docker-образ релізу OpenClaw містить вихідний код bundled
Plugin `diagnostics-otel`. Залежно від образу та стану кешу,
Gateway все ще може підготувати локальні runtime-залежності OpenTelemetry для Plugin
під час першого ввімкнення Plugin, тому дозвольте першому завантаженню дістатися до реєстру
пакунків або попередньо прогрійте образ у вашій релізній lane. Щоб увімкнути експорт, дозвольте та
ввімкніть Plugin `diagnostics-otel` у конфігурації, потім задайте
`diagnostics.otel.enabled=true` або скористайтеся прикладом конфігурації в
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації колектора
налаштовуються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
Plugin `diagnostics-prometheus`, потім виконайте scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Кінцеві точки probes контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який звертається до `/healthz`.
Якщо перевірки продовжують падати, Docker позначає контейнер як `unhealthy`, а
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий snapshot стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням задає `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював з публікацією портів Docker.

- `lan` (за замовчуванням): браузер хоста й CLI хоста можуть звертатися до опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  звертатися до Gateway напряму.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` усередині контейнера є самим контейнером,
а не вашою хост-машиною. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | Стандартна URL-адреса хоста | URL-адреса для налаштування Docker |
| --------- | --------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`     | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`    | `http://host.docker.internal:11434` |

Bundled налаштування Docker використовує ці URL-адреси хоста як стандартні значення onboarding
для LM Studio та Ollama, а `docker-compose.yml` відображає `host.docker.internal` на
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
таке саме ім’я хоста на macOS і Windows.

Сервіси хоста також мають слухати на адресі, доступній з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте таке саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Мережа Docker bridge зазвичай не пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`) надійно. Тому bundled налаштування Compose за замовчуванням задає
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у crash-loop і не перезапускав
рекламу повторно, коли bridge відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або wide-area DNS-SD для Docker-хостів.
Задавайте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де multicast mDNS гарантовано працює.

Про нюанси й усунення неполадок див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та збереження даних

Docker Compose bind-mounts `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера. Коли будь-яка зі змінних не задана, bundled
`docker-compose.yml` повертається до `${HOME}/.openclaw` (і
`${HOME}/.openclaw/workspace` для монтування workspace) або до `/tmp/.openclaw`,
коли сам `HOME` також відсутній. Це не дає `docker compose up`
створювати специфікацію тому з порожнім source у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої автентифікації провайдерів OAuth/API-key
- `.env` для runtime-секретів на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Bundled plugin runtime dependencies and mirrored runtime files are generated
state, not user config. Compose stores them in the named Docker volume
`openclaw-plugin-runtime-deps` mounted at
`/var/lib/openclaw/plugin-runtime-deps`. Keeping that high-churn tree out of the
host config bind mount avoids slow Docker Desktop/WSL file operations and stale
Windows handles during cold Gateway startup.

The default Compose file sets `OPENCLAW_PLUGIN_STAGE_DIR` to that path for both
`openclaw-gateway` and `openclaw-cli`, so `openclaw doctor --fix`, channel
login/setup commands, and Gateway startup all use the same generated runtime
volume.

For full persistence details on VM deployments, see
[Docker VM Runtime - What persists where](/uk/install/docker-vm-runtime#what-persists-where).

**Disk growth hotspots:** watch `media/`, session JSONL files, `cron/runs/*.jsonl`,
the `openclaw-plugin-runtime-deps` Docker volume, and rolling file logs under
`/tmp/openclaw/`.

### Shell helpers (optional)

For easier day-to-day Docker management, install `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

If you installed ClawDock from the older `scripts/shell-helpers/clawdock-helpers.sh` raw path, rerun the install command above so your local helper file tracks the new location.

Then use `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Run
`clawdock-help` for all commands.
See [ClawDock](/uk/install/clawdock) for the full helper guide.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Custom socket path (e.g. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    The script mounts `docker.sock` only after sandbox prerequisites pass. If
    sandbox setup cannot complete, the script resets `agents.defaults.sandbox.mode`
    to `off`.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Disable Compose pseudo-TTY allocation with `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` uses `network_mode: "service:openclaw-gateway"` so CLI
    commands can reach the gateway over `127.0.0.1`. Treat this as a shared
    trust boundary. The compose config drops `NET_RAW`/`NET_ADMIN` and enables
    `no-new-privileges` on `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions and EACCES">
    The image runs as `node` (uid 1000). If you see permission errors on
    `/home/node/.openclaw`, make sure your host bind mounts are owned by uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Faster rebuilds">
    Order your Dockerfile so dependency layers are cached. This avoids re-running
    `pnpm install` unless lockfiles change:

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

  <Accordion title="Power-user container options">
    The default image is security-first and runs as non-root `node`. For a more
    full-featured container:

    1. **Persist `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Bake system deps**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Install Playwright browsers**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persist browser downloads**: set
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` and use
       `OPENCLAW_HOME_VOLUME` or `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    If you pick OpenAI Codex OAuth in the wizard, it opens a browser URL. In
    Docker or headless setups, copy the full redirect URL you land on and paste
    it back into the wizard to finish auth.
  </Accordion>

  <Accordion title="Base image metadata">
    The main Docker runtime image uses `node:24-bookworm-slim` and publishes OCI
    base-image annotations including `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, and others. The Node base digest is
    refreshed through Dependabot Docker base-image PRs; release builds do not run
    a distro upgrade layer. See
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Running on a VPS?

See [Hetzner (Docker VPS)](/uk/install/hetzner) and
[Docker VM Runtime](/uk/install/docker-vm-runtime) for shared VM deployment steps
including binary baking, persistence, and updates.

## Agent sandbox

When `agents.defaults.sandbox` is enabled with the Docker backend, the gateway
runs agent tool execution (shell, file read/write, etc.) inside isolated Docker
containers while the gateway itself stays on the host. This gives you a hard wall
around untrusted or multi-tenant agent sessions without containerizing the entire
gateway.

Sandbox scope can be per-agent (default), per-session, or shared. Each scope
gets its own workspace mounted at `/workspace`. You can also configure
allow/deny tool policies, network isolation, resource limits, and browser
containers.

For full configuration, images, security notes, and multi-agent profiles, see:

- [Sandboxing](/uk/gateway/sandboxing) -- complete sandbox reference
- [OpenShell](/uk/gateway/openshell) -- interactive shell access to sandbox containers
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- per-agent overrides

### Quick enable

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

Build the default sandbox image:

```bash
scripts/sandbox-setup.sh
```

## Troubleshooting

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Build the sandbox image with
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    or set `agents.defaults.sandbox.docker.image` to your custom image.
    Containers are auto-created per session on demand.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Set `docker.user` to a UID:GID that matches your mounted workspace ownership,
    or chown the workspace folder.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw runs commands with `sh -lc` (login shell), which sources
    `/etc/profile` and may reset PATH. Set `docker.env.PATH` to prepend your
    custom tool paths, or add a script under `/etc/profile.d/` in your Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    The VM needs at least 2 GB RAM. Use a larger machine class and retry.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Fetch a fresh dashboard link and approve the browser device:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    More detail: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    Reset gateway mode and bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Related

- [Install Overview](/uk/install) — all installation methods
- [Podman](/uk/install/podman) — Podman alternative to Docker
- [ClawDock](/uk/install/clawdock) — Docker Compose community setup
- [Updating](/uk/install/updating) — keeping OpenClaw up to date
- [Configuration](/uk/gateway/configuration) — gateway configuration after install
