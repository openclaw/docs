---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Комплект тестування: набори unit/e2e/live, ранери Docker і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-01T08:28:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker runners. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA stack (qa-lab, qa-channel, live transport lanes)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовують сценарії на основі репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels runners. Розділ про QA-specific runners нижче ([QA-specific runners](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спочатку надавайте перевагу цільовим запускам, коли ітеруєте над одним збоєм.
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live suite (models + gateway tool/image probes): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає текстовий turn плюс невелику пробу в стилі читання файлу.
    Моделі, метадані яких оголошують підтримку вхідних даних `image`, також запускають невеликий image turn.
    Вимкніть додаткові проби за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розбиті за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal provider secrets до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через нативне прив’язування Plugin замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає agent turns Gateway через Codex app-server harness, що належить Plugin,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує проби image,
    cron MCP, sub-agent і Guardian. Вимкніть пробу sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші проби:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після проби sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова перестрахувальна перевірка поверхні rescue command для message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє audit/config write path.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + SecretRef writes,
    перевіряє конфігурацію та audit entries. Той самий Ring 0 setup path
    також покритий у QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-specific runners

Ці команди розташовані поруч із основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у спеціальних workflows. `Parity gate` запускається на відповідних PR і
через ручний dispatch із mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і ручний workflow input за замовчуванням залишаються
`all`; ручний dispatch може розбити `all` на jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед approval релізу, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
й уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; поведінка пам’яті залишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім підтягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
в кожному shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на основі репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого serial lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується збоєм. Використовуйте `--allow-failures`, коли
    потрібні artifacts без failing exit code.
  - Підтримує provider modes `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний provider server на основі AIMock для експериментального
    покриття fixture і protocol-mock без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише sustained hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як метрики
    без вигляду minutes-long gateway peg regression.
  - Використовує зібрані artifacts `dist`; спочатку запустіть build, коли checkout не
    має свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині одноразової Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
  - Повторно використовує ті самі прапорці вибору provider/model, що й `qa suite`.
  - Live runs передають підтримувані QA auth inputs, практичні для guest:
    provider keys на основі env, шлях до QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають залишатися під repo root, щоб guest міг записувати назад через
    mounted workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для QA-роботи в стилі оператора.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його globally у
    Docker, запускає non-interactive OpenAI API-key onboarding, налаштовує Telegram
    за замовчуванням, перевіряє, що ввімкнення Plugin встановлює runtime dependencies на
    вимогу, запускає doctor і виконує один local agent turn проти mocked OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у visible user turn,
    потім seed-ить affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch з backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions надає цей lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler з smoke, package, product, full або custom
  lane profiles. Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказ exact tarball URL потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Доказ артефакта завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає відсутніми неналаштовані
    runtime-залежності plugin, перший налаштований запуск Gateway або doctor
    встановлює runtime-залежності кожного вбудованого plugin на вимогу, а
    другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відомий старіший базовий npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor
    кандидата виправляє runtime-залежності вбудованого каналу без
    postinstall-виправлення на боці harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke для оновлення packaged-install у гостьових системах Parallels. Кожна
    вибрана платформа спершу встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі та перевіряє
    встановлену версію, статус оновлення, готовність gateway і один хід
    локального агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до summary artifact і
    статусу кожної лінії.
  - Лінія OpenAI типово використовує `openai/gpt-5.5` для живого доказу agent-turn.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски в timeout хоста, щоб зависання транспорту Parallels не могли
    використати решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішній wrapper завис.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/runtime
    виправлення залежностей на холодній гостьовій системі; це все ще нормальний стан, коли вкладений
    npm debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    smoke-лініями macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, подавання package або стану gateway гостьової системи.
  - Доказ після оновлення запускає звичайну поверхню вбудованих plugin, тому що
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через вбудовані runtime API, навіть коли сам
    agent turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    тестування.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лінію Matrix проти одноразового Tuwunel homeserver на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA-лінію Telegram проти справжньої приватної групи з використанням токенів driver і SUT bot з env.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних pooled credentials. Типово використовуйте env-режим або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без failing exit code.
  - Потребує двох різних ботів в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями містять RTT від запиту driver send до спостереженої відповіді SUT.

Live transport lanes мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття для кожної лінії міститься в [Огляд QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий synthetic suite і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивну lease з pool на базі Convex, надсилає heartbeats
для цієї lease, поки лінія виконується, і звільняє lease під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов'язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов'язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов'язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs для розробки лише локально.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` під час нормальної роботи.

Admin commands для maintainer (pool add/remove/list) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live runs, щоб перевірити Convex site URL, broker secrets,
endpoint prefix, HTTP timeout і досяжність admin/list без друку
значень secret. Використовуйте `--json` для machine-readable output у scripts і CI
utilities.

Типовий endpoint contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Вичерпано/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише maintainer secret)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише maintainer secret)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком chat id Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє malformed payloads.

