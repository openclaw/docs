---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Комплект для тестування: набори unit/e2e/live-тестів, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-29T05:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 883840f97ca94a4e6b64cfce414da59ad3710ddd8e5e2e3ba04e33a83e96d407
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, під час налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовують сценарії з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ QA-специфічних раннерів нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і вказує назад на наведені вище довідники.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий watch-цикл Vitest: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над одним падінням спершу віддавайте перевагу таргетованим запускам.
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Таргетувати один live-файл тихо: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn плюс невелику перевірку в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний image turn.
    Вимикайте додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають перевикористовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розшардовані за провайдером.
  - Для сфокусованих повторних запусків CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдера до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що проста відповідь і вкладення зображення
    проходять через нативне прив’язування plugin замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає turns агента Gateway через harness Codex app-server, яким володіє plugin,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимикайте перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимикайте інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in перевірка «belt-and-suspenders» для поверхні команди порятунку message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на аудитований типізований
    запис конфігурації.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + записи SecretRef,
    валідовує конфігурацію та перевіряє записи audit. Той самий шлях Ring 0 setup
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6 і
  transcript асистента зберігає нормалізоване `usage.cost`.

<Tip>
Коли вам потрібен лише один failing case, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч з основними наборами тестів, коли потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і
з ручного dispatch з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і manual workflow input за замовчуванням залишаються
`all`; ручний dispatch може шардити `all` на `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед затвердженням релізу, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
і уникали звичайного startup provider-plugin. Ці live transport gateways вимикають
memory search; поведінка memory залишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість перебудови
в кожному shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішої serial lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій падає. Використовуйте `--allow-failures`, коли вам
    потрібні artifacts без failing exit code.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний provider server на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає bench старту Gateway плюс невеликий пакет mock QA Lab сценаріїв
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний підсумок CPU-спостережень
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тож короткі startup bursts записуються як metrics
    і не виглядають як minutes-long gateway peg regression.
  - Використовує зібрані artifacts `dist`; спершу запустіть build, якщо checkout ще не має
    свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині disposable Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
  - Повторно використовує ті самі flags вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що вмикання plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один local agent turn проти mocked OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований built-app Docker smoke для transcripts embedded runtime context.
    Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім засіває affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate пакета OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, потім повторно використовує
    live Telegram QA lane з тим установленим пакетом як SUT Gateway.
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
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions експонує цю lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також експонує `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler зі smoke, package, product, full або custom
  lane profiles. Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Останнє beta product proof:

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

- Доказ артефакта завантажує tarball-артефакт з іншого запуску Actions:

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
  - Перевіряє, що виявлення налаштування залишає неналаштовані runtime-залежності plugin
    відсутніми, перший налаштований запуск Gateway або doctor встановлює runtime-залежності кожного вбудованого
    plugin на вимогу, а другий перезапуск не перевстановлює
    залежності, які вже було активовано.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    виправляє runtime-залежності вбудованого каналу без
    postinstall-виправлення на боці harness.
- `pnpm test:parallels:npm-update`
  - Запускає smoke-перевірку оновлення нативного packaged-install у гостьових системах Parallels. Кожна
    вибрана платформа спершу встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі та перевіряє
    встановлену версію, статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до підсумкового артефакта та
    статусу кожної lane.
  - Lane OpenAI за замовчуванням використовує `openai/gpt-5.5` для live-доказу ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не
    використали решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10-15 хвилин на post-update doctor/runtime
    виправлення залежностей у холодній гостьовій системі; це все ще нормальний стан, якщо вкладений
    журнал npm debug просувається.
  - Не запускайте цю агрегувальну обгортку паралельно з окремими smoke lanes Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, подавання пакета або стану gateway у гостьовій системі.
  - Post-update proof запускає звичайну поверхню вбудованого plugin, тому що
    facade можливостей, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти справжньої приватної групи з використанням токенів driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без failing exit code.
  - Потребує двох окремих ботів в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостереженої відповіді SUT.

