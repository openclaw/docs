---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних інсталяцій
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:40:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або потрібно перевірити Docker-потік.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище Gateway або запуск OpenClaw на хості без локальних інсталяцій.
- **Ні**: ви працюєте на власному комп’ютері й хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік інсталяції.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція вимкнена за замовчуванням і **не** вимагає запуску всього Gateway у Docker. Також доступні бекенди ізоляції SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику Docker `DOCKER-USER` для firewall.

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

  <Step title="Повторний запуск в ізольованому середовищі">
    На офлайн-хостах спочатку перенесіть і завантажте образ:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` перевіряє, що `OPENCLAW_IMAGE` вже існує локально, вимикає
    неявні Compose-завантаження й збирання, а потім виконує звичайний потік
    налаштування, зокрема синхронізацію `.env`, виправлення дозволів,
    онбординг, синхронізацію конфігурації Gateway і запуск Compose.

    Якщо `OPENCLAW_SANDBOX=1`, офлайн-налаштування також перевіряє налаштовані стандартні
    та активні для кожного агента образи ізоляції на daemon за
    `OPENCLAW_DOCKER_SOCKET`. Образи браузера з Docker-бекендом також повинні мати
    поточну мітку контракту браузера OpenClaw. Коли потрібний образ відсутній або
    несумісний, налаштування завершується без зміни конфігурації ізоляції, замість
    повідомлення про успіх з непридатною ізоляцією.

  </Step>

  <Step title="Завершіть онбординг">
    Скрипт налаштування запускає онбординг автоматично. Він:

    - запитає API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - створить каталог секретного ключа auth-profile
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед запуском і записи конфігурації виконуються
    безпосередньо через `openclaw-gateway`. `openclaw-cli` призначений для команд,
    які ви запускаєте після того, як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, натомість
    використовуйте цей пароль.

    Потрібен URL ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використовуйте контейнер CLI, щоб додати канали повідомлень:

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

Якщо ви хочете запускати кожен крок самостійно, замість використання скрипта налаштування:

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
додайте його після будь-якого стандартного override-файлу, наприклад
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
коли існують обидва override-файли.
</Note>

<Note>
Оскільки `openclaw-cli` спільно використовує мережевий namespace `openclaw-gateway`, це
інструмент після запуску. Перед `docker compose up -d openclaw-gateway` запускайте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає ці необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                           |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використати віддалений образ замість локального збирання              |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Встановити додаткові apt-пакунки під час збирання (через пробіл)      |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Встановити додаткові Python-пакунки під час збирання (через пробіл)   |
| `OPENCLAW_EXTENSIONS`                      | Попередньо встановити залежності plugin під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind mount хоста (через кому `source:target[:opts]`)        |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому томі Docker                      |
| `OPENCLAW_SANDBOX`                         | Увімкнути bootstrap ізоляції (`1`, `true`, `yes`, `on`)               |
| `OPENCLAW_SKIP_ONBOARDING`                 | Пропустити інтерактивний крок онбордингу (`1`, `true`, `yes`, `on`)   |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до Docker socket                                   |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути оголошення Bonjour/mDNS (за замовчуванням `1` для Docker)    |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlays вихідного коду bundled plugin            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільний endpoint OTLP/HTTP collector для експорту OpenTelemetry      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Специфічні для сигналів endpoint OTLP для traces, metrics або logs    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Сьогодні підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Назва сервісу, що використовується для ресурсів OpenTelemetry         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути найновіші експериментальні семантичні атрибути GenAI        |
| `OPENCLAW_OTEL_PRELOADED`                  | Пропустити запуск другого OpenTelemetry SDK, коли один уже попередньо завантажений |

Офіційний Docker-образ не постачається з Homebrew. Під час онбордингу OpenClaw
приховує інсталятори залежностей Skills, доступні лише через brew, коли працює в Linux
контейнері без `brew`; ці залежності має надати власний образ або їх потрібно
встановити вручну. Для залежностей, доступних з Debian-пакунків, використовуйте
`OPENCLAW_IMAGE_APT_PACKAGES` під час збирання образу. Застаріла назва
`OPENCLAW_DOCKER_APT_PACKAGES` все ще приймається.
Для Python-залежностей використовуйте `OPENCLAW_IMAGE_PIP_PACKAGES`. Це запускає
`python3 -m pip install --break-system-packages` під час збирання образу, тому фіксуйте
версії пакунків і використовуйте лише ті індекси пакунків, яким довіряєте.

Мейнтейнери можуть тестувати вихідний код bundled plugin проти packaged-образу,
монтувавши один каталог вихідного коду plugin поверх його packaged-шляху вихідного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого plugin id.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого OTLP
collector. Він не потребує опублікованого Docker-порту. Якщо ви збираєте образ
локально й хочете, щоб bundled exporter OpenTelemetry був доступний усередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Встановіть офіційний Plugin `@openclaw/diagnostics-otel` з ClawHub у
packaged Docker-інсталяціях перед увімкненням експорту. Власні образи, зібрані з вихідного коду,
все ще можуть включати локальний вихідний код plugin з
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте й увімкніть
Plugin `diagnostics-otel` у конфігурації, а потім встановіть
`diagnostics.otel.enabled=true` або використайте приклад конфігурації в [Експорт
OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації collector налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Встановіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть Plugin
`diagnostics-prometheus`, а потім збирайте:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки стану

Endpoint-и container probe (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки й надалі не проходять, Docker позначає контейнер як `unhealthy`, а
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ з хоста до
`http://127.0.0.1:18789` працював з публікацією портів Docker.

