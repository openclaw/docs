---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-27T17:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37dbd2dd294a4a97850cd9a3ff13bb680e612380115fc660d0b8e0d8dbf1c5e0
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live transport lanes)** задокументований окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Матричний QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний transport plugin, який використовується сценаріями на основі репозиторію.

Ця сторінка охоплює запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) містить конкретні виклики `qa` і посилається назад на наведені вище довідкові матеріали.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + Gateway tool/image probes): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Для кожної вибраної моделі тепер запускається текстовий хід плюс невелика перевірка у стилі читання файла.
    Моделі, чиї метадані вказують на вхід `image`, також запускають маленький хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow із
    `include_live_suites: true`, що включає окремі матричні Docker-job для live-моделей, розбиті за провайдером.
  - Для точкових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів у `scripts/ci-hydrate-live-auth.sh`,
    а також у `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    виклики зі schedule/release.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення із зображенням
    проходять через native plugin binding, а не через ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness app-server Codex, що належить plugin,
    перевіряє `/codex status` і `/codex models`, а також за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для точкової перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершиться після перевірки sub-agent, якщо лише не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke-команда порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова opt-in перевірка «belt-and-suspenders» для поверхні команди порятунку message-channel.
    Вона виконує `/crestodian status`, ставить у чергу стійку зміну
    моделі, відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на типізований запис
    конфігурації з audit.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, направляє голий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    валідує конфігурацію і перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke перевірка вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, запустіть
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6, а
  транскрипт помічника зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч із основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
через ручний dispatch з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch із mock parity gate, live Matrix lane,
керованою Convex live Telegram lane та керованою Convex live Discord lane як
паралельними job. Заплановані перевірки QA і release явно передають Matrix `--profile fast`,
тоді як значення за замовчуванням для Matrix CLI і ручного введення workflow залишається
`all`; ручний dispatch може розбивати `all` на job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
швидкі Matrix і Telegram lane перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на основі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway workers. Для `qa-channel` типовим є concurrency 4 (обмежене
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування
    кількості workers або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і протокольних моків, не замінюючи lane
    `mock-openai`, що знає про сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, які практично використовувати для гостьової системи:
    ключі провайдерів на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`,
    якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA report + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний onboarding із ключем OpenAI API, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    інсталяції з пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke зібраного застосунку для транскриптів
    вбудованого runtime context. Він перевіряє, що прихований runtime context OpenClaw
    зберігається як недисплейне кастомне повідомлення, а не просочується у видимий хід користувача,
    потім засіває зламаний JSONL сесії з ураженим станом і перевіряє, що
    `openclaw doctor --fix` переписує його в активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидатний пакет OpenClaw у Docker, запускає onboarding
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати визначений локальний tarball замість
    встановлення з реєстру.
  - Використовує ті самі змінні середовища облікових даних Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret Convex присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions також надає цей lane як ручний workflow для maintainer
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex для CI.
- GitHub Actions також надає `Package Acceptance` для побічного продуктового підтвердження
  щодо одного кандидатного пакета. Він приймає довірений ref, опубліковану npm-специфікацію,
  HTTPS tarball URL плюс SHA-256 або tarball-артефакт з іншого запуску, вивантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний планувальник Docker E2E з профілями lane smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити workflow Telegram QA
  проти того самого артефакту `package-under-test`.
  - Останнє бета-підтвердження продукту:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Підтвердження точного URL tarball вимагає digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Підтвердження через артефакт завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugin через редагування
    конфігурації.
  - Перевіряє, що виявлення налаштування не встановлює runtime-залежності
    plugin, які ще не налаштовані, що перший запуск налаштованого Gateway або doctor
    встановлює runtime-залежності кожного вбудованого plugin на вимогу, і що другий
    перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor кандидатної версії відновлює runtime-залежності вбудованих channel
    без postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke-тест оновлення встановленого пакета в гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі й перевіряє
    встановлену версію, статус оновлення, готовність gateway і один локальний
    хід агента.
  - Під час ітерації над однією гостьовою системою використовуйте `--platform macos`, `--platform windows` або `--platform linux`.
    Для підсумкового артефакту та статусу для кожного lane використовуйте `--json`.
  - Lane OpenAI за замовчуванням використовує `openai/gpt-5.5` для підтвердження live-ходу агента.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в timeout на хості, щоб зависання транспорту Parallels
    не з’їдало решту тестового вікна:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/відновлення
    runtime-залежностей на «холодній» гостьовій системі; це все ще є нормальним станом, якщо вкладений
    журнал npm debug продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke lane Parallels
    для macOS, Windows або Linux. Вони використовують спільний стан VM і можуть конфліктувати під час
    відновлення snapshot, роздачі пакета або стану guest gateway.
  - Підтвердження після оновлення запускає звичайну поверхню вбудованих plugin, оскільки
    такі capability facades, як мовлення, генерація зображень і
    розуміння медіа, завантажуються через вбудовані runtime API, навіть якщо сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти тимчасового homeserver Tuwunel на базі Docker. Лише для checkout вихідного коду — встановлені пакети не постачають `qa-lab`.
  - Повний CLI, каталог profile/scenario, змінні середовища та структура артефактів: [Матричний QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи, використовуючи токени бота driver і SUT з env.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулінгові оренди.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Потрібні два різні боти в одній приватній групі, причому бот SUT має мати Telegram-ім’я користувача.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує Telegram QA report, summary і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання з боку driver до спостережуваної відповіді SUT.

Live transport lanes мають спільний стандартний контракт, щоб нові transport не дрейфували; матриця покриття для кожного lane міститься в [Огляд QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і він не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли для
`openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає
Heartbeat для цієї оренди, поки lane виконується, і звільняє оренду під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Потрібні змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI типово `ci`, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий ідентифікатор трасування)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

У звичайному режимі роботи `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди maintainer (додавання/видалення/список пулу) вимагають
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без виведення
секретних значень. Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

Контракт endpoint за замовчуванням (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання channel до QA

Архітектура та назви scenario-helper для нових channel adapters описані в [Огляд QA → Додавання channel](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у manifest plugin, підключити як `openclaw qa <runner>` і написати сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: ненаправлені запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфігурації для кожного проєкту для паралельного планування
- Файли: core/unit-інвентарі в `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit-тести запускаються в окремому шарді `unit-ui`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (auth Gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, шарди та lane з обмеженим обсягом">

    - Ненаправлений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дозволяє роботі auto-reply/extension блокувати не пов’язані набори.
    - `pnpm test --watch` і далі використовує нативний граф проєктів root `vitest.config.ts`, оскільки цикл watch з багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через lane з обмеженим обсягом, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не оплачує повну вартість запуску root project.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві lane з обмеженим обсягом: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення з вихідним кодом і локальні залежні елементи графа імпортів. Зміни config/setup/package не запускають широкі тести, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний gate перевірки для вузьких змін. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для підтвердження тестами викликайте `pnpm test:changed` або явний `pnpm test <target>`. Під час зміни лише release metadata version bumps запускають цільові перевірки version/config/root-dependency, із guard, який відхиляє зміни package поза полем версії верхнього рівня.
    - Зміни ACP harness для live Docker запускають сфокусовані перевірки: shell syntax для скриптів auth live Docker і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежено `scripts["test:docker:live-*"]`; зміни залежностей, exports, версій та інших поверхонь package і далі використовують ширші guard.
    - Unit-тести з легкими імпортами з agents, commands, plugins, хелперів auto-reply, `plugin-sdk` та схожих чисто утилітарних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних lane.
    - Вибрані вихідні файли-хелпери `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких lane, тож редагування хелперів не змушує повторно запускати весь важкий набір для цього каталогу.
    - `auto-reply` має окремі бакети для top-level core helper, top-level integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. У CI піддерево reply додатково ділиться на шарди agent-runner, dispatch і commands/state-routing, щоб один бакет із важкими імпортами не контролював увесь хвіст Node.

  </Accordion>

  <Accordion title="Покриття вбудованого раннера">

    - Коли ви змінюєте входи виявлення message-tool або runtime
      context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії хелперів для чистих меж
      маршрутизації та нормалізації.
    - Підтримуйте вбудовані integration-набори раннера в здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id та поведінка Compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише на рівні хелперів
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення Vitest pool та ізоляції">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований раннер у root project, e2e та live-конфігураціях.
    - Root UI lane зберігає своє налаштування `jsdom` та optimizer, але також працює на
      спільному неізольованому раннері.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти з типовою
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lane запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staging і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли
      вам потрібен розумний локальний gate перевірки.
    - `pnpm test:changed` типово маршрутизує через дешеві lane з обмеженим обсягом. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що редагування harness, config, package або контракту справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Автомасштабування локальних workers навмисно є консервативним і знижує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється
      підключення тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту, а також
      вивід деталізації імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий профільований перегляд файлами,
      зміненими від `origin/main`.
    - Дані про час виконання shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски цілих конфігурацій використовують шлях до конфігурації як ключ; shard CI
      з include-pattern додають ім’я shard, щоб відфільтровані shard можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на імпорти під час запуску,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam безпосередньо, замість глибокого імпорту runtime-хелперів лише
      для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом root-project для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для
      накладних витрат запуску та трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap раннера для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою типово
  - Проганяє синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запит до `diagnostics.stability` через WS RPC Gateway
  - Покриває хелпери збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS лишаються в межах бюджету тиску, а глибина черг для кожної сесії повертається до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальших дій щодо регресій стабільності, а не заміна повному набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і в решті репозиторію.
  - Використовує адаптивну кількість workers (CI: до 2, локально: типово 1).
  - Типово працює в silent mode, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing Node і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: smoke-тест бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Виконує бекенд OpenShell OpenClaw через реальний `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не є частиною типового запуску `pnpm test:e2e`
  - Потрібен локальний CLI `openshell` плюс справний Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест при ручному запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний двійковий файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику tool, проблем auth і поведінки rate limit
- Очікування:
  - Не є CI-стабільним за задумом (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підтягують `~/.profile`, щоб підхопити відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінювати ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але пригнічує додаткове повідомлення `~/.profile` і вимикає журнали bootstrap gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (залежно від провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або використайте перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів було помітно видно активними, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/gateway передаються одразу під час live-запусків.
  - Налаштовуйте Heartbeat для прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато що змінили)
- Зміни в networking gateway / протоколі WS / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / специфічних для провайдера збоїв / виклику tool: запускайте звужений `pnpm test:live`

## Live (які звертаються до мережі) тести

Для live-матриці моделей, smoke-тестів бекенда CLI, smoke-тестів ACP, harness
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві категорії:

- Docker-ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл за ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочий простір (і підтягують `~/.profile`, якщо він змонтований). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово використовують менше обмеження для smoke-прогону, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  ви явно хочете більший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише Node/Git-ранер для lane встановлення/оновлення/залежностей plugin; ці lane монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для lane функціональності зібраного застосунку. Визначення Docker-lane живуть у `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким live-, npm-install- і multi-service lane запускатися одночасно. Якщо один lane важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, а потім триматиме його окремо, доки знову не з’явиться доступна ємність. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Ранер типово виконує Docker preflight, прибирає застарілі контейнери OpenClaw E2E, друкує статус кожні 30 секунд, зберігає час успішних lane у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані, щоб у наступних запусках довші lane стартували першими. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести план CI для вибраних lane, потреб у package/image та облікових даних.
- `Package Acceptance` — це вбудований у GitHub gate пакетів для перевірки «чи працює цей tarball, який можна встановити, як продукт?». Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, вивантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-lane проти саме цього tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені workflow/скрипти harness, тоді як `package_ref` вибирає вихідний commit/branch/tag для пакування, коли `source=ref`; це дозволяє поточній логіці acceptance перевіряти старі довірені commits. Профілі впорядковані за шириною охоплення: `smoke` — це швидке встановлення/channel/agent плюс gateway/config, `package` — це контракт package/update/plugin і типова нативна заміна більшості покриття package/update у Parallels, `product` додає MCP channels, cron/subagent cleanup, вебпошук OpenAI і OpenWebUI, а `full` запускає Docker-chunk шляху release з OpenWebUI. Перевірка релізу запускає власний package delta (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, оскільки Docker-chunk шляху release уже покривають lane package/update/plugin, що перетинаються. Команди для точкового повторного запуску Docker у GitHub, згенеровані з артефактів, включають попередній артефакт пакета і підготовлені вхідні дані образів, коли вони доступні, тож lane, що впали, можуть уникнути повторного збирання пакета та образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичний граф зібраного коду від `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо імпорти старту до dispatch підтягують залежності package, такі як Commander, prompt UI, undici або logging, до dispatch команди. Smoke-тести пакетованого CLI також покривають root help, onboard help, doctor help, status, config schema і команду model-list.
- Legacy-сумісність `Package Acceptance` обмежена версією `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини в метаданих shipped-package: пропущені приватні записи інвентаря QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, похідній від tarball, відсутній збережений `update.channel`, застарілі розташування записів встановлення plugin, відсутнє збереження записів встановлення marketplace і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Smoke-ранери контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-mount лише потрібні домівки CLI auth (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у сховищі auth на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-тест бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-тест спостережуваності: `pnpm qa:otel:smoke` — це приватний lane QA для checkout вихідного коду. Він навмисно не входить до Docker-lane пакетного релізу, оскільки npm tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює runtime-залежності активованих plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте повторне збирання на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте channel через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke-тест runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context у транскрипті, а також відновлення через doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих image-провайдерів, а не зависає. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збирання на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-тест Docker-інсталятора: `bash scripts/test-install-sh-docker.sh` використовує один кеш npm для своїх контейнерів root, update і direct-npm. Smoke-тест оновлення типово використовує npm `latest` як стабільну базову версію перед оновленням до tarball-кандидата. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke у GitHub. Нерутові перевірки інсталятора зберігають ізольований кеш npm, щоб записи кешу, створені root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke у CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-тест CLI видалення спільного робочого простору агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає root Dockerfile image, засіває двох агентів з одним робочим простором в ізольованому home контейнера, запускає `agents delete --json` і перевіряє валідний JSON та збереження робочого простору. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест browser CDP snapshot: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium з raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshot покривають URL посилань, елементи для кліку, підняті курсором, iframe ref та метадані frame.
- Мінімальна reasoning-регресія для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера та перевіряє, що необроблена деталь з’являється в журналах Gateway.
- Міст MCP channel (засіяний Gateway + stdio-міст + smoke-тест raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP-сервер + smoke-тест allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте типовий package через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke-тест незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованих plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker-образ раннера, один раз збирає і пакує OpenClaw на хості, а потім монтує цей tarball у кожен Linux-сценарій встановлення. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте повторне збирання на хості після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегатор і chunk `bundled-channels` для шляху release попередньо пакують цей tarball один раз, а потім розбивають перевірки вбудованих channel на незалежні lane, включно з окремими lane оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Застарілий chunk `plugins-integrations` залишається агрегованим псевдонімом для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю channel під час прямого запуску lane bundled, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення runtime-залежностей через doctor.
- Під час ітерації звужуйте runtime-залежності вбудованих plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати та повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для окремих наборів, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, і далі мають пріоритет, якщо їх установлено. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти витягують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker-ранери live-моделей також bind-mount-ять поточний checkout у режимі лише читання та
переносять його в тимчасовий workdir усередині контейнера. Це робить runtime
образ компактним, але водночас дозволяє запускати Vitest точно на вашому локальному source/config.
Під час перенесення пропускаються великі локальні кеші та результати збирання застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
специфічних для машини артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe gateway не запускали
реальні workers channel Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити gateway
live-покриття з цього Docker-lane.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає контейнер Open WebUI із зафіксованою версією проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися витягнути
образ Open WebUI, а самому Open WebUI — завершити власне налаштування холодного старту.
Для цього lane потрібен придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — це основний спосіб надати його в Docker-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає засіяний
контейнер Gateway, запускає другий контейнер, що піднімає `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідних надсилань і сповіщення channel +
дозволів у стилі Claude через реальний stdio MCP-міст. Перевірка сповіщень
переглядає безпосередньо raw stdio MCP-кадри, тож smoke-тест перевіряє те, що
міст справді видає, а не лише те, що випадково відображає конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live-ключа
моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe-сервер
усередині контейнера, матеріалізує цей сервер через runtime вбудованого пакета Pi
MCP, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live-ключа
моделі. Він запускає засіяний Gateway з реальним stdio MCP probe-сервером, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke-тест ACP plain-language thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflow регресій/налагодження. Він може знову знадобитися для перевірки маршрутизації потоків ACP, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підтягується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підхоплені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування auth зовнішнього CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Каталоги/файли auth зовнішнього CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне повторне збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані походять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt для nonce-перевірки, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити зафіксований тег образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик tool через Gateway (змоканий OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, примусово записує config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Змоканий виклик tool через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють підключення сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills наведені в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок tool, перенесення історії сесії та межі sandbox.

Майбутні оцінювання насамперед мають залишатися детермінованими:

- Ранер сценаріїв із мок-провайдерами для перевірки викликів tool + порядку, читання skill-файлів і підключення сесії.
- Невеликий набір сценаріїв, сфокусованих на Skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-оцінювання (opt-in, із керуванням через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони перебирають усі виявлені plugin і запускають набір
перевірок форми та поведінки. Типовий unit-lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; явно запускайте контрактні команди,
коли змінюєте спільні поверхні channel або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Застосування групової політики

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма registry plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/добір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після змін експорту або підшляхів plugin-sdk
- Після додавання або зміни channel чи plugin провайдера
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (мок/заглушка провайдера або захоплення точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який ловить баг:
  - баг перетворення/відтворення запиту провайдера → тест прямих моделей
  - баг у pipeline сесії/історії/tool Gateway → Gateway live smoke або безпечний для CI mock-тест Gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef із метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову цільову родину SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Live-тестування](/uk/help/testing-live)
- [CI](/uk/ci)
