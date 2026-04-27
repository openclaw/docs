---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway і агентів
summary: 'Набір для тестування: unit/e2e/live набори, Docker-раннери та що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-27T10:59:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b0afc7b8aa48f08b70a95666b030eb47942327498e7a88bee45ac027aa5ae3e
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-раннерів. Цей документ — посібник "як ми тестуємо":

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл watch для Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extensions/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку надавайте перевагу таргетованим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + probes інструментів/image Gateway): `pnpm test:live`
- Тихий запуск одного live-файла: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker sweep live-моделей: `pnpm test:docker:live-models`
  - Для кожної вибраної моделі тепер виконується текстовий хід плюс невеликий probe у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують маленький image-хід.
    Вимкніть додаткові probes через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі matrix jobs Docker live-моделей,
    шардовані за провайдером.
  - Для точкових повторних запусків у CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal secrets провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-lane проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і image attachment
    проходять через native plugin binding, а не через ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness app-server Codex, що належить Plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням також виконує probes image,
    Cron MCP, sub-agent і Guardian. Вимкніть probe sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої
    app-server Codex. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершиться після probe sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Опціональна belt-and-suspenders перевірка поверхні команди rescue для message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну
    зміну моделі, відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, направляє голий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    валідує конфігурацію та перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON показує Moonshot/K2.6 і що
  транскрипт помічника зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.
</Tip>

## QA-специфічні раннери

Ці команди використовуються поряд з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається на відповідних PR
і з ручного dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch з mock parity gate, live Matrix lane,
live Telegram lane під керуванням Convex і live Discord lane під керуванням Convex
як паралельні jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як CLI Matrix і типовий вхід ручного workflow залишаються `all`; ручний dispatch
може шардувати `all` на jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
швидкі lane Matrix і Telegram перед погодженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на основі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    workers Gateway. `qa-channel` типово має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо хоч один сценарій не вдався. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без завершення з кодом помилки.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixtures і protocol-mock без заміни сценарно-орієнтованого
    lane `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски прокидають підтримувані QA-входи автентифікації, практичні для guest:
    ключі провайдерів через env, шлях до конфігурації QA live provider і `CODEX_HOME`,
    якщо він присутній.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для operator-style роботи з QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, виконує неінтерактивний onboarding з ключем API OpenAI, налаштовує за замовчуванням
    Telegram, перевіряє, що ввімкнення plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    package-install з Discord.
- `pnpm test:docker:session-runtime-context`
  - Виконує детермінований Docker smoke для built-app щодо transcript embedded runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    custom message, що не відображається, замість витоку у видимий хід користувача,
    потім підкладає пошкоджений JSONL сесії та перевіряє, що
    `openclaw doctor --fix` переписує його в активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидатний пакет OpenClaw у Docker, виконує onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує live QA lane Telegram
    з цим встановленим пакетом як SUT Gateway.
  - Типово використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати локальний tarball, а не
    встановлення з реєстру.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions також надає цей lane як ручний workflow для maintainer
    `NPM Telegram Beta E2E`. Він не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для побічного product proof
  проти одного кандидатного пакета. Він приймає trusted ref, опубліковану npm-spec,
  URL HTTPS tarball плюс SHA-256 або артефакт tarball з іншого запуску,
  завантажує нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний планувальник Docker E2E з профілями lane smoke, package, product, full або custom. Установіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  workflow QA Telegram проти того самого артефакту `package-under-test`.
  - Product proof для останньої beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Product proof для точного URL tarball потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Product proof через артефакт завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/плагіни через
    редагування конфігурації.
  - Перевіряє, що виявлення під час налаштування залишає неналаштовані runtime dependencies
    плагінів відсутніми, що перший налаштований запуск Gateway або doctor встановлює runtime dependencies
    кожного вбудованого плагіна на вимогу, і що другий перезапуск не перевстановлює
    залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базу, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що
    post-update doctor кандидата відновлює runtime dependencies вбудованих каналів без
    side postinstall repair з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення packaged-install у гостьових системах Parallels. Для кожної
    вибраної платформи спочатку встановлюється запитаний базовий пакет, а потім у тій самій гостьовій системі
    запускається встановлена команда `openclaw update` і перевіряються встановлена
    версія, статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`, коли
    ітеруєтесь лише над однією гостьовою системою. Використовуйте `--json` для шляху до summary artifact
    і статусу кожного lane.
  - OpenAI lane типово використовує `openai/gpt-5.5` для доказу live agent-turn.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels
    не з’їдали решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/runtime
    dependency repair на холодній гостьовій системі; це все ще нормальний стан, якщо вкладений
    npm debug log продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke lanes Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати через
    відновлення snapshot, роздачу пакетів або стан gateway у гостьовій системі.
  - Post-update proof запускає звичайну поверхню вбудованих плагінів, оскільки
    capability facades, такі як speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам
    agent turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост сьогодні призначений лише для репозиторію/розробки. Встановлені пакети OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkouts репозиторію напряму завантажують вбудований runner; окремий крок встановлення плагіна не потрібен.
  - Надає три тимчасових користувачі Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним плагіном Matrix як транспортом SUT.
  - Типово використовує `--profile all`. Використовуйте `--profile fast --fail-fast` для критичного до релізу transport proof або `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` при шардингу повного каталогу.
  - Типово використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки цей lane локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, summary, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
  - Типово показує прогрес і примусово застосовує жорсткий timeout запуску через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` налаштовує тихі вікна негативної перевірки без відповіді, а cleanup обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, причому збої містять recovery-команду `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи з використанням токенів бота driver і бота SUT із env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на pooled leases.
  - Завершується з ненульовим кодом, якщо хоч один сценарій не вдався. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без завершення з кодом помилки.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати username у Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, summary і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live transport lanes використовують один стандартний контракт, щоб нові транспорти не відхилялися:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live transport.