- `lan` (за замовчуванням): браузер хоста й CLI хоста можуть дістатися опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого namespace контейнера можуть напряму дістатися
  Gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста, як-от `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` усередині контейнера — це сам контейнер,
а не ваша хост-машина. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | Стандартний URL хоста     | URL для налаштування Docker          |
| --------- | ------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434`  |

Bundled Docker-налаштування використовує ці URL хоста як стандартні значення
онбордингу LM Studio та Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` з
host gateway Docker для Linux Docker Engine. Docker Desktop уже надає
таке саме ім’я хоста на macOS і Windows.

Служби хоста також повинні слухати на адресі, доступній з Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте те саме
зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Бекенд Claude CLI у Docker

Офіційний Docker-образ OpenClaw не встановлює Claude Code заздалегідь. Установіть
Claude Code і ввійдіть у нього всередині користувача контейнера, який запускає OpenClaw, а потім збережіть
домашній каталог цього контейнера, щоб оновлення образу не стерли бінарний файл або стан
автентифікації Claude.

Для нових інсталяцій Docker увімкніть постійний том `/home/node` перед запуском
налаштування:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Для наявної інсталяції Docker спершу зупиніть стек і перезавантажте поточні
значення Docker `.env` перед повторним запуском налаштування. Скрипт налаштування не читає
`.env` самостійно; він перезаписує `.env` із поточної оболонки та стандартних значень. Для
згенерованого `.env` виконайте:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Якщо ваш `.env` містить значення, які ваша оболонка не може зчитати як джерело, вручну повторно експортуйте
наявні значення, на які ви покладаєтеся, наприклад `OPENCLAW_IMAGE`, порти, режим прив’язки,
власні шляхи, `OPENCLAW_EXTRA_MOUNTS`, sandbox і параметри пропуску onboarding.
Згенероване накладання монтує домашній том для `openclaw-gateway` і
`openclaw-cli`.

Виконуйте решту команд зі згенерованим накладанням Compose, щоб обидва сервіси
монтували збережений домашній каталог. Якщо ваше налаштування також використовує `docker-compose.override.yml`,
додайте його перед `docker-compose.extra.yml`.