### Додавання каналу до QA

Архітектура та назви scenario-helper для нових channel adapters містяться в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у manifest plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання flaky/cost):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Обсяг:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих bugs
- Очікування:
  - Запускається в CI
  - Не потребує справжніх keys
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити broad `api.js` і
    fallback-поведінку `runtime-api.js` з generated tiny plugin fixtures, а не
    справжні bundled plugin source APIs. Завантаження справжніх plugin API належать до
    plugin-owned contract/integration suites.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native-процесу кореневого проєкту. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension виснажувати ресурси для непов’язаних наборів тестів.
    - `pnpm test --watch` і далі використовує native-граф проєкту з кореневого `vitest.config.ts`, бо цикл спостереження з багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не сплачує повну ціну запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення вихідного коду та локальні залежні елементи import graph. Зміни config/setup/package не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний check gate для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового підтвердження викличте `pnpm test:changed` або явний `pnpm test <target>`. Version bumps лише для release metadata запускають цільові перевірки version/config/root-dependency, з guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell syntax для live Docker auth scripts і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші package-surface зміни й далі використовують ширші guards.
    - Легкі щодо імпортів unit tests з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих utility-зон спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані helper source files з `plugin-sdk` і `commands` також зіставляють changed-mode runs із явними сусідніми тестами в цих легких lanes, тож зміни helper-ів не перезапускають повний важкий suite для цього каталогу.
    - `auto-reply` має окремі buckets для top-level core helpers, top-level інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів повним Node tail.
    - Звичайний PR/main CI навмисно пропускає extension batch sweep і release-only shard `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих важких щодо plugin/extension suites на release candidates.

  </Accordion>

  <Accordion title="Покриття вбудованого runner">

    - Коли ви змінюєте входи discovery для message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper regressions для чистих меж routing і normalization.
    - Підтримуйте інтеграційні suites embedded runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці suites перевіряють, що scoped ids і поведінка compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper-ів
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Пул Vitest і типові параметри isolation">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у кореневих проєктах, e2e і live configs.
    - Кореневий UI lane зберігає своє налаштування `jsdom` і optimizer, але теж працює на
      спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі типові параметри `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити перевантаження компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staged і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` за замовчуванням спрямовується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішить, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      лише з вищим лімітом workers.
    - Локальне авто-масштабування workers навмисно консервативне й зменшує активність,
      коли середнє навантаження host уже високе, тож кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб changed-mode reruns залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування cache для прямого profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration, а також
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими з `origin/main`.
    - Дані часу shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують config path як key; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один гарячий тест і далі витрачає більшість часу на startup imports,
      тримайте важкі dependencies за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-importing runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із native root-project path для цього committed
      diff і друкує wall time плюс max RSS на macOS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне
      dirty tree, спрямовуючи changed file list через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      накладних витрат startup і transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з diagnostics, увімкненими за замовчуванням
  - Проганяє синтетичний gateway message, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers persistence для diagnostic stability bundle
  - Перевіряє, що recorder залишається bounded, синтетичні RSS samples залишаються в межах pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI і не потребує keys
  - Вузький lane для подальшої роботи над stability-regression, не заміна повного Gateway suite

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E tests у `extensions/`
- Типові runtime-параметри:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, локально: за замовчуванням 1).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового worker count (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Обсяг:
  - End-to-end поведінка multi-instance gateway
  - WebSocket/HTTP surfaces, node pairing і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні keys не потрібні
  - Більше рухомих частин, ніж у unit tests (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на host через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical filesystem behavior через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI binary або wrapper script

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live tests у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи справді цей provider/model працює _сьогодні_ з реальними creds?”
  - Виявляє зміни формату provider, особливості tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - За задумом не є CI-stable (реальні networks, реальні provider policies, quotas, outages)
  - Коштує грошей / використовує rate limits
  - Бажано запускати звужені subsets замість “усього”
- Live runs source `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live runs і далі ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live tests використовували ваш реальний home directory.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає gateway bootstrap logs/Bonjour chatter. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API key (provider-specific): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при rate limit responses.
- Progress/Heartbeat output:
  - Live suites тепер виводять progress lines у stderr, щоб довгі provider calls були видимо активними, навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб provider/gateway progress lines негайно транслювалися під час live runs.
  - Налаштовуйте direct-model Heartbeat через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте gateway/probe Heartbeat через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який suite мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в мережевій взаємодії Gateway / протоколі WS / спарюванні: додайте `pnpm test:e2e`