| Lane     | Canary | Gating згадок | Блокування списком дозволених | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help | Реєстрація native-команд |
| -------- | ------ | ------------- | ----------------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | ------------ | ------------------------ |
| Matrix   | x      | x             | x                             | x                         | x                             | x                          | x               | x                          |              |                          |
| Telegram | x      | x             |                               |                           |                               |                            |                 |                            | x            |                          |
| Discord  | x      | x             |                               |                           |                               |                            |                 |                            |              | x                        |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну lease із пулу на базі Convex, надсилає Heartbeat
для цієї lease під час роботи lane і звільняє lease під час завершення.

Базовий scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення з env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL Convex через `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайній роботі має використовувати `https://`.

Адміністративні команди maintainer (add/remove/list у пулі) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
endpoint prefix, HTTP timeout і доступність admin/list, не виводячи
значення секретів. Використовуйте `--json` для machine-readable виводу в скриптах і CI-утилітах.

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
  - Захист активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим chat id Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA вимагає рівно двох речей:

1. Адаптер транспорту для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab`
може керувати цим потоком.

`qa-lab` керує спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням набору
- concurrency workers
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Плагіни runner відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляються специфічні для транспорту reset або cleanup

Мінімальний поріг прийняття для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Залишайте специфічну для транспорту механіку всередині плагіна runner або channel harness.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючу кореневу команду.
   Плагіни runner мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; ліниве виконання CLI і runner має залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic helpers сценаріїв для нових сценаріїв.
7. Зберігайте працездатність наявних compatibility aliases, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення є суворим:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, залишайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більш ніж один канал, додайте generic helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно зазначайте це в контракті сценарію.

Бажані назви generic helper для нових сценаріїв:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Compatibility aliases залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати назви generic helper.
Compatibility aliases існують, щоб уникнути міграції в стилі flag day, а не як модель для
написання нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як “зростання реалізму” (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір шардованих конфігурацій `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit-тести запускаються в окремому шарді `unit-ui`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускаються в CI
  - Реальні ключі не потрібні
  - Мають бути швидкими та стабільними

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped lanes">

    - Нетаргетований `pnpm test` запускає дванадцять менших шардованих конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension блокувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує native root `vitest.config.ts` project graph, оскільки multi-shard watch loop є непрактичним.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні targets файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні source mappings і локальні залежні елементи import graph. Зміни config/setup/package не запускають широке тестування, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний smart local check gate для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для доказу тестами викликайте `pnpm test:changed` або явний `pnpm test <target>`. Version bumps, що містять лише release metadata, запускають таргетовані перевірки version/config/root-dependency із guard, який відхиляє зміни package поза полем version верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell syntax для live Docker auth scripts і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependencies, exports, version та інших package-surface усе ще використовують ширші guard-перевірки.
    - Легкі за imports unit-тести з agents, commands, plugins, helper `auto-reply`, `plugin-sdk` та подібних чистих utility-зон маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих легких lanes, тож зміни helper не змушують повторно запускати повний важкий набір для цього каталогу.
    - `auto-reply` має окремі кошики для helper верхнього рівня core, integration-тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. У CI піддерево reply додатково ділиться на шарди agent-runner, dispatch і commands/state-routing, щоб один важкий за imports кошик не контролював увесь хвіст Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте входи виявлення message-tool або runtime context Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та
      нормалізації.
    - Підтримуйте здоровими integration-набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення pool та isolation у Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, конфігураціях e2e і live.
    - Кореневий UI lane зберігає свої `jsdom` setup і optimizer, але теж запускається на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-
      процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно індексує відформатовані файли і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Автоматичне масштабування локальних workers навмисно консервативне й зменшує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних запусків
      Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/файли конфігурації як
      `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється зв’язування тестів.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість imports, а також
      вивід деталізації imports.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний перегляд
      файлами, зміненими відносно `origin/main`.
    - Дані часу виконання шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; шардовані запуски CI з include-pattern
      додають назву шарду, щоб відфільтровані шарди можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на imports під час запуску,
      тримайте важкі dependencies за вузькою локальною межею `*.runtime.ts` і
      напряму мокайте цю межу замість deep-import runtime helpers лише
      для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з native шляхом root-project для цього зафіксованого
      diff і виводить wall time та macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU main-thread для
      накладних витрат запуску й трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap для
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою за замовчуванням діагностикою
  - Пропускає синтетичне churn повідомлень gateway, пам’яті та великих payload через діагностичний event path
  - Виконує запити до `diagnostics.stability` через RPC WebSocket Gateway
  - Покриває helper-и збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS залишаються в межах бюджету навантаження, а глибина черг на сесію повертається до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих плагінів у `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує adaptive workers (CI: до 2, локально: типово 1).
  - Типово запускається в silent mode, щоб зменшити накладні витрати на console I/O.