Установіть Claude Code у цей збережений домашній каталог:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Нативний інсталятор записує бінарний файл `claude` у
`/home/node/.local/bin/claude`. Вкажіть OpenClaw використовувати цей шлях контейнера:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Увійдіть і перевірте зсередини того самого збереженого домашнього каталогу контейнера:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Після цього можна використовувати вбудований бекенд `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` зберігає нативну інсталяцію Claude Code у
`/home/node/.local/bin` і `/home/node/.local/share/claude`, а також налаштування
Claude Code і стан автентифікації у `/home/node/.claude` та `/home/node/.claude.json`.
Зберігати лише `/home/node/.openclaw` недостатньо для повторного використання Claude CLI. Якщо
ви використовуєте `OPENCLAW_EXTRA_MOUNTS` замість домашнього тому, змонтуйте всі ці
шляхи Claude в обидва сервіси Docker.

<Note>
Для спільної виробничої автоматизації або передбачуваного білінгу Anthropic віддавайте перевагу
шляху з API-ключем Anthropic. Повторне використання Claude CLI залежить від установленої
версії Claude Code, входу в обліковий запис, білінгу та поведінки оновлень.
</Note>

### Bonjour / mDNS

Мережа Docker bridge зазвичай не пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`) надійно. Тому вбудоване налаштування Compose за замовчуванням задає
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл аварійних перезапусків або не намагався
повторно рекламуватися, коли bridge відкидає multicast-трафік.

Використовуйте опубліковану URL-адресу Gateway, Tailscale або широкозонний DNS-SD для Docker-хостів.
Задавайте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де multicast mDNS гарантовано працює.

Підводні камені та усунення несправностей дивіться в [виявленні Bonjour](/uk/gateway/bonjour).

### Сховище та збереження

Docker Compose прив’язує `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, а
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` до `/home/node/.config/openclaw`, тому ці
шляхи зберігаються після заміни контейнера. Коли будь-яку змінну не задано, вбудований
`docker-compose.yml` відступає до `${HOME}`, або до `/tmp`, якщо сам `HOME` також
відсутній. Це не дає `docker compose up` виводити специфікацію тому з порожнім джерелом
у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key-автентифікації провайдера
- `.env` для runtime-секретів на основі змінних середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Каталог секретного ключа auth-profile зберігає локальний ключ шифрування, який використовується для
матеріалу токенів профілю автентифікації на основі OAuth. Тримайте його разом зі станом вашого Docker-хоста,
але окремо від `OPENCLAW_CONFIG_DIR`.

Установлені завантажувані plugins зберігають стан своїх пакетів у змонтованому
домашньому каталозі OpenClaw, тому записи встановлення plugin і корені пакетів зберігаються після
заміни контейнера. Запуск Gateway не генерує дерева залежностей вбудованих plugin.

Повні відомості про збереження для розгортань VM дивіться в
[Docker VM Runtime - що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

  **Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій, спільною
  базою даних стану SQLite, коренями пакетів установлених Plugin і циклічними файловими журналами
  у `/tmp/openclaw/`.

  ### Допоміжні shell-скрипти (необов’язково)

  Для простішого щоденного керування Docker установіть `ClawDock`:

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний допоміжний файл відстежував нове розташування.

  Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
  `clawdock-help`, щоб переглянути всі команди.
  Повний посібник із допоміжних скриптів див. у [ClawDock](/uk/install/clawdock).

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

    Скрипт монтує `docker.sock` лише після успішного проходження передумов пісочниці. Якщо
    налаштування пісочниці не вдається завершити, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`. Ходи Codex code-mode усе ще обмежені Codex
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
    могли досягати Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` і для `openclaw-gateway`, і для `openclaw-cli`.
  </Accordion>

  <Accordion title="Збої DNS у Docker Desktop в openclaw-cli">
    У деяких налаштуваннях Docker Desktop DNS-запити зі спільномережевого
    сайдкара `openclaw-cli` не працюють після вилучення `NET_RAW`, що проявляється як
    `EAI_AGAIN` під час команд на базі npm, таких як `openclaw plugins install`.
    Для звичайної роботи Gateway залишайте типовий посилений compose-файл. Наведене
    нижче локальне перевизначення послаблює безпекову позицію CLI-контейнера,
    відновлюючи типові можливості Docker, тому використовуйте його лише для одноразової CLI-команди,
    якій потрібен доступ до реєстру пакетів, а не як типовий виклик Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Якщо ви вже створили довготривалий контейнер `openclaw-cli`, створіть його заново
    з тим самим перевизначенням. `docker compose exec` і `docker exec` не можуть
    змінити можливості Linux для вже створеного контейнера.

  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind mount на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Така сама невідповідність може проявитися як попередження Plugin, наприклад
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    із подальшим `plugin present but blocked`. Це означає, що uid процесу та власник
    змонтованого каталогу Plugin не збігаються. Надавайте перевагу запуску контейнера з
    типовим uid 1000 і виправленню власника bind mount. Виконуйте chown
    `/path/to/openclaw-config/npm` до `root:root` лише якщо ви навмисно запускаєте
    OpenClaw як root у довгостроковій перспективі.

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу уникнути повторного запуску
    `pnpm install`, якщо lockfile не змінюються:

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
    Типовий образ насамперед орієнтований на безпеку й запускається як непривілейований `node`. Для
    функціональнішого контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Вбудуйте залежності Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Вбудуйте Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Або встановіть браузери Playwright у збережений том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Зберігайте завантаження браузера**: використовуйте `OPENCLAW_HOME_VOLUME` або
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw автоматично виявляє керований Playwright
       Chromium з Docker-образу в Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL браузера. У
    Docker або headless-середовищах скопіюйте повний URL перенаправлення, на який ви потрапили, і вставте
    його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний образ runtime Docker використовує `node:24-bookworm-slim` і містить `tini` як процес ініціалізації entrypoint (PID 1), щоб гарантувати прибирання zombie-процесів і коректну обробку сигналів у довготривалих контейнерах. Він публікує анотації базового образу OCI, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового образу Node
    оновлюється через PR Dependabot для базових образів Docker; release-збірки не запускають
    шар оновлення дистрибутива. Див.
    [анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) щодо кроків розгортання на спільній VM,
зокрема вбудовування binary, persistence та оновлень.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) всередині ізольованих контейнерів Docker,
а сам Gateway залишається на хості. Це дає вам жорстку межу
навколо ненадійних або multi-tenant сесій агентів без контейнеризації всього
Gateway.

Область пісочниці може бути для кожного агента (типово), для кожної сесії або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики allow/deny для інструментів, ізоляцію мережі, ліміти ресурсів і браузерні
контейнери.

Повну конфігурацію, образи, примітки з безпеки та профілі для кількох агентів дивіться тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник пісочниці
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

Зберіть типовий образ пісочниці (із source checkout):

```bash
scripts/sandbox-setup.sh
```

Для встановлень npm без source checkout див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо inline-команд `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) або inline-команди `docker build` з [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (встановлення npm),
    або задайте для `agents.defaults.sandbox.docker.image` ваш власний образ.
    Контейнери автоматично створюються для кожної сесії на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Задайте `docker.user` як UID:GID, що відповідає власнику змонтованого workspace,
    або виконайте chown для папки workspace.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (login shell), який читає
    `/etc/profile` і може скинути PATH. Задайте `docker.env.PATH`, щоб додати
    шляхи до власних інструментів на початок, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed під час збирання образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="У Control UI потрібна авторизація або pairing">
    Отримайте свіже посилання на dashboard і схваліть браузерний пристрій:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки pairing з Docker CLI">
    Скиньте режим і bind Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі методи встановлення
- [Podman](/uk/install/podman) — альтернатива Podman для Docker
- [ClawDock](/uk/install/clawdock) — community-налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
