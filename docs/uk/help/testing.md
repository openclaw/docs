---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-02T02:01:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір тестів (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовують сценарії з репозиторію.

Ця сторінка охоплює запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ про специфічні для QA ранери нижче ([Специфічні для QA ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і відсилає до наведених вище довідників.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору тестів на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме таргетування файлів тепер маршрутизує також шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Коли ітеруєте над одним збоєм, спочатку надавайте перевагу таргетованим запускам.
- Docker-backed сайт QA: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn плюс невелику пробу в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний image turn.
    Вимикайте додаткові проби через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розділені за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні secrets провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і image attachment
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає turns агента Gateway через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models` та за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probes. Вимикайте sub-agent probe через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in перевірка «belt-and-suspenders» для поверхні rescue command каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    валідує конфігурацію та перевіряє audit entries. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.
</Tip>

## Специфічні для QA ранери

Ці команди розташовані поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у виділених workflows. `Parity gate` запускається на відповідних PR
і з ручного dispatch з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Заплановані QA та release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і стандартне значення manual workflow input лишаються
`all`; manual dispatch може розбити `all` на jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед release approval, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони лишалися детермінованими
та уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; поведінка пам’яті лишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний образ
`ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість перебудови
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA з репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування
    кількості workers або `--concurrency 1` для старішої serial lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, коли
    хочете отримати artifacts без failing exit code.
  - Підтримує provider modes `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний AIMock-backed provider server для експериментального
    покриття fixtures і protocol-mock без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий пакет mock QA Lab scenarios
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише sustained hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як metrics
    і не виглядають як регресія minutes-long gateway peg.
  - Використовує зібрані artifacts `dist`; спочатку запустіть build, якщо checkout ще не
    має свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині disposable Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
  - Повторно використовує ті самі прапорці вибору provider/model, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають лишатися під коренем репозиторію, щоб guest міг записувати назад через
    mounted workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один local agent turn проти
    mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що hidden OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім засіває affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює package candidate OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через встановлений CLI, потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions надає цю lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler з profiles lane smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказ точного tarball URL потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Підтвердження артефактом завантажує tarball-артефакт з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/плагіни через
    зміни конфігурації.
  - Перевіряє, що виявлення налаштування не показує неналаштовані завантажувані плагіни,
    перше налаштоване виправлення doctor явно встановлює кожен відсутній завантажуваний
    плагін, а другий перезапуск не запускає приховане виправлення
    залежностей.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що doctor кандидата
    після оновлення очищає залишки залежностей застарілих плагінів без
    виправлення postinstall з боку тестового стенда.
- `pnpm test:parallels:npm-update`
  - Запускає smoke-тест оновлення нативного пакетного встановлення на гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі й перевіряє
    встановлену версію, статус оновлення, готовність gateway і один локальний
    хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до артефакту зведення та
    статусу по кожній смузі.
  - Смуга OpenAI типово використовує `openai/gpt-5.5` для live-підтвердження ходу агента.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски в тайм-аут хоста, щоб зависання транспорту Parallels не могли
    використати решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали смуг у `/tmp/openclaw-parallels-npm-update.*`.
    Перевірте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10-15 хвилин на post-update doctor і роботу з
    оновленням пакетів на холодній гостьовій системі; це все ще нормальний стан, коли вкладений npm
    debug-журнал просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-смугами Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакетів або стану gateway гостьової системи.
  - Підтвердження після оновлення запускає звичайну поверхню вбудованих плагінів, оскільки
    фасади можливостей, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-смугу QA Matrix проти одноразового Docker-backed homeserver Tuwunel. Тільки source-checkout — пакетні встановлення не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live-смугу QA Telegram проти справжньої приватної групи, використовуючи токени бота-драйвера та SUT-бота з env.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних пулованих облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пуловані lease.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому SUT-бот має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох ботів і переконайтеся, що бот-драйвер може спостерігати трафік ботів групи.
  - Записує звіт Telegram QA, зведення та артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання драйвера до спостереженої відповіді SUT.

Live-смуги транспорту спільно використовують один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття по смугах розміщена в [Огляд QA → Покриття live-транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і він не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з пулу на базі Convex, надсилає Heartbeat
для цього lease, поки смуга працює, і звільняє lease під час завершення.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди maintainer (pool add/remove/list) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети брокера,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
секретних значень. Використовуйте `--json` для machine-readable виводу в скриптах і CI
утилітах.

Типовий контракт endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Вичерпано/можна повторити: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише секрет maintainer)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет maintainer)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активного lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового chat id Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє malformed payloads.

### Додавання каналу до QA

Архітектура й назви scenario-helper для нових адаптерів каналів описані в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті плагіна, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують shard-набір `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Не потребує справжніх ключів
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` із generated tiny plugin fixtures, а не
    реальними source APIs вбудованих плагінів. Реальні завантаження API плагінів належать до
    contract/integration suites, якими володіють плагіни.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу нативного кореневого проєкту. Це зменшує пікове RSS на навантажених машинах і не дає роботі auto-reply/розширень виснажувати непов’язані набори тестів.
    - `pnpm test --watch` усе ще використовує нативний граф проєктів кореневого `vitest.config.ts`, бо цикл спостереження з багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явні цілі файлів/каталогів через обмежені смуги, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві обмежені смуги: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні елементи графа імпортів. Зміни конфігурації/налаштування/пакунків не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний контрольний шлюз для вузької роботи. Він класифікує diff на core, тести core, розширення, тести розширень, застосунки, документацію, метадані релізу, live Docker tooling і tooling, а потім запускає відповідні команди перевірки типів, lint і guard. Він не запускає тести Vitest; викликайте `pnpm test:changed` або явний `pnpm test <target>` для доказу тестами. Підвищення версій лише в метаданих релізу запускає цільові перевірки версії/конфігурації/кореневих залежностей, із запобіжником, що відхиляє зміни пакунка поза верхньорівневим полем версії.
    - Зміни в live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth-скриптів і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, export, версії та іншої поверхні пакунка все ще використовують ширші guard-перевірки.
    - Легкі щодо імпортів unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних зон чистих утиліт спрямовуються через смугу `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важкі щодо runtime залишаються на наявних смугах.
    - Вибрані helper-файли джерел `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними сусідніми тестами в цих легких смугах, тож зміни helper уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один важкий щодо імпортів кошик не володів усім хвостом Node.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep розширень і релізний shard `agentic-plugins`. Повна Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих важких щодо Plugin/розширень наборів на реліз-кандидатах.

  </Accordion>

  <Accordion title="Покриття вбудованого runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресійні helper-тести для меж чистої маршрутизації та нормалізації.
    - Підтримуйте здоровими інтеграційні набори вбудованого runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові параметри пулу та ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Коренева UI-смуга зберігає своє налаштування `jsdom` і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх процесів Vitest у Node,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні смуги запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до stage і
      не запускає lint, перевірку типів або тести.
    - Запускайте `pnpm check:changed` явно перед передаванням роботи або push, коли вам
      потрібен розумний локальний контрольний шлюз.
    - `pnpm test:changed` типово спрямовується через дешеві обмежені смуги. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішує, що зміна harness, конфігурації, пакунка або контракту справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею worker.
    - Автомасштабування локальних worker навмисно консервативне і зменшує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають меншої шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб повторні запуски changed-mode залишалися коректними, коли змінюється
      wiring тестів.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний перегляд
      файлами, зміненими від `origin/main`.
    - Дані часу shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; include-pattern CI
      shards додають назву shard, щоб відфільтровані shards можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-import runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом кореневого проєкту для цього закоміченого
      diff і виводить wall time плюс максимальне RSS на macOS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      брудне дерево, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для
      витрат запуску й transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap профілі runner для
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із типово ввімкненою діагностикою
  - Проганяє синтетичний gateway message, memory і large-payload churn через шлях діагностичних подій
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helper-и збереження diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, синтетичні RSS-зразки залишаються в межах бюджету тиску, а глибини черг на сесію повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька смуга для подальшої роботи над регресіями стабільності, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові runtime-параметри:
  - Використовує `threads` Vitest з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних worker (CI: до 2, локально: типово 1).
  - Типово працює в тихому режимі, щоб зменшити витрати console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного виводу консолі.
- Обсяг:
  - Наскрізна поведінка Gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing node і важчі мережеві частини
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: smoke бекенду OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenClaw OpenShell через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи цей provider/model справді працює _сьогодні_ з реальними credentials?”
  - Виявляє зміни форматів provider, особливості tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики provider, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Надавайте перевагу запуску звужених підмножин замість “усього”
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API keys.
- Типово live-запуски все ще ізолюють `HOME` і копіюють config/auth material у тимчасовий тестовий home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний home directory.
- `pnpm test:live` тепер типово працює тихіше: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає gateway bootstrap logs/Bonjour chatter. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API key (залежно від provider): установіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для окремого live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу на відповідях rate limit.
- Вивід progress/heartbeat:
  - Live-набори тепер виводять progress lines у stderr, щоб довгі виклики provider були видимо активними навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб progress lines provider/gateway передавалися одразу під час live-запусків.
  - Налаштовуйте heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в мережевій частині gateway / протоколі WS / pairing: додайте `pnpm test:e2e`
- Налагодження “мій бот не працює” / збоїв, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Живі (мережеві) тести

Про живу матрицю моделей, smoke-перевірки бекенда CLI, smoke-перевірки ACP, harness сервера застосунку Codex і всі живі тести медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення, музика, відео, медіа-harness) — а також обробку облікових даних для живих запусків — див.
[Тестування живих наборів](/uk/help/testing-live). Про спеціальний контрольний список перевірки оновлень і
Plugin див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker runner-и (необов’язкові перевірки "працює в Linux")

Ці Docker runner-и поділяються на дві групи:

- Runner-и живих моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний живий файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Живі Docker runner-и типово використовують менше обмеження для smoke-перевірок, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли ви
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає живий Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ — це лише Node/Git runner для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний tarball. Functional-образ встановлює той самий tarball у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким живим, npm-install і multi-service напрямам стартувати одночасно. Якщо окремий напрям важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, а потім тримає його запущеним наодинці, доки місткість знову не стане доступною. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Runner типово виконує Docker preflight, видаляє застарілі OpenClaw E2E контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках спершу стартувати довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб package/image та облікових даних.
- `Package Acceptance` — це GitHub-native package-gate для питання "чи працює цей installable tarball як продукт?" Він визначає один кандидатний package із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E напрями проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковано за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) про контракт package/update/plugin, матрицю published-upgrade survivor, типові параметри релізу й triage збоїв.
- Перевірки збірки та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо startup до dispatch імпортує залежності package, як-от Commander, prompt UI, undici або logging до dispatch команди; він також утримує bundled Gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих холодних Gateway шляхів. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Зворотна сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини метаданих shipped-package: пропущені приватні QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у tarball-derived git fixture, відсутній збережений `update.channel`, legacy розташування plugin install-record, відсутнє збереження marketplace install-record і міграцію метаданих конфігурації під час `plugins update`. Для package після `2026.4.25` ці шляхи є строгими помилками.
- Runner-и container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` завантажують один або кілька реальних контейнерів і перевіряють високорівневі інтеграційні шляхи.

Docker runner-и живих моделей також bind-mount-ять лише потрібні домівки автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домівку контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни auth-сховища хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-перевірка прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-перевірка бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-перевірка harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-агент: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-перевірка спостережуваності: `pnpm qa:otel:smoke` — це приватна QA-ланка для checkout вихідного коду. Вона навмисно не входить до ланок Docker-релізу пакета, бо npm tarball не містить QA Lab.
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-перевірка onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з env-ref і типово Telegram, запускає doctor і виконує один мокований хід агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-перевірка перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакетного `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на пакетний `stable` і перевіряє статус оновлення.
- Smoke-перевірка збереження після upgrade: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналів, allowlist-ами Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Вона запускає оновлення пакета та неінтерактивний doctor без live-ключів provider або channel, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Smoke-перевірка збереження після опублікованого upgrade: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей baseline вбудованим рецептом команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до candidate tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети RPC-статусу. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть aggregate scheduler розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` і розгорніть фікстури у формі issue через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; Package Acceptance надає це як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Smoke-перевірка runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime context і repair через doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke-перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers, а не зависає. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть build на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-перевірка Docker installer: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache для своїх root-, update- і direct-npm-контейнерів. Smoke-перевірка update типово використовує npm `latest` як stable baseline перед upgrade до candidate tarball. Перевизначте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` локально або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки installer без root зберігають ізольований npm cache, щоб root-owned cache entries не маскували user-local install behavior. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-перевірка CLI для видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ root Dockerfile, засіває двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого workspace. Повторно використайте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-перевірка Browser CDP snapshot: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URL посилань, clickables, promoted курсором, iframe refs і frame metadata.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) проганяє мокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema і перевіряє, що raw detail з’являється в логах Gateway.
- MCP-міст каналів (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP tools Pi bundle (реальний stdio MCP server + smoke-перевірка allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron/subagent (реальний Gateway + teardown дочірнього stdio MCP після ізольованих cron і one-shot subagent запусків): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-перевірка install/update для локального шляху, `file:`, npm registry з hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates і enable/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує hermetic локальний fixture server ClawHub.
- Smoke-перевірка незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-перевірка metadata reload config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює smoke-перевірку install/update для локального шляху, `file:`, npm registry з hoisted dependencies, git moving refs, фікстур ClawHub, marketplace updates і enable/inspect Claude-bundle. `pnpm test:docker:plugin-update` охоплює поведінку unchanged update для встановлених plugins.

Щоб вручну попередньо зібрати та повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` указує на віддалений спільний образ, скрипти підтягують його, якщо він ще не локальний. QR- і installer Docker tests зберігають власні Dockerfiles, бо вони перевіряють поведінку package/install, а не спільний runtime зібраної app.

Docker runners для live-model також bind-mount-ять поточний checkout read-only і
переносять його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно запускає Vitest проти вашого точного локального source/config.
Етап staging пропускає великі локальні-only caches і outputs build застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для app `.build` або
директорії output Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні Telegram/Discord/тощо channel workers усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage з цієї Docker-ланки.
`test:docker:openwebui` — це вищорівнева smoke-перевірка сумісності: вона запускає
контейнер OpenClaw gateway з увімкненими OpenAI-сумісними HTTP endpoints,
запускає pinned контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може мати потребу підтягнути
образ Open WebUI, а Open WebUI може мати потребу завершити власний cold-start setup.
Ця ланка очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає засіяний Gateway
container, запускає другий контейнер, який породжує `openclaw mcp serve`, потім
перевіряє routed conversation discovery, читання transcript, attachment metadata,
поведінку live event queue, маршрутизацію outbound send і Claude-style channel +
permission notifications через реальний stdio MCP bridge. Перевірка notification
безпосередньо інспектує raw stdio MCP frames, тож smoke перевіряє те, що
bridge фактично emitting, а не лише те, що випадково поверхнює конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає repo Docker image, запускає реальний stdio MCP probe server
усередині контейнера, materializes цей server через runtime вбудованого Pi bundle
MCP, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` фільтрують їх.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway із реальним stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, а потім перевіряє,
що дочірній MCP process завершується після кожного запуску.

Ручна plain-language thread smoke-перевірка ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для regression/debug workflows. Він може знову знадобитися для валідації routing thread ACP, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагувань документів: `pnpm check:docs`.
Запускайте повну валідацію anchor Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (кейс: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + примусова автентифікація): `src/gateway/gateway.test.ts` (кейс: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock виклику інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють зв’язування сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/аргументів?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals мають спершу залишатися детермінованими:

- Запускач сценаріїв із mock провайдерами для перевірки викликів інструментів + порядку, читання файлів skill і зв’язування сесії.
- Невеликий набір сценаріїв, зосереджених на skill (використати чи уникнути, gating, prompt injection).
- Необов’язкові live evals (opt-in, керовані env) лише після появи безпечного для CI набору.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
контракту інтерфейсу. Вони проходять по всіх виявлених plugins і запускають набір
перевірок форми та поведінки. Типова unit-ланка `pnpm test` навмисно
пропускає ці спільні seam і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, назва, можливості)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка зв’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID гілки
- **directory** - API каталогу/реєстру
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
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів plugin-sdk або subpaths
- Після додавання чи зміни каналу або provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub провайдер або зафіксуйте точне перетворення форми запиту)
- Якщо це за своєю природою лише live-only (обмеження швидкості, політики автентифікації), тримайте live-тест вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить баг:
  - баг перетворення/відтворення запиту провайдера → прямий тест моделей
  - баг pipeline сесії/історії/інструментів gateway → gateway live smoke або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-segment відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було мовчки пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
