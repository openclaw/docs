---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних інсталяцій
    - Ви перевіряєте роботу Docker-процесу
summary: Необов’язкове налаштування та початкове налаштування OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-07-16T18:01:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker — **необов’язковий**. Використовуйте його для ізольованого, тимчасового середовища Gateway або на хості без локально встановлених компонентів. Якщо розробка вже ведеться на власному комп’ютері, натомість використовуйте звичайний процес установлення.

Стандартний бекенд пісочниці використовує Docker, коли ввімкнено `agents.defaults.sandbox`, але пісочницю стандартно вимкнено, і для неї не потрібно, щоб сам Gateway працював у Docker. Також доступні бекенди пісочниці SSH і OpenShell; див. [Пісочниця](/uk/gateway/sandboxing).

Розміщуєте кількох користувачів? Модель з однією коміркою на кожного орендаря описано в розділі [Багатоорендне розміщення](/uk/gateway/multi-tenant-hosting).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ оперативної пам’яті для збирання образу (`pnpm install` може бути завершено через нестачу пам’яті на хостах із 1 ГБ із кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- На VPS або загальнодоступному хості ознайомтеся з розділом [Посилення безпеки в разі доступності через мережу](/uk/gateway/security), особливо з ланцюжком брандмауера Docker `DOCKER-USER`

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    З кореня репозиторію:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ця команда локально збирає образ Gateway як `openclaw:local`. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи спочатку публікуються в [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR — основний реєстр для автоматизації випусків, розгортань із закріпленими версіями та перевірок походження. Той самий випуск публікує дзеркало Docker Hub у `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Використовуйте `ghcr.io/openclaw/openclaw` або `openclaw/openclaw` та уникайте неофіційних дзеркал, які не дотримуються графіка випусків або політики зберігання OpenClaw. Офіційні теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`), а також бета-теги на кшталт `2026.2.26-beta.1` (бета-версії ніколи не переміщують `latest`/`main`). Стандартний образ `main`/`latest`/`<version>` містить plugins `codex` і `diagnostics-otel`. Варіант `-browser` (наприклад, `latest-browser`) також постачається із вбудованим Chromium, що зручно для інструмента [браузера в пісочниці](/uk/gateway/sandboxing#sandboxed-browser) без установлення Playwright під час першого запуску.

  </Step>

  <Step title="Повторний запуск без доступу до мережі">
    На хостах без доступу до мережі спочатку перенесіть і завантажте образ:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` перевіряє, що `OPENCLAW_IMAGE` уже існує локально, вимикає неявне завантаження та збирання через Compose, а потім виконує звичайний процес: синхронізацію `.env`, виправлення дозволів, початкове налаштування, синхронізацію конфігурації Gateway і запуск Compose.

    Якщо `OPENCLAW_SANDBOX=1`, автономне налаштування також перевіряє налаштовані стандартні й окремі для кожного агента образи пісочниці в демоні за `OPENCLAW_DOCKER_SOCKET`, зокрема мітку контракту браузера на образах браузера на основі Docker. Якщо потрібний образ відсутній або застарілий, налаштування завершується без зміни конфігурації пісочниці, замість того щоб помилково повідомляти про успіх.

  </Step>

  <Step title="Завершіть початкове налаштування">
    Скрипт налаштування автоматично виконує початкове налаштування:

    - запитує API-ключі постачальника
    - генерує токен Gateway і записує його до `.env`
    - створює каталог секретного ключа профілю автентифікації
    - запускає Gateway через Docker Compose

    Початкове налаштування та запис конфігурації перед запуском виконуються безпосередньо через `openclaw-gateway` (з `--no-deps --entrypoint node`), оскільки `openclaw-cli` використовує спільний із Gateway простір імен мережі та працює лише після створення контейнера Gateway.

  </Step>

  <Step title="Відкрийте інтерфейс керування">
    Відкрийте `http://127.0.0.1:18789/` і вставте токен, записаний до `.env`, у Settings. Якщо контейнер переведено на автентифікацію за паролем, натомість використовуйте цей пароль.

    Знову потрібна URL-адреса?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Контекст Docker виключає `.git`. Передайте ідентифікатор вихідного коду як аргументи збирання,
як показано вище, щоб на екрані «Про програму» образу відображалися коміт із поточної робочої копії та
одна часова позначка збирання. `scripts/docker/setup.sh` визначає та передає обидва значення
автоматично.

<Note>
Запускайте `docker compose` з кореня репозиторію. Якщо ввімкнено `OPENCLAW_EXTRA_MOUNTS` або `OPENCLAW_HOME_VOLUME`, скрипт налаштування записує `docker-compose.extra.yml`; додайте його після будь-якого `docker-compose.override.yml`, який підтримується самостійно, наприклад `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Оновлення образів контейнерів

Коли образ OpenClaw замінюється, але зберігається той самий змонтований стан і конфігурація,
новий Gateway перед переходом у стан готовності виконує безпечні для запуску міграції оновлення та узгодження
plugins. Для звичайного оновлення образу не має бути потрібен окремий
прохід `openclaw doctor --fix`.

Якщо під час запуску ці виправлення неможливо безпечно завершити, Gateway завершує роботу, а не
повідомляє про справний стан. За наявності політики перезапуску Docker, Podman або Kubernetes може показувати,
що контейнер Gateway перезапускається. Збережіть змонтований том стану, а потім один раз запустіть
той самий образ із `openclaw doctor --fix` як командою контейнера, використовуючи
ті самі монтування стану й конфігурації, що й Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Після завершення роботи doctor перезапустіть контейнер Gateway зі стандартною командою.
У Kubernetes виконайте ту саму команду в одноразовому Job або налагоджувальному pod, змонтованому до того
самого PVC, а потім перезапустіть Deployment або StatefulSet.

### Змінні середовища

Необов’язкові змінні, які приймає `scripts/docker/setup.sh` (а для контейнера Gateway — безпосередньо `docker-compose.yml`):

| Змінна                                        | Призначення                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Використовувати віддалений образ замість локального збирання                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Установити додаткові пакунки apt під час збирання (розділені пробілами). Застарілий псевдонім: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Установити додаткові пакунки Python під час збирання (розділені пробілами)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Скомпілювати/запакувати вибрані підтримувані plugins та встановити їхні залежності середовища виконання (ідентифікатори, розділені комами або пробілами) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Перевизначити параметри Node для локального збирання з вихідного коду (стандартно `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Перевизначити розмір купи tsdown для локального збирання з вихідного коду в МБ                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Пропустити виведення декларацій під час локального збирання образів лише для середовища виконання (стандартно `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Вбудувати Chromium + Xvfb в образ під час збирання                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Додаткові прив’язувальні монтування хоста (розділені комами `source:target[:opts]`)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | Зберігати `/home/node` в іменованому томі Docker                                                                     |
| `OPENCLAW_SANDBOX`                              | Увімкнути початкове налаштування пісочниці (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Пропустити інтерактивний етап початкового налаштування (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Перевизначити шлях до сокета Docker                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Примусово ввімкнути (`0`) або вимкнути (`1`) оголошення Bonjour/mDNS; див. [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Вимкнути накладні прив’язувальні монтування вихідного коду вбудованих plugins                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Спільна кінцева точка збирача OTLP/HTTP для експорту OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Окремі кінцеві точки OTLP для трасувань, метрик або журналів                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf`                                                   |
| `OTEL_SERVICE_NAME`                             | Назва служби, яка використовується для ресурсів OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Увімкнути найновіші експериментальні семантичні атрибути GenAI                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Не запускати другий SDK OpenTelemetry, якщо один уже попередньо завантажено                                                    |

Офіційний образ постачається без Homebrew. Під час початкового налаштування OpenClaw приховує інсталятори залежностей Skills, доступні лише через brew, у контейнері Linux без `brew`; додайте ці залежності через власний образ або встановіть вручну. Використовуйте `OPENCLAW_IMAGE_APT_PACKAGES` для залежностей із пакунків Debian і `OPENCLAW_IMAGE_PIP_PACKAGES` для залежностей Python (під час збирання запускається `python3 -m pip install --break-system-packages`, тому закріплюйте версії та використовуйте лише довірені індекси).

Якщо Docker повідомляє `ResourceExhausted`, `cannot allocate memory` або перериває роботу під час `tsdown`, збільште обмеження пам’яті збирача Docker або повторіть спробу з меншими явно заданими розмірами купи:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Образи, зібрані з вихідного коду, з вибраними plugins

`OPENCLAW_EXTENSIONS` вибирає ідентифікатори маніфестів плагінів із вихідного дерева;
також приймаються наявні назви каталогів із вихідним кодом, якщо вони відрізняються. Під час
збирання Docker вибрані значення один раз зіставляються з каталогами вихідного коду,
встановлюються робочі залежності, а коли вибраний плагін публікується окремо з
`openclaw.build.bundledDist: false`, його середовище виконання компілюється до кореневого комплектного
dist. Це пакування лише для Docker не змінює контракт артефактів плагіна в npm або ClawHub.
Невідомі, недійсні чи неоднозначні ідентифікатори спричиняють помилку збирання образу.
Відомі ідентифікатори лише залежностей або вихідного коду зберігають наявне проміжне
розміщення вихідного коду й залежностей без додавання скомпільованого запису до кореневого
dist. Вибраний плагін з уніфікованими записами збирання має успішно компілюватися;
вихідний код і результати середовища виконання невибраних зовнішніх плагінів видаляються.

Наприклад, ці команди збирають окремі багатоархітектурні автономні
образи gateway FakeCo для ClickClack, Slack і Microsoft Teams. ClawRouter уже
є частиною кореневого середовища виконання OpenClaw, тому образ ClickClack вибирає лише
`clickclack`. Явно порожній аргумент браузера дає змогу не включати
Chromium до стандартного образу:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Використовуйте `--platform linux/arm64 --load` або `--platform linux/amd64 --load` для
одного локального нативного збирання. Багатоплатформовий результат і прикріплені SBOM/дані
про походження потребують реєстру або іншого виведення Buildx, що зберігає атестації. Після
надсилання перевірте маніфест і розгорніть незмінний дайджест замість
змінного тегу SHA вихідного коду:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Розгортання: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Ці образи призначені для автономних gateway на основі OCI та звичайних користувачів Docker.
Gateway під керуванням Crabhelm їх не використовують: цей шлях доставки створює
окремий архів пристрою x86_64, що містить tarball npm OpenClaw, і фіксує
дайджести Node, архіву та маніфесту. Збирайте цей пристрій окремо
з того самого інтегрованого вихідного коду OpenClaw.

Щоб перевірити вихідний код комплектного плагіна в запакованому образі, змонтуйте один каталог вихідного коду плагіна поверх шляху його запакованого вихідного коду, наприклад `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Це замінить відповідний скомпільований комплект `/app/dist/extensions/synology-chat` для того самого ідентифікатора плагіна.

### Спостережуваність

Експорт OpenTelemetry здійснюється назовні з контейнера Gateway до вашого збирача OTLP; для нього не потрібно публікувати порт Docker. Щоб включити комплектний експортер до локально зібраного образу:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційні готові образи вже містять `diagnostics-otel`; установлюйте `clawhub:@openclaw/diagnostics-otel` самостійно лише тоді, коли ви його видалили. Щоб увімкнути експорт, дозвольте й увімкніть плагін `diagnostics-otel` у конфігурації, а потім установіть `diagnostics.otel.enabled=true` (повний приклад див. у розділі [Експорт OpenTelemetry](/uk/gateway/opentelemetry)). Заголовки автентифікації збирача передаються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus повторно використовують уже опублікований порт Gateway. Установіть `clawhub:@openclaw/diagnostics-prometheus`, увімкніть плагін `diagnostics-prometheus`, а потім опитуйте:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищено автентифікацією Gateway; не відкривайте окремий загальнодоступний порт `/metrics` або неавтентифікований шлях зворотного проксі. Див. [Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки працездатності

Кінцеві точки перевірки контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # працездатність
curl -fsS http://127.0.0.1:18789/readyz     # готовність
```

Вбудований в образ `HEALTHCHECK` опитує `/healthz`; повторні невдалі перевірки позначають контейнер як `unhealthy`, щоб оркестратори могли перезапустити або замінити його.

Автентифікований розширений знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN і loopback

`scripts/docker/setup.sh` типово встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб `http://127.0.0.1:18789` на хості працював із публікацією портів Docker.

- `lan` (типово): браузер і CLI на хості можуть отримати доступ до опублікованого порту gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть безпосередньо отримати доступ до gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Локальні провайдери хоста

Усередині контейнера `127.0.0.1` означає сам контейнер, а не хост. Використовуйте `host.docker.internal` для провайдерів, запущених на хості:

| Провайдер | Стандартна URL-адреса хоста | URL-адреса для налаштування Docker |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Комплектне налаштування використовує ці URL-адреси як стандартні значення початкового налаштування LM Studio/Ollama, а `docker-compose.yml` зіставляє `host.docker.internal` із gateway хоста в Linux Docker Engine (Docker Desktop надає такий самий псевдонім у macOS/Windows). Служби хоста мають прослуховувати адресу, доступну для Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Використовуєте власний файл Compose або `docker run`? Додайте таке саме зіставлення самостійно, наприклад `--add-host=host.docker.internal:host-gateway`.

### Бекенд Claude CLI у Docker

Офіційний образ не містить попередньо встановленого Claude Code. Установіть його та ввійдіть у систему всередині користувача `node` контейнера, а потім забезпечте постійне зберігання домашнього каталогу контейнера, щоб оновлення образу не видаляли виконуваний файл або стан автентифікації.

Для нового встановлення ввімкніть постійний том `/home/node` перед запуском налаштування:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Для наявного встановлення спочатку зупиніть стек і повторно завантажте поточні значення `.env` — сценарій налаштування завжди перезаписує `.env` на основі поточної оболонки та стандартних значень і не читає файл самостійно:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Якщо `.env` містить значення, які ваша оболонка не може підключити, спочатку вручну повторно експортуйте потрібні значення (`OPENCLAW_IMAGE`, порти, режим прив’язки, власні шляхи, `OPENCLAW_EXTRA_MOUNTS`, пісочницю, пропуск початкового налаштування). Згенерований файл перевизначень монтує домашній том для `openclaw-gateway` і `openclaw-cli`; виконуйте решту команд із цим файлом перевизначень (і спочатку з `docker-compose.override.yml`, якщо ви його використовуєте):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Нативний інсталятор записує `claude` до `/home/node/.local/bin/claude`. Укажіть OpenClaw цей шлях:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Увійдіть і перевірте з того самого постійного домашнього каталогу:

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

Потім використовуйте комплектний бекенд `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Привіт із Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` забезпечує постійне зберігання нативного встановлення в `/home/node/.local/bin` і `/home/node/.local/share/claude`, а також налаштувань і даних автентифікації Claude Code в `/home/node/.claude` і `/home/node/.claude.json`. Постійного зберігання лише `/home/node/.openclaw` недостатньо; якщо замість домашнього тому ви використовуєте `OPENCLAW_EXTRA_MOUNTS`, змонтуйте всі ці шляхи Claude в обох службах.

<Note>
Для спільної автоматизації у робочому середовищі або передбачуваної тарифікації Anthropic віддавайте перевагу шляху з ключем API Anthropic. Повторне використання Claude CLI залежить від установленої версії Claude Code, входу в обліковий запис, тарифікації та поведінки оновлень.
</Note>

### Bonjour / mDNS

Мережа мосту Docker зазвичай ненадійно пересилає багатоадресний трафік Bonjour/mDNS (`224.0.0.251:5353`). Коли `OPENCLAW_DISABLE_BONJOUR` не встановлено, комплектний плагін Bonjour автоматично вимикає оголошення в LAN після виявлення запуску в контейнері, тому не зациклюється на аварійних перезапусках через повторні спроби передати багатоадресний трафік, який відкидає міст. Установіть `OPENCLAW_DISABLE_BONJOUR=1`, щоб примусово вимкнути його незалежно від результату виявлення, або `0`, щоб примусово ввімкнути його (лише в мережі хоста, macvlan або іншій мережі, де багатоадресний трафік mDNS гарантовано працює).

В інших випадках використовуйте опубліковану URL-адресу Gateway, Tailscale або глобальний DNS-SD для хостів Docker. Особливості та способи усунення несправностей див. у розділі [Виявлення Bonjour](/uk/gateway/bonjour).

### Зберігання та постійність

Docker Compose монтує `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace` і `OPENCLAW_AUTH_PROFILE_SECRET_DIR` до `/home/node/.config/openclaw` через bind mount, тому ці шляхи зберігаються після заміни контейнера. Якщо змінну не встановлено, `docker-compose.yml` використовує резервний шлях у `${HOME}` або `/tmp`, якщо відсутній сам `HOME`, тому `docker compose up` ніколи не створює специфікацію тому з порожнім джерелом у базових середовищах.

Цей змонтований каталог конфігурації містить:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збережених даних автентифікації OAuth/ключа API провайдера
- `.env` для секретів середовища виконання зі змінних середовища, як-от `OPENCLAW_GATEWAY_TOKEN`

Каталог секретів профілів автентифікації зберігає локальний ключ шифрування для матеріалів токенів профілів автентифікації на основі OAuth. Зберігайте його разом зі станом хоста Docker, але окремо від `OPENCLAW_CONFIG_DIR`.

Установлені завантажувані плагіни зберігають стан пакетів у змонтованому домашньому каталозі OpenClaw, тому записи про встановлення та кореневі каталоги пакетів зберігаються після заміни контейнера; запуск gateway не створює повторно дерева залежностей комплектних плагінів.

Докладні відомості про постійність віртуальної машини див. у розділі [Середовище виконання віртуальної машини Docker — що й де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Основні джерела зростання використання диска:** `media/`, окремі бази даних SQLite для агентів, застарілі JSONL-транскрипти сеансів, спільна база даних стану SQLite, кореневі каталоги пакетів установлених плагінів і циклічні файлові журнали в `/tmp/openclaw/`.

### Допоміжні засоби оболонки (необов’язково)

Для коротших повсякденних команд установіть [ClawDock](/uk/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановлювали зі старішого шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду, щоб локальний допоміжний засіб відстежував поточне розташування. Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо (виконайте `clawdock-help`, щоб переглянути повний список).

<AccordionGroup>
  <Accordion title="Увімкнення пісочниці агента для Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Власний шлях до сокета (наприклад, Docker без прав root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішної перевірки передумов пісочниці. Якщо налаштування пісочниці неможливо завершити, він скидає `agents.defaults.sandbox.mode` до `off`. Режим коду Codex вимкнено для запитів, під час яких активна пісочниця OpenClaw (див. [Пісочниця § Серверна частина Docker](/uk/gateway/sandboxing#docker-backend)); ніколи не монтуйте сокет Docker хоста в контейнери пісочниці агента.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивний режим)">
    Вимкніть виділення псевдотермінала Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб команди CLI могли звертатися до gateway через `127.0.0.1`. Вважайте це спільною межею довіри. Конфігурація Compose вилучає `NET_RAW`/`NET_ADMIN` та вмикає `no-new-privileges` для `openclaw-gateway` і `openclaw-cli`.
  </Accordion>

  <Accordion title="Помилки DNS Docker Desktop в openclaw-cli">
    У деяких конфігураціях Docker Desktop DNS-пошук із допоміжного контейнера спільної мережі `openclaw-cli` перестає працювати після вилучення `NET_RAW`, що проявляється як `EAI_AGAIN` під час команд із використанням npm, як-от `openclaw plugins install`. Для звичайної роботи залиште стандартний захищений файл Compose. Наведене нижче перевизначення відновлює стандартні можливості лише для контейнера `openclaw-cli` — використовуйте його для одноразової команди, якій потрібен доступ до реєстру, а не як стандартний спосіб запуску:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Якщо ви вже створили довготривалий контейнер `openclaw-cli`, створіть його заново з тим самим перевизначенням — `docker compose exec`/`docker exec` не можуть змінити можливості Linux у вже створеному контейнері.

  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ працює від імені `node` (uid 1000). Якщо виникають помилки дозволів для `/home/node/.openclaw`, переконайтеся, що прив’язані монтування хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Та сама невідповідність може проявлятися як `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, після чого з’являється `plugin present but blocked` — uid процесу та власник змонтованого каталогу плагіна не збігаються. Рекомендовано запускати процес зі стандартним uid 1000 і виправити власника прив’язаного монтування. Змінюйте власника `/path/to/openclaw-config/npm` на `root:root` лише тоді, коли свідомо плануєте довгостроково запускати OpenClaw від імені root.

  </Accordion>

  <Accordion title="Швидше повторне збирання">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися й повторний запуск `pnpm install` не відбувався без змін у файлах блокування:

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
    Стандартний образ насамперед орієнтований на безпеку та працює від імені непривілейованого користувача `node`. Для контейнера з ширшими можливостями:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудовуйте системні залежності**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Вбудовуйте залежності Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Вбудовуйте Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1` або використовуйте офіційний тег образу `-browser`
    5. **Або встановіть браузери Playwright у постійний том**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Зберігайте завантаження браузера**: використовуйте `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`. OpenClaw автоматично виявляє керований Playwright Chromium з образу в Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker без графічного інтерфейсу)">
    Якщо в майстрі вибрано OpenAI Codex OAuth, він відкриває URL-адресу в браузері. У Docker або середовищах без графічного інтерфейсу скопіюйте повну URL-адресу переспрямування, на яку ви потрапите, і вставте її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Образ середовища виконання використовує `node:24-bookworm-slim` і запускає `tini` як PID 1, щоб завершені дочірні процеси прибиралися, а сигнали правильно оброблялися в довготривалих контейнерах. Він публікує анотації базового образу OCI, зокрема `org.opencontainers.image.base.name` і `org.opencontainers.image.source`. Dependabot оновлює зафіксований дайджест базового образу Node; під час випускних збірок окремий шар оновлення дистрибутива не запускається. Див. [Анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і [Середовище виконання Docker VM](/uk/install/docker-vm-runtime), щоб ознайомитися з етапами розгортання на спільній віртуальній машині, зокрема вбудовуванням бінарних файлів, постійним зберіганням та оновленнями.

## Пісочниця агента

Коли `agents.defaults.sandbox` увімкнено із серверною частиною Docker, gateway виконує інструменти агента (оболонку, читання й запис файлів тощо) в ізольованих контейнерах Docker, тоді як сам gateway залишається на хості — це створює надійну межу навколо ненадійних або багатокористувацьких сеансів агента без контейнеризації всього gateway.

Область пісочниці може бути окремою для кожного агента (стандартно), сеансу або спільною; кожна область отримує власний робочий простір, змонтований у `/workspace`. Також можна налаштувати політики дозволу й заборони інструментів, ізоляцію мережі, обмеження ресурсів і контейнери браузера.

Повна конфігурація, образи, примітки щодо безпеки та профілі для кількох агентів:

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник із пісочниці
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ до оболонки контейнерів пісочниці
- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

### Швидке ввімкнення

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // вимкнено | неосновний | усі
        scope: "agent", // сеанс | агент | спільна
      },
    },
  },
}
```

Зберіть стандартний образ пісочниці (з вихідного робочого дерева):

```bash
scripts/sandbox-setup.sh
```

Для встановлень через npm без вихідного робочого дерева див. вбудовані команди `docker build` у розділі [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер пісочниці не запускається">
    Зберіть образ пісочниці за допомогою [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (вихідне робоче дерево) або вбудованої команди `docker build` із розділу [Пісочниця § Образи та налаштування](/uk/gateway/sandboxing#images-and-setup) (встановлення через npm), або задайте власний образ у `agents.defaults.sandbox.docker.image`. Контейнери автоматично створюються для кожного сеансу за потреби.
  </Accordion>

  <Accordion title="Помилки дозволів у пісочниці">
    Задайте в `docker.user` UID:GID, що відповідає власнику змонтованого робочого простору, або змініть власника папки робочого простору.
  </Accordion>

  <Accordion title="Власні інструменти не знайдено в пісочниці">
    OpenClaw запускає команди через `sh -lc` (оболонку входу), яка завантажує `/etc/profile` і може скинути PATH. Задайте `docker.env.PATH`, щоб додати шляхи до власних інструментів на початок, або додайте скрипт у `/etc/profile.d/` у Dockerfile.
  </Accordion>

  <Accordion title="Процес завершено через нестачу пам’яті під час збирання образу (код виходу 137)">
    Віртуальній машині потрібно щонайменше 2 GB оперативної пам’яті. Використайте потужніший клас машини та повторіть спробу.
  </Accordion>

  <Accordion title="Немає авторизації або потрібне сполучення в інтерфейсі керування">
    Отримайте нове посилання на панель керування та схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Панель керування](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або Docker CLI повідомляє про помилки сполучення">
    Скиньте режим і прив’язку gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на основі Podman
- [ClawDock](/uk/install/clawdock) — конфігурація Docker Compose від спільноти
- [Оновлення](/uk/install/updating) — підтримання OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація gateway після встановлення
