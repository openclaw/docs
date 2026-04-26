---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T22:14:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 425a86fc79b306f1957308c4060874d8d10a5ac61fb29b6cb91b7df3f445db91
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
ранерів Docker. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повний набір перевірок (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Точковий запуск одного live-файлу без зайвого виводу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку у стилі читання файлу.
    Моделі, у метаданих яких заявлено вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі матричні Docker-завдання live-моделей,
    розшардовані за провайдером.
  - Для точкових повторних запусків у CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів за розкладом/для релізу.
- Smoke-тест native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення-зображення
    проходять через native Plugin binding, а не через ACP.
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Пропускає ходи агента Gateway через Plugin-owned harness app-server Codex,
    перевіряє `/codex status` і `/codex models`, а також за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex.
    Для точкової перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершиться після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke-тест rescue command Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Опціональна додаткова перевірка поверхні rescue command для каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу стійку зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke-тест planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI в `PATH`
    і перевіряє, що запасний fuzzy planner перетворюється на типізований запис
    конфігурації з audit.
- Docker smoke-тест першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    перевіряє конфігурацію і записи audit. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke-тест вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6 і що
  транскрипт помічника зберігає нормалізований `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів за допомогою змінних середовища allowlist, описаних нижче.

## Ранери для QA

Ці команди працюють поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
через ручний dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch із mock parity gate, live Matrix lane і
live Telegram lane під керуванням Convex як паралельні завдання. `OpenClaw Release Checks`
запускає ті самі lane перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого послідовного lane.
  - Повертає ненульовий код виходу, якщо будь-який сценарій завершується помилкою.
    Використовуйте `--allow-failures`, якщо вам потрібні артефакти без помилкового коду виходу.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`, який знає про сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають у guest підтримувані вхідні QA-дані автентифікації, які для нього практичні:
    ключі провайдерів через env, шлях до конфігурації live-провайдера QA і `CODEX_HOME`, якщо він наявний.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт і підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, виконує неінтерактивний onboarding із ключем API OpenAI, налаштовує Telegram
    за замовчуванням, перевіряє, що ввімкнення Plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний хід агента проти замоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    packaged-install з Discord.
- `pnpm test:docker:session-runtime-context`
  - Виконує детермінований Docker smoke-тест built-app для вбудованих транскриптів runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    спеціальне повідомлення, яке не відображається, замість витоку у видимий хід користувача,
    потім підкладає пошкоджений JSONL сеансу і перевіряє, що
    `openclaw doctor --fix` переписує його в активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding для встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі облікові дані Telegram через env або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації в CI/релізах установіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret наявні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - У GitHub Actions цей lane доступний як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує і встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, а потім вмикає bundled channel/plugins через редагування конфігурації.
  - Перевіряє, що виявлення setup залишає невстановленими runtime-залежності
    не налаштованих Plugin, що перший налаштований запуск Gateway або doctor встановлює
    runtime-залежності кожного bundled Plugin на вимогу, і що другий restart не перевстановлює
    залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базову версію, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що
    post-update doctor у кандидаті відновлює runtime-залежності bundled channel без
    postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke-тест оновлення packaged-install на guest-системах Parallels. Кожна
    вибрана платформа спочатку встановлює вказаний базовий пакет, потім виконує команду
    встановленого `openclaw update` у тій самій guest-системі і перевіряє встановлену
    версію, статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`, коли
    ітеруєте над однією guest-системою. Використовуйте `--json` для шляху до підсумкового артефакту і
    статусу кожного lane.
  - За замовчуванням lane OpenAI використовує `openai/gpt-5.5` для live-перевірки ходу агента.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб збої транспорту Parallels
    не поглинули решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може займати від 10 до 15 хвилин на post-update doctor/runtime
    repair залежностей на холодній guest-системі; це все ще є нормальним, якщо вкладений
    npm debug log продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-lane Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, видачі пакетів або стану guest gateway.
  - Перевірка після оновлення виконує звичайну поверхню bundled Plugin, оскільки
    capability facades, як-от мовлення, генерація зображень і
    розуміння медіа, завантажуються через bundled runtime API, навіть якщо сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Упаковані встановлення OpenClaw не постачають
    `qa-lab`, тому не надають `openclaw qa`.
  - Checkout репозиторію напряму завантажують bundled runner; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначте його через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, тому що lane локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і об’єднаний лог виводу stdout/stderr у `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і застосовує жорсткий timeout запуску через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а повідомлення про збої містять команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулінгові lease.
  - Повертає ненульовий код виходу, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних ботів у тій самій приватній групі, причому бот SUT має надавати ім’я користувача Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на відправлення driver до спостережуваної відповіді SUT.

Live transport lane використовують один стандартний контракт, щоб нові транспорти не розходилися в поведінці:

`qa-channel` залишається широким синтетичним набором QA і не входить до матриці покриття live transport.

| Lane     | Canary | Блокування згадувань | Блок allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда довідки |
| -------- | ------ | -------------------- | -------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | --------------- |
| Matrix   | x      | x                    | x              | x                         | x                             | x                          | x               | x                          |                 |
| Telegram | x      |                      |                |                           |                               |                            |                 |                            | x               |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну lease із пулу на базі Convex, надсилає Heartbeat
для цієї lease, поки lane працює, і звільняє lease під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

У звичайній роботі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди maintainer (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Перед live-запусками використовуйте `doctor`, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, HTTP timeout і досяжність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI-утилітах.

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
  - Захист від активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до системи markdown QA вимагає рівно двох речей:

1. Transport adapter для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab`
може керувати цим потоком.

`qa-lab` відповідає за спільну механіку хоста:

- кореневий простір команд `openclaw qa`
- запуск і завершення набору
- concurrency workers
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Runner plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії, забезпечені транспортом
- як обробляються транспортно-специфічне скидання або очищення

Мінімальний поріг впровадження нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Залишайте транспортно-специфічну механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; ліниве виконання CLI і runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Для нових сценаріїв використовуйте generic helpers.
7. Зберігайте чинні alias сумісності, якщо репозиторій не виконує навмисну міграцію.

Правило прийняття рішень суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, залишайте її в runner plugin або harness цього Plugin.
- Якщо сценарію потрібна нова можливість, яку може використати більше ніж один канал, додавайте generic helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій транспортно-специфічним і явно позначайте це в контракті сценарію.

Для нових сценаріїв бажані назви generic helper такі:

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

Alias сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота з каналами має використовувати назви generic helper.
Alias сумісності існують, щоб уникнути міграції типу flag day, а не як модель
для створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання флакiв/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelist node-тести `ui`, покриті `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускаються в CI
  - Реальні ключі не потрібні
  - Мають бути швидкими й стабільними

<AccordionGroup>
  <Accordion title="Проєкти, шарди й scoped lane">

    - Нетаргетований `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати нерелевантні набори.
    - `pnpm test --watch` усе ще використовує native root-граф проєктів `vitest.config.ts`, тому що багатошардовий цикл watch непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lane, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lane, коли diff торкається лише source/test файлів, які можна маршрутизувати; редагування config/setup усе ще повертаються до широкого повторного запуску root project.
    - `pnpm check:changed` — це звичайний розумний локальний gate для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні lane typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають один прохід валідації extension, тому що extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем version верхнього рівня.
    - Редагування harness live Docker ACP запускають сфокусований локальний gate: shell-синтаксис для live Docker auth-скриптів, dry-run планувальника live Docker, unit-тести bind ACP і тести extension ACPX. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; редагування dependency, export, version та іншої package-поверхні все ще використовують ширші перевірки.
    - Unit-тести з легкими імпортами з agents, commands, plugins, helper auto-reply, `plugin-sdk` та подібних чистих утилітних ділянок маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних lane.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling-тестами в цих легких lane, тож редагування helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для helper верхнього рівня core, integration-тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. У CI піддерево reply додатково ділиться на шарди agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими імпортами не забирав увесь Node tail.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте входи виявлення message-tool або runtime context Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та нормалізації.
    - Підтримуйте в здоровому стані integration-набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення pool та isolation у Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, e2e і live configs.
    - Кореневий UI lane зберігає своє налаштування `jsdom` і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lane запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно індексує відформатовані файли і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передаванням або push, коли
      вам потрібен розумний локальний gate. Зміни публічного Plugin SDK і plugin-contract
      включають один прохід валідації extension.
    - `pnpm test:changed` маршрутизує через scoped lane, коли змінені шляхи
      однозначно зіставляються з меншим набором.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Автоматичне масштабування локальних workers навмисно є консервативним і знижує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними,
      коли змінюється зв’язування тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо вам потрібне
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий режим профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски цілої конфігурації використовують шлях конфігурації як ключ; шарди CI
      з include-pattern додають ім’я шарда, щоб відфільтровані шарди можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшу частину часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і мокуйте
      цей seam напряму замість глибокого імпорту runtime helper лише
      для передачі їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з native шляхом root project для цього закоміченого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує бенчмарк поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль main thread для
      накладних витрат запуску та трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичне навантаження повідомленнями gateway, пам’яттю та великими payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через WS RPC Gateway
  - Покриває helper персистентності diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS лишаються в межах бюджету тиску, а глибини черг на сесію повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшого опрацювання регресій стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати на консольний I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний консольний вивід.
- Обсяг:
  - Наскрізна поведінка gateway із кількома інстансами
  - Поверхні WebSocket/HTTP, pairинг Node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє канонічну для remote поведінку файлової системи через fs bridge sandbox
- Очікування:
  - Лише за бажанням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і справного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI-бінарник або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель _сьогодні_ працює з реальними обліковими даними?»
  - Виявляє зміни формату провайдера, особливості виклику інструментів, проблеми автентифікації та поведінку rate limit
- Очікування:
  - За задумом нестабільні для CI (реальні мережі, реальні політики провайдерів, квоти, відмови)
  - Коштують грошей / використовують rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підключають `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-fixture не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але пригнічує додаткове повідомлення про `~/.profile` і вимикає логи bootstrap Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API-ключів (залежно від провайдера): установіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдера було видно як активні, навіть коли перехоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії gateway / протоколу WS / pairингy: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (які торкаються мережі)

Для live-матриці моделей, smoke-тестів CLI backend, smoke-тестів ACP, harness Codex app-server
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Ранери Docker (необов’язкові перевірки «працює в Linux»)

Ці ранери Docker поділяються на дві категорії:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підключають `~/.profile`, якщо він змонтований). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово мають меншу верхню межу smoke-перевірок, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні env, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише раннер Node/Git для lane встановлення/оновлення/залежностей Plugin; ці lane монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для lane функціональності built-app. Агрегований запуск використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають усім важким lane live, npm-install і multi-service стартувати одночасно. Типові значення — 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Ранер типово виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає час успішних lane у `.artifacts/docker-tests/lane-timings.json` і використовує ці часові дані, щоб у наступних запусках спочатку стартували довші lane. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane без збирання або запуску Docker.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-монтують лише потрібні CLI auth home (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни auth-store на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, із суворим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює активовані runtime deps Plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакета `stable` на git `dev`, перевіряє, що збережений канал і Plugin працюють після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження транскрипту прихованого runtime context плюс відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache у своїх контейнерах root, update і direct-npm. Smoke оновлення типово використовує npm `latest` як стабільну базову версію перед оновленням до tarball-кандидата. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи кешу, створені root, не маскували поведінку user-local install. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm у локальних повторних запусках.
- Install Smoke у CI пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- CLI smoke спільного workspace для видалення agents: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ root Dockerfile, підготовлює два agents з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженням workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP покривають URL посилань, елементи для кліку, підняті курсором, refs iframe і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі деталі з’являються в логах Gateway.
- MCP channel bridge (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте типовий пакет через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled Plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker-образ раннера, один раз збирає і пакує OpenClaw на хості, а потім монтує цей tarball у кожний сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть на наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегат попередньо пакує цей tarball один раз, а потім шардує перевірки bundled channel на незалежні lane, включно з окремими lane оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення runtime-dependency через doctor.
- Звужуйте runtime deps bundled Plugin під час ітерації, вимикаючи нерелевантні сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для конкретних наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. Тести Docker для QR та інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакета/встановлення, а не спільний runtime built-app.

Docker-ранери live-моделей також bind-монтують поточний checkout лише для читання і
розміщують його в тимчасовому workdir усередині контейнера. Це зберігає runtime-
образ компактним, але все одно запускає Vitest точно на вашому локальному source/config.
Крок staging пропускає великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-проби gateway не запускали
реальні workers каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити live-покриття gateway із цього Docker lane.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер Gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний запит чату через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися
завантажити образ Open WebUI, а Open WebUI може потребувати завершення власного cold-start налаштування.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
контейнер, стартує другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідної відправки та сповіщення у стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо досліджує сирі stdio MCP frame, тож smoke перевіряє те, що міст
справді виводить, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований runtime Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає seeded Gateway із реальним stdio MCP probe server, виконує
ізольований Cron-хід і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній MCP-процес завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні змінні env:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підключається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні env, підключені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх монтувань CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установлень CLI всередині Docker
- Зовнішні каталоги/файли CLI auth у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, як-от `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити зафіксований тег образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock-виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, які перевіряють зв’язування сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval мають спершу залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і зв’язування сесії.
- Невеликий набір сценаріїв, сфокусованих на skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-eval (opt-in, із керуванням через env) лише після того, як буде готовий набір, безпечний для CI.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
інтерфейсному контракту. Вони проходять по всіх виявлених Plugin і запускають набір
перевірок форми та поведінки. Типовий unit-lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (`id`, `name`, `capabilities`)
- **setup** - Контракт wizard налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API каталогу/складу
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма реєстру Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/встановлення auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Wizard налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни Plugin channel або provider
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресійних тестів (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через змінні env
- Віддавайте перевагу найменшому шару, який виявляє баг:
  - баг перетворення/відтворення запиту provider → тест прямих моделей
  - баг конвеєра сесії/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec id відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою для некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