- Корисні override-и:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість workers (не більше 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка багатьох екземплярів gateway
  - Поверхні WebSocket/HTTP, pairing Node і важче мережеве навантаження
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільніше)

### E2E: smoke backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` і SSH exec
  - Перевіряє поведінку remote-canonical файлової системи через bridge fs sandbox
- Очікування:
  - Лише за запитом; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і справного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні override-и:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб вказати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих плагінів у `extensions/`
- Типове значення: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?”
  - Виявлення змін формату провайдера, особливостей tool-calling, проблем автентифікації та поведінки rate limit
- Очікування:
  - Не є CI-стабільним за задумом (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не “все”
- Live-запуски підвантажують `~/.profile`, щоб підхопити відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-fixtures не могли змінювати ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово використовує тихіший режим: він залишає вивід прогресу `[live] ...`, але прибирає додаткове повідомлення про `~/.profile` і приглушує журнали bootstrap Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (залежно від провайдера): установіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб тривалі виклики провайдерів були помітно активними, навіть коли перехоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/Gateway надходять одразу під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змін було багато)
- Торкаєтеся мережевої взаємодії gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “мій бот не працює” / специфічні збої провайдера / tool calling: запустіть звужений `pnpm test:live`

## Live-тести, що торкаються мережі