- Налагодження «мій бот недоступний» / збоїв конкретного провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Live-тести (з доступом до мережі)

Для live-матриці моделей, smoke-перевірок бекенду CLI, smoke-перевірок ACP, стенда
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, медіастенд) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker-запускачі (необов’язкові перевірки «працює в Linux»)

Ці Docker-запускачі поділяються на дві групи:

- Запускачі live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації й робочу область (і завантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-запускачі за замовчуванням використовують менший ліміт smoke-перевірки, щоб повний Docker-прогін залишався практичним:
  для `test:docker:live-models` за замовчуванням `OPENCLAW_LIVE_MAX_MODELS=12`, а
  для `test:docker:live-gateway` за замовчуванням `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли
  вам явно потрібне ширше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-тарбол через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише Node/Git-запускач для напрямів встановлення/оновлення/залежностей Plugin; ці напрями монтують попередньо зібраний тарбол. Функціональний образ встановлює той самий тарбол у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а ліміти ресурсів не дають важким live-, npm-install- і багатосервісним напрямам запускатися всім одночасно. Якщо один напрям важчий за активні ліміти, планувальник усе одно може запустити його, коли пул порожній, і потім тримає його єдиним запущеним, доки знову не з’явиться доступна ємність. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Запускач за замовчуванням виконує попередню перевірку Docker, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає часи успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці часи, щоб у наступних запусках стартувати довші напрями першими. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб у пакеті/образі та облікових даних.
- `Package Acceptance` — це нативний для GitHub пакетний шлюз для питання «чи працює цей встановлюваний тарбол як продукт?». Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-напрями проти саме цього тарбола замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені сценарії workflow/стенда, а `package_ref` вибирає вихідний коміт/гілку/тег для пакування, коли `source=ref`; це дає змогу поточній логіці приймання перевіряти старіші довірені коміти. Профілі впорядковано за широтою: `smoke` — це швидке встановлення/канал/агент плюс gateway/config, `package` — це контракт package/update/plugin плюс фікстура keyless upgrade-survivor, напрям published-baseline upgrade survivor і типова нативна заміна для більшості покриття package/update у Parallels, `product` додає MCP-канали, очищення cron/subagent, вебпошук OpenAI і OpenWebUI, а `full` запускає Docker-фрагменти релізного шляху з OpenWebUI. Для `published-upgrade-survivor` Package Acceptance завжди використовує `package-under-test` як кандидата і `published_upgrade_survivor_baseline` як резервну опубліковану базову версію, за замовчуванням `openclaw@latest`; установіть `published_upgrade_survivor_baselines=release-history`, щоб розділити напрям на дедупліковану матрицю з останніх шести стабільних релізів, `2026.4.23` і останнього стабільного релізу перед `2026-03-15`. Опублікований напрям налаштовує свою базову версію за допомогою вбудованого рецепта команди `openclaw config set`, а потім записує кроки рецепта в підсумок напряму. Валідація релізу запускає власну дельту пакета (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, тому що Docker-фрагменти релізного шляху вже покривають напрями package/update/plugin, які перетинаються. Цільові команди повторного запуску GitHub Docker, згенеровані з артефактів, містять попередній артефакт пакета, підготовлені вхідні дані образів і список базових версій published upgrade-survivor, коли вони доступні, щоб невдалі напрями могли уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` і завершується помилкою, якщо запуск до диспетчеризації імпортує залежності пакета, як-от Commander, prompt UI, undici або логування, до диспетчеризації команди; він також утримує зібраний фрагмент запуску Gateway в межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Smoke-перевірка упакованого CLI також покриває кореневу довідку, довідку onboard, довідку doctor, status, схему config і команду списку моделей.
- Сумісність Package Acceptance із застарілими версіями обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі стенд допускає лише прогалини метаданих уже випущеного пакета: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із тарбола, відсутній збережений `update.channel`, застарілі розташування install-record для Plugin, відсутнє збереження marketplace install-record і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Контейнерні smoke-запускачі: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-запускачі live-моделей також bind-монтують лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища auth на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` — це приватна QA лінія з checkout вихідного коду. Вона навмисно не входить до Docker-ліній випуску пакета, бо npm-архів не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через env-ref онбординг і типово Telegram, перевіряє, що doctor відновив активовані runtime-залежності Plugin, і виконує один змоканий хід агента OpenAI. Повторно використайте попередньо зібраний tarball з `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості з `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакета `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненого fixture старого користувача з агентами, конфігурацією каналу, allowlist Plugin, застарілим станом runtime-deps Plugin і наявними файлами workspace/session. Він запускає оновлення пакета та неінтерактивний doctor без live-ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети запуску/status.
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, додає реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює цю опубліковану інсталяцію до candidate tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` і розгорніть issue-подібні fixtures через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, як-от `reported-issues`; Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context transcript і відновлення doctor для зачеплених дубльованих гілок prompt-rewrite.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використайте попередньо зібраний tarball з `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості з `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між своїми root, update і direct-npm контейнерами. Update smoke типово використовує npm `latest` як stable baseline перед оновленням до candidate tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, що належать root, не маскували поведінку локальної для користувача інсталяції. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення через npm з `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ кореневого Dockerfile, додає двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON та поведінку зі збереженим workspace. Повторно використайте install-smoke образ з `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ із шаром Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють link URLs, clickables, підвищені cursor, iframe refs і frame metadata.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає reject provider schema і перевіряє, що raw detail з’являється в журналах Gateway.
- MCP channel bridge (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (справжній stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (справжній Gateway + демонтаж дочірнього stdio MCP після ізольованого cron і one-shot запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, встановлення/видалення ClawHub kitchen-sink, оновлення marketplace і увімкнення/інспекція Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture-сервер ClawHub.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` типово збирає малий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій Linux-інсталяції. Повторно використайте образ з `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки з `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate і bundled-channel chunks релізного шляху один раз попередньо пакують цей tarball, потім розбивають перевірки bundled channel на незалежні лінії, включно з окремими update lanes для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Release chunks розділяють channel smokes, update targets і setup/runtime contracts на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; aggregate chunk `bundled-channels` лишається доступним для ручних повторних запусків. Release workflow також розділяє provider installer chunks і bundled plugin install/uninstall chunks; legacy chunks `package-update`, `plugins-runtime` і `plugins-integrations` лишаються aggregate aliases для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Per-scenario Docker runs типово мають `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; multi-target update scenario типово має `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують doctor/runtime-dependency repair.
- Звужуйте bundled plugin runtime deps під час ітерацій, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific image overrides, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, все одно мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти витягують його, якщо він ще не локальний. Docker-тести QR та інсталятора зберігають власні Dockerfiles, бо вони перевіряють поведінку package/install, а не спільний built-app runtime.

Запускачі Docker для live-моделей також монтують поточний checkout лише для читання та
готують його в тимчасовому робочому каталозі всередині контейнера. Це зберігає runtime-
образ компактним, водночас запускаючи Vitest на вашому точному локальному вихідному коді/конфігурації.
Етап підготовки пропускає великі локальні кеші та виводи збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку `.build` або
каталоги виводу Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки gateway не запускали
реальні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому передавайте також
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття gateway
з цієї Docker-доріжки.
`test:docker:openwebui` — це суміснісний smoke-тест вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими HTTP-ендпойнтами, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантажити
образ Open WebUI, а Open WebUI може потребувати завершити власне налаштування cold-start.
Ця доріжка очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невелике JSON-навантаження на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує seeded-контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed discovery розмов, читання transcript, metadata вкладень,
поведінку черги live-подій, outbound send routing, а також сповіщення каналу +
дозволів у стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо інспектує сирі stdio MCP frames, щоб smoke-тест валідував те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує ключа live-
моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований cron turn і одноразовий child turn `/subagents spawn`, а потім перевіряє,
що child process MCP завершується після кожного запуску.

Ручний smoke-тест ACP plain-language thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для regression/debug workflows. Він може знову знадобитися для валідації ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується до `/home/node/.profile` і source-иться перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, source-нутих із `OPENCLAW_PROFILE_FILE`, з тимчасовими config/workspace dirs і без зовнішніх CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих CLI installs усередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Dirs за замовчуванням: `.minimax`
  - Files за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider-запуски монтують лише потрібні dirs/files, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` у повторних запусках, яким не потрібна повторна збірка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб гарантувати, що creds надходять із profile store (не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку gateway надає для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого image tag Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагувань docs: `pnpm check:docs`.
Запускайте повну валідацію anchors Mintlify, коли також потрібні перевірки in-page headings: `pnpm docs:check-links:anchors`.

## Offline-регресія (CI-safe)

Це регресії “реального pipeline” без реальних providers:

- Gateway tool calling (mock OpenAI, реальні gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (skills)

У нас уже є кілька CI-safe тестів, які поводяться як “agent reliability evals”:

- Mock tool-calling через реальні gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які валідують session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує required steps/args?
- **Workflow contracts:** multi-turn scenarios, які перевіряють tool order, session history carryover і sandbox boundaries.

Майбутні evals мають передусім залишатися детермінованими:

- Scenario runner з mock providers для перевірки tool calls + order, читання skill files і session wiring.
- Невеликий suite сценаріїв, сфокусованих на skills (use vs avoid, gating, prompt injection).
- Optional live evals (opt-in, env-gated) лише після появи CI-safe suite.

## Contract tests (plugin and channel shape)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі знайдені plugins і запускають suite
shape and behavior assertions. Стандартна unit-доріжка `pnpm test` навмисно
пропускає ці спільні seam and smoke files; запускайте contract commands явно,
коли торкаєтеся shared channel or provider surfaces.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Contract setup wizard
- **session-binding** - Поведінка session binding
- **outbound-payload** - Структура message payload
- **inbound** - Обробка inbound message
- **actions** - Channel action handlers
- **threading** - Обробка thread ID
- **directory** - Directory/roster API
- **group-policy** - Забезпечення group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма Plugin registry

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання або модифікації channel чи provider plugin
- Після рефакторингу plugin registration або discovery

Contract tests запускаються в CI і не потребують реальних API keys.

## Додавання регресій (настанови)

Коли ви виправляєте provider/model issue, виявлену в live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або capture точної request-shape transformation)
- Якщо це за своєю суттю live-only (rate limits, auth policies), тримайте live test вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один sampled target для кожного класу SecretRef із registry metadata (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec ids відхиляються.
  - Якщо додаєте нове `includeInPlan` сімейство SecretRef target у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на unclassified target ids, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