Live transport lanes мають один стандартний контракт, щоб нові транспорти не відхилялися; матриця покриття для кожної lane міститься в [огляд QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий synthetic suite і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з pool на базі Convex, надсилає heartbeats
для цього lease, поки lane виконується, і звільняє lease під час shutdown.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Стандартне значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє URL Convex з loopback `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди maintainer (pool add/remove/list) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без виведення
секретних значень. Використовуйте `--json` для machine-readable output у scripts і CI
utilities.

Стандартний endpoint contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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

Форма payload для виду Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком numeric Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє malformed payloads.

### Додавання каналу до QA

Назви архітектури та scenario-helper для нових адаптерів каналів описані в [огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у manifest plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Тестові набори (що де запускається)

Думайте про набори як про “зростальну реалістичність” (і зростальну нестабільність/вартість):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Обсяг:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілені запуски `pnpm test` виконують дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного нативного процесу кореневого проєкту. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension виснажувати ресурси для непов'язаних наборів тестів.
    - `pnpm test --watch` досі використовує нативний граф проєктів кореневого `vitest.config.ts`, оскільки цикл спостереження з багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платить повну вартість запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі редагування тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні файли з import graph. Редагування config/setup/package не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним контрольним gate для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового підтвердження викликайте `pnpm test:changed` або явний `pnpm test <target>`. Version bumps лише для release metadata запускають цільові перевірки version/config/root-dependency з guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Редагування live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth-скриптів і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependency, export, version та інших package-surface досі використовують ширші guards.
    - Import-light unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих utility-областей спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли лишаються на наявних lanes.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих легких lanes, тому редагування helper-ів не перезапускають увесь важкий набір для цього каталогу.
    - `auto-reply` має окремі buckets для верхньорівневих core helpers, верхньорівневих integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім Node-хвостом.

  </Accordion>

  <Accordion title="Покриття вбудованого runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресійні helper-тести для меж чистої маршрутизації та нормалізації.
    - Підтримуйте справність integration-наборів вбудованого runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction досі проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only тести
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення pool та isolation у Vitest">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Коренева UI lane зберігає своє налаштування `jsdom` та optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі штатною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staging і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен розумний локальний check gate.
    - `pnpm test:changed` за замовчуванням спрямовується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішує, що редагування harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Локальне автоматичне масштабування workers навмисно консервативне й відступає,
      коли середнє навантаження host уже високе, тому кілька одночасних
      запусків Vitest за замовчуванням шкодять менше.
    - Базова конфігурація Vitest позначає проєкти/config-файли як
      `forceRerunTriggers`, щоб reruns у changed-mode лишалися коректними, коли змінюється
      wiring тестів.
    - Конфігурація лишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування cache для прямого profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість imports плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами,
      зміненими відносно `origin/main`.
    - Дані timing шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски whole-config використовують шлях config як ключ; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшу частину часу на startup imports,
      тримайте важкі dependencies за вузьким локальним швом `*.runtime.ts` і
      mock-айте цей шов напряму замість deep-import runtime helpers лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом root-project для цього закоміченого
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      dirty tree, спрямовуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit-набору з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway із diagnostics, увімкненими за замовчуванням
  - Проганяє синтетичне gateway-повідомлення, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers persistence для diagnostic stability bundle
  - Перевіряє, що recorder лишається bounded, синтетичні RSS samples лишаються в межах pressure budget, а глибини per-session queue повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для подальшої stability-regression роботи, не заміна повному набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Runtime defaults:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити overhead console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного console output.
- Область:
  - End-to-end поведінка multi-instance gateway
  - Поверхні WebSocket/HTTP, pairing node і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований OpenShell gateway на host через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальний `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує test gateway і sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI binary або wrapper script

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - “Чи цей provider/model справді працює _сьогодні_ з реальними creds?”
  - Виявляти зміни provider format, особливості tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - За задумом не є CI-stable (реальні networks, реальні policies providers, quotas, outages)
  - Коштує грошей / використовує rate limits
  - Надавайте перевагу запуску звужених піднаборів замість “усього”
- Live-запуски source-ять `~/.profile`, щоб отримати відсутні API keys.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють config/auth матеріал у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний home directory.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає logs bootstrap Gateway/Bonjour chatter. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API keys (залежить від provider): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять progress lines у stderr, щоб довгі provider calls були помітно активними навіть тоді, коли console capture Vitest тихий.
  - `vitest.live.config.ts` вимикає перехоплення console у Vitest, щоб progress lines provider/gateway одразу stream-илися під час live-запусків.
  - Налаштовуйте direct-model Heartbeat через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Використовуйте цю таблицю рішень:

- Редагування logic/tests: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зачіпаєте gateway networking / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “my bot is down” / provider-specific failures / tool calling: запускайте звужений `pnpm test:live`

## Live (network-touching) tests

Для актуальної матриці моделей, smoke-перевірок бекенда CLI, smoke-перевірок ACP, harness сервера застосунку Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення, музика, відео, медіа-harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Live-ранери моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із профільним ключем усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують локальний каталог конфігурації та робочу область (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово використовують менший ліміт smoke-перевірок, щоб повний Docker-прогін лишався практичним:
  `test:docker:live-models` типово має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  явно потрібне ширше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає або повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише Node/Git-ранером для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегований запуск використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як ресурсні ліміти не дають важким live-, npm-install- і multi-service-напрямам стартувати одночасно. Якщо один напрям важчий за активні ліміти, планувальник усе одно може запустити його, коли пул порожній, і тоді тримає його єдиним запущеним, доки знову не стане доступна місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише коли Docker-хост має більший запас ресурсів. Ранер типово виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках першими стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб пакетів/образів і облікових даних.
- `Package Acceptance` — це GitHub-нативний пакетний gate для перевірки «чи працює цей встановлюваний tarball як продукт?». Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-напрями проти саме цього tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірений workflow/harness-скрипти, тоді як `package_ref` вибирає вихідний коміт/гілку/тег для пакування, коли `source=ref`; це дає змогу поточній логіці acceptance перевіряти старіші довірені коміти. Профілі впорядковані за широтою: `smoke` — це швидка перевірка install/channel/agent плюс gateway/config, `package` — контракт package/update/plugin і типова нативна заміна більшості покриття package/update у Parallels, `product` додає MCP-канали, очищення cron/subagent, вебпошук OpenAI і OpenWebUI, а `full` запускає Docker-фрагменти release-path з OpenWebUI. Валідація релізу запускає власну пакетну дельту (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, бо Docker-фрагменти release-path уже покривають перехресні напрями package/update/plugin. Цільові команди повторного запуску GitHub Docker, згенеровані з артефактів, включають попередній пакетний артефакт і підготовлені вхідні дані образів, коли вони доступні, тож проблемні напрями можуть уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить статичний зібраний граф із `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо pre-dispatch startup імпортує пакетні залежності на кшталт Commander, prompt UI, undici або логування до dispatch команди; він також утримує зібраний gateway run chunk у межах бюджету та відхиляє статичні імпорти відомих холодних gateway-шляхів. Packaged CLI smoke також покриває кореневу довідку, довідку onboard, довідку doctor, status, схему config і команду model-list.
- Сумісність із застарілими версіями Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини метаданих уже випущених пакетів: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні patch-файли у tarball-derived git fixture, відсутній збережений `update.channel`, застарілі розташування plugin install-record, відсутнє збереження marketplace install-record і міграцію метаданих config під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими збоями.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker-ранери також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб external-CLI OAuth міг оновлювати токени без зміни auth-сховища хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Перевірка прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Перевірка бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Перевірка app-server harness Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Перевірка спостережуваності: `pnpm qa:otel:smoke` — приватна лінія перевірки вихідного checkout QA. Вона навмисно не входить до Docker-ліній випуску пакета, бо npm tarball не містить QA Lab.
- Жива перевірка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Перевірка онбордингу/каналу/агента npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює упакований OpenClaw tarball у Docker, налаштовує OpenAI через онбординг із env-ref і типово Telegram, перевіряє, що doctor відремонтував активовані runtime-залежності Plugin, і запускає один змодельований хід агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Перевірка перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює упакований OpenClaw tarball у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Перевірка runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту транскрипту та ремонт doctor для зачеплених дубльованих гілок prompt-rewrite.
- Перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому домашньому каталозі та перевіряє, що `openclaw infer image providers --json` повертає вбудованих постачальників зображень замість зависання. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker-перевірка інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш між своїми root, update і direct-npm контейнерами. Перевірка оновлення типово використовує npm `latest` як stable-базу перед оновленням до candidate tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root тримають ізольований npm-кеш, щоб root-owned записи кешу не приховували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm під час локальних повторних запусків.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цієї змінної середовища, коли потрібне покриття прямого `npm install -g`.
- Перевірка CLI видалення агентами спільного робочого простору: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ із кореневого Dockerfile, засіває двох агентів одним робочим простором в ізольованому домашньому каталозі контейнера, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого робочого простору. Повторно використайте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Перевірка snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із raw CDP, запускає `browser doctor --deep` і перевіряє, що snapshot ролей CDP охоплюють URL посилань, клікабельні елементи, підвищені курсором, refs iframe і метадані frame.
- Регресія OpenAI Responses web_search minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змодельований сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера й перевіряє, що необроблена detail з’являється в логах Gateway.
- Міст MCP-каналів (засіяний Gateway + stdio-міст + перевірка raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi bundle (справжній stdio MCP-сервер + перевірка allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (справжній Gateway + демонтаж дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin-и (перевірка встановлення, встановлення/видалення ClawHub kitchen-sink, оновлення marketplace і ввімкнення/інспекція Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару package/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер fixture ClawHub.
- Перевірка незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Перевірка metadata перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованих Plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий образ Docker runner, один раз збирає й пакує OpenClaw на хості, потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використайте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегат і bundled-channel chunks шляху випуску попередньо пакують цей tarball один раз, потім shard-поділяють перевірки вбудованих каналів на незалежні лінії, включно з окремими лініями оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Release chunks розділяють перевірки каналів, цілі оновлення та контракти setup/runtime на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; агрегатний chunk `bundled-channels` залишається доступним для ручних повторних запусків. Release workflow також розділяє chunks інсталятора провайдера та chunks встановлення/видалення вбудованих Plugin; застарілі chunks `package-update`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними aliases для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску вбудованої лінії, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Docker-запуски за сценаріями типово мають `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; багатотаргетний сценарій оновлення типово має `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують ремонт doctor/runtime-dependency.
- Звужуйте runtime-залежності вбудованих Plugin під час ітерацій, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не локальний. Docker-тести QR та інсталятора зберігають власні Dockerfile, бо вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Docker runners live-model також монтують поточний checkout лише для читання та
поміщають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime
образ легким, але все одно запускає Vitest проти саме вашого локального source/config.
Крок staging пропускає великі локальні кеші та build-виводи застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку каталоги `.build` або
Gradle output, щоб Docker live-запуски не витрачали хвилини на копіювання
machine-specific артефактів.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live probes Gateway не запускали
справжні worker-и каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття
Gateway із цієї Docker-лінії.
`test:docker:openwebui` — це високорівнева перевірка сумісності: вона запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoint-ами,
запускає pinned контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` expose-ить `openclaw/default`, потім надсилає
справжній chat request через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися завантажити
образ Open WebUI, а Open WebUI може знадобитися завершити власне cold-start setup.
Ця лінія очікує придатний live model key, і `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невелике JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
справжнього облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який spawn-ить `openclaw mcp serve`, потім
перевіряє routed conversation discovery, читання транскриптів, metadata вкладень,
поведінку черги live event, маршрутизацію outbound send і channel +
permission notifications у стилі Claude через справжній stdio MCP bridge. Перевірка сповіщень
безпосередньо інспектує raw stdio MCP frames, тож перевірка валідує те, що
міст фактично emits, а не лише те, що конкретний client SDK випадково surface-ить.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає Docker-образ репозиторію, запускає справжній stdio MCP probe server
усередині контейнера, materialize-ить цей сервер через вбудований runtime Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway зі справжнім stdio MCP probe server, запускає
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна plain-language перевірка thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для регресійних і налагоджувальних робочих процесів. Він може знову знадобитися для перевірки маршрутизації потоків ACP, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише змінних середовища, підвантажених із `OPENCLAW_PROFILE_FILE`, із тимчасовими каталогами конфігурації/робочого простору та без монтувань автентифікації зовнішніх CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Каталоги/файли автентифікації зовнішніх CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` під час повторних запусків, яким не потрібне повторне збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` для гарантії, що облікові дані надходять зі сховища профілю (а не з середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку Gateway надає для smoke-перевірки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення підказки перевірки nonce, яку використовує smoke-перевірка Open WebUI
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого тегу образу Open WebUI

## Перевірка коректності документації

Запускайте перевірки документації після змін у документах: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклик інструментів через Gateway (імітація OpenAI, реальний Gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "виконує імітований виклик інструмента OpenAI наскрізно через цикл агента Gateway")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + примусово застосовує автентифікацію): `src/gateway/gateway.test.ts` (випадок: "запускає майстер через ws і записує конфігурацію токена автентифікації")

## Оцінювання надійності агентів (skills)

У нас уже є кілька безпечних для CI тестів, що поводяться як «оцінювання надійності агентів»:

- Імітований виклик інструментів через реальний Gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють зв’язування сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли Skills наведені в підказці, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти робочого процесу:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі пісочниці.

Майбутні оцінювання насамперед мають залишатися детермінованими:

- Виконавець сценаріїв із використанням імітованих провайдерів для перевірки викликів інструментів + порядку, читання файлів skill і зв’язування сесії.
- Невеликий набір сценаріїв, зосереджених на skills (використовувати чи уникати, обмеження, ін’єкція підказок).
- Необов’язкові live-оцінювання (за явним увімкненням, керовані змінними середовища) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
контракту інтерфейсу. Вони проходять усі знайдені plugins і запускають набір
перевірок форми та поведінки. Типова unit-смуга `pnpm test` навмисно
пропускає ці спільні файли швів і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка зв’язування сесії
- **outbound-payload** - Структура корисного навантаження повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID потоків
- **directory** - API каталогу/реєстру учасників
- **group-policy** - Застосування групової політики

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу каналу
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Середовище виконання провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або змінення каналу чи провайдерського Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних ключів API.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену наживо:

- Додайте безпечну для CI регресію, якщо можливо (імітація/заглушка провайдера або фіксація точної трансформації форми запиту)
- Якщо це за своєю суттю лише live-випадок (ліміти швидкості, політики автентифікації), залишайте live-тест вузьким і вмикайте його явно через змінні середовища
- Надавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/відтворення запиту провайдера → прямий тест моделей
  - помилка конвеєра сесії/історії/інструментів Gateway → live-smoke Gateway або безпечний для CI імітований тест Gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментами обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих ідентифікаторах цілей, щоб нові класи не можна було пропустити непомітно.

## Пов’язане

- [Тестування наживо](/uk/help/testing-live)
- [CI](/uk/ci)