Для live matrix моделей, smoke-тестів CLI backend, smoke ACP, harness
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), а також обробки облікових даних для live-запусків, див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker-раннери (необов’язкові перевірки "працює в Linux")

Ці Docker-раннери поділяються на дві групи:

- Раннери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл за ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoints — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-раннери типово використовують меншу межу smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Порожній образ — це лише Node/Git runner для lane встановлення/оновлення/залежностей плагінів; ці lanes монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для lanes функціональності built-app. Визначення Docker lanes знаходяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як resource caps не дають усім важким live-, npm-install- і multi-service lanes запускатися одночасно. Якщо один lane важчий за активні обмеження, scheduler усе одно може запустити його, коли pool порожній, а потім тримає його єдиним активним, доки знову не з’явиться ємність. Типові значення — 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Runner типово виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, друкує статус кожні 30 секунд, зберігає час виконання успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані, щоб у наступних запусках стартувати з довших lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений manifest lanes без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести CI-план для вибраних lanes, потреб package/image і облікових даних.
- `Package Acceptance` — це нативний для GitHub gate пакета для питання "чи працює цей tarball, придатний до встановлення, як продукт?" Він розв’язує один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E lanes проти саме цього tarball, а не перепаковує вибраний ref. `workflow_ref` вибирає довірені workflow/harness scripts, а `package_ref` — вихідний commit/branch/tag для пакування, коли `source=ref`; це дозволяє поточній логіці acceptance перевіряти старіші довірені commits. Профілі впорядковані за широтою: `smoke` — це швидкий install/channel/agent плюс gateway/config, `package` — контракт package/update/plugin і типова native-заміна більшості покриття package/update у Parallels, `product` додає MCP channels, cron/subagent cleanup, вебпошук OpenAI і OpenWebUI, а `full` запускає Docker-chunks релізного шляху з OpenWebUI. Перевірка релізу запускає профіль `package` для цільового ref з увімкненим Telegram package QA. Згенеровані з артефактів команди точкового повторного запуску GitHub Docker включають попередній артефакт пакета та prepared image inputs, коли вони доступні, тож збоїлі lanes можуть уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичний граф зібраних залежностей від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо імпорти залежностей пакета на етапі запуску до dispatch команди, таких як Commander, prompt UI, undici або logging, відбуваються до dispatch команди. Smoke перевірка packaged CLI також покриває help кореня, help onboard, help doctor, status, schema config і команду model-list.
- Сумісність зі застарілою поведінкою в `Package Acceptance` обмежена версією `2026.4.25` (включно з `2026.4.25-beta.*`). До цього порогу harness толерує лише прогалини в метаданих shipped-package: пропущені приватні записи inventory QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git fixture, похідному від tarball, відсутній збережений `update.channel`, застарілі місця записів встановлення plugin, відсутнє збереження записів встановлення marketplace і міграцію метаданих config під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи вважаються строгими збоями.
- Container smoke-раннери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-раннери live-моделей також bind-mount лише потрібні домівки автентифікації CLI (або всі підтримувані, якщо запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observability: `pnpm qa:otel:smoke` — це приватний lane перевірки вихідного checkout QA. Він навмисно не входить до package Docker lanes для релізу, оскільки npm tarball не містить QA Lab.
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з env-ref і типово Telegram, перевіряє, що doctor відновлює runtime deps активованих плагінів, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть хостове збирання через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє, що збережений канал і post-update робота plugin функціонують, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context у transcript, а також відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудовані image-провайдери замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збирання на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із уже зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує один спільний npm cache для своїх контейнерів root, update і direct-npm. Smoke оновлення типово використовує npm `latest` як стабільну базу перед оновленням до кандидатного tarball. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки installer без root використовують окремий ізольований npm cache, щоб записи cache, що належать root, не маскували поведінку встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними перезапусками.
- У CI Install Smoke пропускає дубльований глобальний update direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke CLI для видалення agents зі спільним workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає root Dockerfile image, підкладає два agents з одним workspace в ізольований home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженням workspace. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke знімка Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP охоплюють URL посилань, clickables, підняті курсором, iframe refs і метадані фреймів.
- Регресія мінімального reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema і перевіряє, що сирі деталі з’являються в журналах Gateway.
- Міст MCP channels (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP server + smoke allow/deny для вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього процесу stdio MCP після ізольованих запусків cron та one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте типовий пакет через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke незмінного оновлення plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps вбудованих плагінів: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate і release-path chunk `plugins-integrations` попередньо пакують цей tarball один раз, а потім шардують перевірки вбудованих каналів на незалежні lanes, зокрема окремі lanes оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску вбудованого lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують doctor/runtime-dependency repair.
- Звужуйте runtime deps вбудованих плагінів під час ітерації, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для наборів override-и image, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. QR- і installer Docker-тести зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime built-app.

Docker-раннери live-моделей також монтують поточний checkout лише для читання і
розміщують його у тимчасовому workdir всередині контейнера. Це допомагає зберігати runtime
image компактним, але при цьому запускати Vitest точно на вашому локальному source/config.
Крок staging пропускає великі локальні кеші та артефакти збирання застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні `.build` застосунків або
каталоги виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
специфічних для машини артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probes gateway не запускали
реальні workers каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live із цього Docker lane.
`test:docker:openwebui` — це smoke сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoints,
запускає зафіксований контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat request через проксі `/api/chat/completions` в Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантажити
image Open WebUI, а сам Open WebUI може завершувати власне cold-start налаштування.
Цей lane очікує наявність придатного live-ключа моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає контейнер
seeded Gateway, стартує другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення розмов, читання transcript, метадані вкладень,
поведінку черги live events, маршрутизацію вихідного надсилання і сповіщення про channel +
permissions у стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
напряму аналізує сирі кадри stdio MCP, тому smoke перевіряє те, що міст
справді відправляє, а не лише те, що показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live-ключа
моделі. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
всередині контейнера, матеріалізує цей сервер через вбудований runtime bundle
MCP Pi, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live-ключа
моделі. Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і дочірній one-shot хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не в CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для регресійних сценаріїв і налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, підвантажених із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових каталогів config/workspace і без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Для звужених запусків провайдерів монтуються лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Можна перевизначити вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного image `openclaw:local-live` під час повторних запусків, яким не потрібне перевзяття
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб гарантувати, що облікові дані надходять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` щоб вибрати модель, яку Gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...` щоб перевизначити зафіксований тег image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли потрібні також перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії “справжнього pipeline” без реальних провайдерів:

- Виклики інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як “оцінювання надійності агентів”:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють прив’язку сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals мають спочатку залишатися детермінованими:

- Runner сценаріїв, що використовує mock-провайдерів для перевірки викликів інструментів і їх порядку, читання skill-файлів та прив’язки сесії.
- Невеликий набір сценаріїв, орієнтованих на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live evals (лише за згодою, з керуванням через env) лише після появи безпечного для CI набору.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони проходять по всіх знайдених плагінах і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці файли спільних seam і smoke; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка thread ID
- **directory** - API directory/roster
- **group-policy** - Застосування group policy

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes статусу channel
- **registry** - Форма registry plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/selection auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експорту або subpaths `plugin-sdk`
- Після додавання чи зміни channel або provider plugin
- Після рефакторингу реєстрації plugin або виявлення

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдера або фіксацію точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і таким, що вмикається через env vars
- Надавайте перевагу найменшому рівню, який виявляє помилку:
  - помилка перетворення/повторення запиту провайдера → тест прямих моделей
  - помилка pipeline сесії/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить по одній вибірковій цілі для кожного класу SecretRef із метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих target id, щоб нові класи не можна було пропустити непомітно.

## Пов’язане

- [Live-тестування](/uk/help/testing-live)
- [CI](/uk/ci)
