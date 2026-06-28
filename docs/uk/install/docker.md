---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних інсталяцій
    - Ви перевіряєте Docker-процес
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:44:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований gateway або перевірка Docker-процесу.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване одноразове середовище gateway або запуск OpenClaw на хості без локальних інсталяцій.
- **Ні**: ви працюєте на власному комп’ютері й хочете найшвидший цикл розробки. Натомість використовуйте звичайний процес інсталяції.
- **Примітка щодо ізоляції**: стандартний бекенд ізоляції використовує Docker, коли ізоляцію ввімкнено, але ізоляція за замовчуванням вимкнена й **не** вимагає запуску всього gateway у Docker. Також доступні бекенди ізоляції SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах з 1 ГБ із кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику firewall Docker `DOCKER-USER`.

## Контейнеризований gateway

<Steps>
  <Step title="Зберіть образ">
    З кореня репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи спочатку публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR є основним реєстром для автоматизації релізів, закріплених розгортань
    і перевірок походження. Той самий релізний workflow також публікує офіційне
    дзеркало Docker Hub за адресою `openclaw/openclaw` для хостів, які віддають перевагу Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Використовуйте `ghcr.io/openclaw/openclaw` або `openclaw/openclaw`. Уникайте спільнотних
    дзеркал Docker Hub, оскільки OpenClaw не контролює їхній розклад релізів,
    перезбирання або політику зберігання. Поширені офіційні теги: `main`, `latest`,
    `<version>` (наприклад, `2026.2.26`) і бета-версії, як-от
    `2026.2.26-beta.1`. Бета-теги не пересувають `latest` або `main`.

  </Step>

  <Step title="Повторний запуск без інтернету">
    На офлайн-хостах спочатку перенесіть і завантажте образ:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` перевіряє, що `OPENCLAW_IMAGE` уже існує локально, вимикає
    неявні завантаження Compose і збирання, а потім запускає звичайний процес налаштування, зокрема
    синхронізацію `.env`, виправлення дозволів, onboarding, синхронізацію конфігурації gateway
    і запуск Compose.

    Якщо `OPENCLAW_SANDBOX=1`, офлайн-налаштування також перевіряє налаштовані стандартні
    та активні образи ізоляції для кожного агента на daemon за
    `OPENCLAW_DOCKER_SOCKET`. Docker-образи браузера також мають містити
    поточну мітку контракту браузера OpenClaw. Коли потрібний образ відсутній або
    несумісний, налаштування завершується без зміни конфігурації ізоляції замість
    повідомлення про успіх із непридатною до використання ізоляцією.

  </Step>

  <Step title="Завершіть onboarding">
    Скрипт налаштування автоматично запускає onboarding. Він:

    - запросить API-ключі провайдера
    - згенерує токен gateway і запише його в `.env`
    - створить каталог секретного ключа auth-profile
    - запустить gateway через Docker Compose

    Під час налаштування onboarding перед запуском і записи конфігурації виконуються через
    `openclaw-gateway` напряму. `openclaw-cli` призначений для команд, які ви запускаєте після того,
    як контейнер gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`;
    якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість цей
    пароль.

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

### Ручний процес

Якщо ви волієте запускати кожен крок самостійно замість використання скрипта налаштування:

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
інструмент після запуску. Перед `docker compose up -d openclaw-gateway` запускайте onboarding
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Змінна                                    | Призначення                                                          |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Використати віддалений образ замість локального збирання             |
| `OPENCLAW_IMAGE_APT_PACKAGES`             | Установити додаткові apt-пакети під час збирання (розділені пробілами) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`             | Установити додаткові Python-пакети під час збирання (розділені пробілами) |
| `OPENCLAW_EXTENSIONS`                     | Попередньо встановити залежності plugin під час збирання (імена, розділені пробілами) |
| `OPENCLAW_EXTRA_MOUNTS`                   | Додаткові bind mount хоста (розділені комами `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Зберігати `/home/node` в іменованому Docker volume                   |
| `OPENCLAW_SANDBOX`                        | Увімкнути bootstrap ізоляції (`1`, `true`, `yes`, `on`)              |
| `OPENCLAW_SKIP_ONBOARDING`                | Пропустити інтерактивний крок onboarding (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                  | Перевизначити шлях до Docker socket                                  |
| `OPENCLAW_DISABLE_BONJOUR`                | Вимкнути рекламу Bonjour/mDNS (для Docker за замовчуванням `1`)      |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlay вихідного коду bundled plugin            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Спільний endpoint збирача OTLP/HTTP для експорту OpenTelemetry       |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Специфічні для сигналів OTLP endpoint для трасувань, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Перевизначення протоколу OTLP. Сьогодні підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Ім’я сервісу, що використовується для ресурсів OpenTelemetry         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Увімкнути найновіші експериментальні семантичні атрибути GenAI       |
| `OPENCLAW_OTEL_PRELOADED`                 | Пропустити запуск другого OpenTelemetry SDK, якщо один уже попередньо завантажений |

Офіційний Docker-образ не постачається з Homebrew. Під час onboarding OpenClaw
приховує інсталятори залежностей skill, доступні лише для brew, коли працює в Linux-контейнері
без `brew`; ці залежності мають бути надані кастомним образом
або встановлені вручну. Для залежностей, доступних із Debian-пакетів, використовуйте
`OPENCLAW_IMAGE_APT_PACKAGES` під час збирання образу. Застаріла
назва `OPENCLAW_DOCKER_APT_PACKAGES` усе ще приймається.
Для Python-залежностей використовуйте `OPENCLAW_IMAGE_PIP_PACKAGES`. Це запускає
`python3 -m pip install --break-system-packages` під час збирання образу, тому закріплюйте
версії пакетів і використовуйте лише індекси пакетів, яким довіряєте.

Maintainers можуть тестувати вихідний код bundled plugin проти packaged image, монтувавши
один каталог вихідного коду plugin поверх його packaged source path, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог вихідного коду перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого plugin id.

### Спостережуваність

Експорт OpenTelemetry є вихідним із контейнера Gateway до вашого OTLP
collector. Він не потребує опублікованого Docker-порту. Якщо ви збираєте образ
локально й хочете, щоб bundled exporter OpenTelemetry був доступний усередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Установіть офіційний plugin `@openclaw/diagnostics-otel` з ClawHub у
packaged Docker install перед увімкненням експорту. Кастомні образи, зібрані з вихідного коду, можуть
і далі включати локальний вихідний код plugin за допомогою
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Щоб увімкнути експорт, дозвольте та ввімкніть
plugin `diagnostics-otel` у конфігурації, а потім задайте
`diagnostics.otel.enabled=true` або скористайтеся прикладом конфігурації в [Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації collector налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Установіть
`clawhub:@openclaw/diagnostics-prometheus`, увімкніть
plugin `diagnostics-prometheus`, а потім виконуйте scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse-proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки справності

Endpoint проб контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який ping-ує `/healthz`.
Якщо перевірки й далі не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок справності:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням задає `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ з хоста до
`http://127.0.0.1:18789` працював із публікацією Docker-порту.

- `lan` (за замовчуванням): браузер хоста й CLI хоста можуть дістатися опублікованого порту gateway.
- `loopback`: лише процеси всередині мережевого namespace контейнера можуть напряму дістатися
  gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста, як-от `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Коли OpenClaw працює в Docker, `127.0.0.1` усередині контейнера — це сам контейнер,
а не ваша хостова машина. Використовуйте `host.docker.internal` для AI-провайдерів, які
працюють на хості:

| Провайдер | Типова URL-адреса хоста | URL-адреса налаштування Docker      |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Вбудоване налаштування Docker використовує ці URL-адреси хоста як типові значення
онбордингу для LM Studio та Ollama, а `docker-compose.yml` зіставляє
`host.docker.internal` із host gateway Docker для Linux Docker Engine. Docker Desktop
уже надає таке саме ім'я хоста на macOS і Windows.

Служби хоста також мають слухати на адресі, доступній із Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Якщо ви використовуєте власний файл Compose або команду `docker run`, додайте
таке саме зіставлення хоста самостійно, наприклад
`--add-host=host.docker.internal:host-gateway`.

### Бекенд Claude CLI у Docker

Офіційний Docker-образ OpenClaw не встановлює Claude Code заздалегідь. Установіть
і ввійдіть у Claude Code всередині користувача контейнера, який запускає OpenClaw,
а потім збережіть домашній каталог цього контейнера, щоб оновлення образу не
стерли бінарний файл або стан автентифікації Claude.

Для нових установлень Docker увімкніть сталий том `/home/node` перед запуском
налаштування:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Для наявного встановлення Docker спочатку зупиніть стек і перезавантажте поточні
значення Docker `.env` перед повторним запуском налаштування. Скрипт налаштування
сам не читає `.env`; він переписує `.env` із поточної оболонки та типових значень.
Для згенерованого `.env` виконайте:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Якщо ваш `.env` містить значення, які ваша оболонка не може завантажити як source,
спочатку вручну повторно експортуйте наявні значення, на які ви покладаєтеся, як-от
`OPENCLAW_IMAGE`, порти, режим прив'язки, власні шляхи, `OPENCLAW_EXTRA_MOUNTS`,
пісочницю та параметри пропуску онбордингу. Згенероване накладання монтує домашній
том як для `openclaw-gateway`, так і для `openclaw-cli`.

Запускайте решту команд зі згенерованим накладанням Compose, щоб обидві служби
монтували збережений домашній каталог. Якщо ваше налаштування також використовує
`docker-compose.override.yml`, додайте його перед `docker-compose.extra.yml`.

Установіть Claude Code у цей збережений домашній каталог:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Нативний інсталятор записує бінарний файл `claude` у
`/home/node/.local/bin/claude`. Вкажіть OpenClaw використовувати цей шлях у
контейнері:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Увійдіть і перевірте зсередини того самого збереженого домашнього каталогу
контейнера:

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

`OPENCLAW_HOME_VOLUME` зберігає нативне встановлення Claude Code у
`/home/node/.local/bin` і `/home/node/.local/share/claude`, а також налаштування
Claude Code і стан автентифікації у `/home/node/.claude` та
`/home/node/.claude.json`. Збереження лише `/home/node/.openclaw` недостатньо для
повторного використання Claude CLI. Якщо ви використовуєте `OPENCLAW_EXTRA_MOUNTS`
замість домашнього тому, змонтуйте всі ці шляхи Claude в обидві служби Docker.

<Note>
Для спільної виробничої автоматизації або передбачуваного білінгу Anthropic
надавайте перевагу шляху з API-ключем Anthropic. Повторне використання Claude CLI
залежить від установленої версії Claude Code, входу в обліковий запис, білінгу та
поведінки оновлень.
</Note>

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає multicast Bonjour/mDNS
(`224.0.0.251:5353`). Тому вбудоване налаштування Compose типово задає
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл аварійного
перезапуску й не перезапускав рекламу повторно, коли bridge відкидає multicast
трафік.

Для Docker-хостів використовуйте опубліковану URL-адресу Gateway, Tailscale або
wide-area DNS-SD. Задавайте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з
host networking, macvlan або іншою мережею, де multicast mDNS гарантовано працює.

Підводні камені та усунення несправностей див. у [виявленні Bonjour](/uk/gateway/bonjour).

### Сховище та сталість

Docker Compose bind-монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace` і
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` у `/home/node/.config/openclaw`, тож ці шляхи
зберігаються після заміни контейнера. Коли будь-яка змінна не задана, вбудований
`docker-compose.yml` використовує резервний шлях під `${HOME}` або `/tmp`, якщо
сам `HOME` також відсутній. Це запобігає виведенню `docker compose up` специфікації
тому з порожнім джерелом у мінімальних середовищах.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої автентифікації провайдерів OAuth/API-ключами
- `.env` для runtime-секретів на основі змінних середовища, як-от `OPENCLAW_GATEWAY_TOKEN`

Каталог секретного ключа профілю автентифікації зберігає локальний ключ шифрування,
який використовується для матеріалу токенів профілю автентифікації на основі OAuth.
Тримайте його разом зі станом вашого Docker-хоста, але окремо від
`OPENCLAW_CONFIG_DIR`.

Установлені завантажувані плагіни зберігають свій пакетний стан у змонтованому
домашньому каталозі OpenClaw, тому записи встановлення плагінів і корені пакетів
зберігаються після заміни контейнера. Запуск Gateway не генерує дерева залежностей
вбудованих плагінів.

Повні відомості про сталість у розгортаннях VM див.
[Docker VM Runtime - що де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сеансів,
спільною базою даних стану SQLite, коренями пакетів установлених плагінів і
циклічними файловими журналами в `/tmp/openclaw/`.

### Допоміжні засоби оболонки (необов'язково)

Для простішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний допоміжний файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо.
Виконайте `clawdock-help`, щоб переглянути всі команди.
Повний посібник із допоміжних засобів див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
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

    Скрипт монтує `docker.sock` лише після успішної перевірки передумов пісочниці.
    Якщо налаштування пісочниці не може завершитися, скрипт скидає
    `agents.defaults.sandbox.mode` на `off`. Повороти Codex code-mode все одно
    обмежені Codex `workspace-write`, доки пісочниця OpenClaw активна; не монтуйте
    Docker socket хоста в контейнери пісочниці агента.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Вимкніть виділення псевдо-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб
    команди CLI могли діставатися до шлюзу через `127.0.0.1`. Розглядайте це як
    спільну межу довіри. Конфігурація compose відкидає `NET_RAW`/`NET_ADMIN` і
    вмикає `no-new-privileges` як для `openclaw-gateway`, так і для `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    Деякі налаштування Docker Desktop не можуть виконувати DNS-пошуки зі sidecar
    `openclaw-cli` у спільній мережі після відкидання `NET_RAW`, що проявляється
    як `EAI_AGAIN` під час команд на основі npm, як-от `openclaw plugins install`.
    Залишайте типовий посилений файл compose для звичайної роботи Gateway. Локальне
    перевизначення нижче послаблює захисну позицію контейнера CLI, відновлюючи
    типові capabilities Docker, тому використовуйте його лише для одноразової
    команди CLI, якій потрібен доступ до реєстру пакетів, а не як типовий виклик
    Compose:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Якщо ви вже створили довготривалий контейнер `openclaw-cli`, створіть його
    повторно з тим самим перевизначенням. `docker compose exec` і `docker exec` не
    можуть змінити Linux capabilities для вже створеного контейнера.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind mounts на хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Та сама невідповідність може проявитися як попередження плагіна, наприклад
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    з подальшим `plugin present but blocked`. Це означає, що uid процесу та
    власник змонтованого каталогу плагіна не збігаються. Надавайте перевагу запуску
    контейнера з типовим uid 1000 і виправленню власника bind mount. Виконуйте chown
    `/path/to/openclaw-config/npm` на `root:root` лише якщо ви навмисно запускаєте
    OpenClaw як root довгостроково.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу не
    запускати `pnpm install` повторно, якщо lock-файли не змінилися:

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
    Типовий образ орієнтований насамперед на безпеку й запускається як non-root
    `node`. Для більш повнофункціонального контейнера:

    1. **Збережіть `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Вбудуйте залежності Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Вбудуйте Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Або встановіть браузери Playwright у збережений том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Збережіть завантаження браузера**: використовуйте `OPENCLAW_HOME_VOLUME` або
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw автоматично виявляє керований Playwright
       Chromium з Docker-образу в Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо ви виберете OpenAI Codex OAuth у майстрі, він відкриє URL браузера. У
    Docker або середовищах без графічного інтерфейсу скопіюйте повний URL перенаправлення,
    на який ви потрапили, і вставте його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Base image metadata">
    Основний Docker-образ середовища виконання використовує `node:24-bookworm-slim` і містить `tini` як процес ініціалізації точки входу (PID 1), щоб гарантувати прибирання зомбі-процесів і коректне оброблення сигналів у довготривалих контейнерах. Він публікує анотації базового образу OCI, зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Дайджест базового образу Node
    оновлюється через PR Dependabot для базових Docker-образів; релізні збірки не запускають
    шар оновлення дистрибутива. Див.
    [анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для спільних кроків розгортання на VM,
зокрема вбудовування бінарних файлів, збереження даних і оновлення.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено з бекендом Docker, Gateway
запускає виконання інструментів агента (оболонка, читання/запис файлів тощо) всередині ізольованих Docker-контейнерів,
тоді як сам Gateway залишається на хості. Це дає вам жорстку межу
навколо недовірених або багатоорендних сеансів агентів без контейнеризації всього
Gateway.

Область дії пісочниці може бути на рівні агента (типово), сеансу або спільною. Кожна область
отримує власний робочий простір, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і
контейнери браузера.

Повну конфігурацію, образи, примітки з безпеки та профілі для кількох агентів див. тут:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник із пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ оболонки до контейнерів пісочниці
- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення на рівні агента

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

Зберіть типовий образ пісочниці (з checkout вихідного коду):

```bash
scripts/sandbox-setup.sh
```

Для встановлень npm без checkout вихідного коду див. [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) щодо вбудованих команд `docker build`.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Зберіть образ пісочниці за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout вихідного коду) або вбудованої команди `docker build` з [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (встановлення npm),
    або задайте `agents.defaults.sandbox.docker.image` на ваш власний образ.
    Контейнери автоматично створюються для кожного сеансу на вимогу.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Установіть `docker.user` на UID:GID, що відповідає власнику вашого змонтованого робочого простору,
    або змініть власника папки робочого простору через chown.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), що зчитує
    `/etc/profile` і може скидати PATH. Установіть `docker.env.PATH`, щоб додати на початок ваші
    шляхи до власних інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Отримайте свіже посилання на панель керування й підтвердьте пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Панель керування](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    Скиньте режим Gateway і прив’язку:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація Gateway після встановлення
