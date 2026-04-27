---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделі/провайдера
    - Налагодження поведінки Gateway та агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker runners і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-27T03:29:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c9975b9c7a6fa53d402219c9b8eb3855b0ed76c8599a35f209deeb700e43b11
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker runners. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і чого він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Якщо ви ітеруєтеся над однією помилкою, спочатку надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невеликий probe у стилі читання файла. Моделі, у метаданих яких заявлено вхід `image`, також виконують невеликий хід із зображенням. Вимкніть додаткові probes через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з `include_live_suites: true`, який включає окремі Docker live model matrix jobs, розбиті за провайдером.
  - Для точкових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)` з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`, а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його викликачів для scheduled/release.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичне Slack DM через `/codex bind`, виконує `/codex fast` і `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення-зображення проходять через native plugin binding, а не через ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Пропускає ходи gateway agent через plugin-owned harness Codex app-server, перевіряє `/codex status` і `/codex models`, а також типово виконує probes для image, cron MCP, sub-agent і Guardian. Вимкніть probe sub-agent через `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex app-server. Для точкової перевірки sub-agent вимкніть інші probes: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Цей запуск завершується після probe sub-agent, якщо не встановлено `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke команди rescue для Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова опціональна перевірка поверхні команди rescue для message-channel. Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі, відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без config із фальшивим Claude CLI в `PATH` і перевіряє, що fallback нечіткого планувальника перетворюється на audited typed config write.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Запускається з порожнього каталогу стану OpenClaw, маршрутизує звичайний `openclaw` до Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef, перевіряє config і записи audit. Той самий шлях налаштування Ring 0 також покривається в QA Lab через `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте `openclaw models list --provider moonshot --json`, потім виконайте ізольований `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON показує Moonshot/K2.6, а транскрипт помічника зберігає нормалізований `usage.cost`.

Порада: якщо вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## QA-специфічні runners

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається на відповідних PR і через manual dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch із mock parity gate, live Matrix lane і live Telegram lane під керуванням Convex як паралельні jobs. `OpenClaw Release Checks` запускає ті самі lanes перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA з репозиторію безпосередньо на хості.
  - Типово запускає кілька вибраних сценаріїв паралельно з ізольованими gateway workers. `qa-channel` типово використовує concurrency 4 (обмежену кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування кількості workers або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдачею. Використовуйте `--allow-failures`, коли вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального покриття фікстур і protocol-mock без заміни lane `mock-openai`, що враховує сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, які практично використовувати в гостьовому середовищі: ключі провайдерів через env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він наявний.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через змонтовану робочу область.
  - Записує стандартні QA report + summary, а також логи Multipass до `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в Docker, виконує неінтерактивний onboarding OpenAI API-key, типово налаштовує Telegram, перевіряє, що ввімкнення plugin встановлює runtime dependencies на вимогу, запускає doctor і один локальний хід agent проти замоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane пакетного встановлення з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke для built-app для transcript вбудованого runtime context. Він перевіряє, що прихований runtime context OpenClaw зберігається як недоступне для показу custom message замість витоку у видимий user turn, а потім засіває зламаний JSONL affected session і перевіряє, що `openclaw doctor --fix` переписує його до активної гілки з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - Типово використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі облікові дані Telegram через env або джерело облікових даних Convex, що й `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`, а також `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо в CI наявні `OPENCLAW_QA_CONVEX_SITE_URL` і secret ролі Convex, Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions також надає цей lane як ручний maintainer workflow `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує середовище `qa-live-shared` і оренду облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для додаткового продуктового підтвердження щодо одного кандидата пакета. Він приймає довірений ref, опублікований npm spec, HTTPS tarball URL плюс SHA-256 або артефакт tarball з іншого запуску, завантажує нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає наявний Docker E2E scheduler із профілями lane smoke, package, product, full або custom. Для опублікованих npm-кандидатів також можна запускати Telegram QA workflow.
  - Підтвердження продукту для останньої beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

- Для підтвердження exact tarball URL потрібен digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Підтвердження артефактом завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що виявлення setup залишає неналаштовані runtime dependencies plugin відсутніми, що перший налаштований запуск Gateway або doctor встановлює runtime dependencies кожного bundled plugin на вимогу, і що другий restart не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском `openclaw update --tag <candidate>`, а потім перевіряє, що post-update doctor кандидата відновлює bundled channel runtime dependencies без postinstall repair з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає smoke оновлення native packaged-install у гостьових системах Parallels. Для кожної вибраної платформи спочатку встановлюється запитаний baseline package, потім у тій самій гостьовій системі виконується встановлена команда `openclaw update` і перевіряються встановлена версія, статус оновлення, готовність gateway і один локальний хід agent.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`, поки ітеруєтеся над однією гостьовою системою. Використовуйте `--json` для шляху до summary artifact і статусу для кожного lane.
  - Lane OpenAI типово використовує `openai/gpt-5.5` для live-підтвердження ходу agent. Передайте `--model <provider/model>` або встановіть `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб збої транспорту Parallels не поглинали решту часу, відведеного на тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи lane до `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/відновлення runtime dependencies у холодній гостьовій системі; це все ще є нормальним станом, якщо вкладений npm debug log продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими lanes smoke для Parallels macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час відновлення snapshot, роздавання пакетів або стану guest gateway.
  - Post-update proof запускає звичайну поверхню bundled plugin, оскільки capability facades, такі як speech, image generation і media understanding, завантажуються через bundled runtime APIs, навіть коли сам хід agent перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Пакетні встановлення OpenClaw не постачають `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, а потім запускає дочірній QA gateway із реальним plugin Matrix як транспортом SUT.
  - Типово використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки цей lane локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, summary, observed-events artifact і об’єднаний лог виводу stdout/stderr до `.artifacts/qa-e2e/...`.
  - Типово показує прогрес і примусово застосовує жорсткий timeout запуску через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а збої включають команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени bot driver і SUT із env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдачею. Використовуйте `--allow-failures`, коли вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних bot в одній приватній групі, причому bot SUT має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що bot driver може спостерігати трафік bot у групі.
  - Записує звіт Telegram QA, summary і observed-messages artifact до `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live transport lanes спільно використовують один стандартний контракт, щоб нові транспорти не відхилялися від нього:

`qa-channel` залишається широким синтетичним набором QA і не входить до матриці покриття live transport.

| Lane     | Канарейка | Керування згадками | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда довідки |
| -------- | --------- | ------------------ | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | --------------- |
| Matrix   | x         | x                  | x                    | x                         | x                             | x                          | x               | x                          |                 |
| Telegram | x         |                    |                      |                           |                               |                            |                 |                            | x               |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab отримує ексклюзивну lease із пулу на базі Convex, надсилає Heartbeat для цієї lease, поки lane виконується, і звільняє lease під час завершення роботи.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URL лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі має використовувати `https://`.

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker, префікс endpoint, timeout HTTP і досяжність admin/list без виведення значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI-утилітах.

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
  - Захист активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Набору сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може керувати цим потоком.

`qa-lab` володіє спільною механікою хоста:

- кореневою командою `openclaw qa`
- запуском і завершенням набору
- паралельністю workers
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- aliases сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як для цього транспорту налаштовується gateway
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляються специфічні для транспорту скидання або очищення

Мінімальна планка впровадження для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; ледаче виконання CLI і runner має залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Для нових сценаріїв використовуйте узагальнені helper-и сценаріїв.
7. Зберігайте наявні aliases сумісності працездатними, якщо лише репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або harness plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте узагальнений helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо певна поведінка має сенс лише для одного транспорту, робіть сценарій специфічним для цього транспорту й явно відображайте це в контракті сценарію.

Бажані назви узагальнених helper-ів для нових сценаріїв:

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

Aliases сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати узагальнені назви helper-ів.
Aliases сумісності існують, щоб уникнути міграції «в один день», а не як модель
для написання нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте ці набори як «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Config: ненаправлені запуски використовують набір shards `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненаправлений `pnpm test` запускає дванадцять менших shard-configs (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі `auto-reply`/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує native root `vitest.config.ts` project graph, тому що цикл спостереження з кількома shards непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні source mappings і локальні import-graph dependents. Зміни config/setup/package не запускають тести широко, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний gate перевірок для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, метадані релізу, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового підтвердження викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версій лише в метаданих релізу запускає цільові перевірки version/config/root-dependency із guard, який відхиляє зміни package поза полем версії верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell syntax для скриптів автентифікації live Docker і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежено `scripts["test:docker:live-*"]`; зміни dependencies, exports, version та інші зміни поверхні package і далі використовують ширші guard-перевірки.
    - Полегшені щодо імпортів unit-тести з agents, commands, plugins, helper-ів `auto-reply`, `plugin-sdk` і подібних чистих утилітних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних lanes.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також відображають changed-mode запуски на явні сусідні тести в цих легких lanes, тому зміни helper-ів уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі buckets для helper-ів верхнього рівня core, integration-тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розбиває піддерево reply на shards agent-runner, dispatch і commands/state-routing, щоб один bucket із важкими імпортами не володів усім хвостом Node.

  </Accordion>

  <Accordion title="Покриття вбудованого runner">

    - Коли ви змінюєте вхідні дані discovery message-tool або runtime context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та нормалізації.
    - Підтримуйте інтеграційні набори вбудованого runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише на helper-ах
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення пулу й ізоляції Vitest">

    - Базовий config Vitest типово використовує `threads`.
    - Спільний config Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, e2e і live configs.
    - Кореневий lane UI зберігає свій `jsdom` setup і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення
      `threads` + `isolate: false` зі спільного config Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-
      процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staged і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею роботи або push, коли
      вам потрібен розумний локальний gate перевірок.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею workers.
    - Автомасштабування локальних workers навмисно є консервативним і знижує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базовий config Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється wiring тестів.
    - Config залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію cache для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід розбивки імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий вид профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані часу shards записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски whole-config використовують шлях config як ключ; shards CI з include-pattern
      додають назву shard, щоб відфільтровані shards можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam безпосередньо замість deep-import runtime helper-ів
      лише для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native root-project path для цього закоміченого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневий config Vitest.
    - `pnpm test:perf:profile:main` записує main-thread CPU profile для
      старту Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує runner CPU+heap profiles для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з diagnostics, увімкненими типово
  - Пропускає синтетичне churn gateway message, memory і large-payload через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helper-и збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS залишаються в межах бюджету тиску, а глибина черг на рівні сесій знову зменшується до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і в решті репозиторію.
  - Використовує адаптивних workers (CI: до 2, локально: 1 типово).
  - Типово працює в silent-режимі, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - End-to-end поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing Node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через міст fs sandbox
- Очікування:
  - Лише за явним запитом; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний двійковий файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику tools, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підключають `~/.profile`, щоб підібрати відсутні API keys.
- Типово live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth до тимчасового test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але пригнічує додаткове повідомлення про `~/.profile` і вимикає bootstrap-логи gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API keys (залежить від провайдера): установлюйте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер надсилають рядки прогресу до stderr, тож довгі виклики провайдерів помітно активні, навіть коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway одразу передавалися під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато чого змінили)
- Зміни в мережевій взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагодження «мій bot не працює» / специфічних для провайдера збоїв / виклику tools: запускайте звужений `pnpm test:live`

## Live-тести (які торкаються мережі)

Для live matrix моделей, smoke-перевірок CLI backend, smoke ACP, harness Codex app-server і всіх live-тестів медіа-провайдерів (Deepgram, BytePlus, ComfyUI, image, music, video, media harness) — а також обробки облікових даних для live-запусків — див. [Тестування — live-набори](/uk/help/testing-live).

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл зі своїм profile-key всередині Docker image репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підключають `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово використовують меншу межу smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два images `scripts/e2e/Dockerfile`. Базовий image — це лише runner Node/Git для lanes install/update/plugin-dependency; ці lanes монтують попередньо зібраний tarball. Функціональний image встановлює той самий tarball у `/app` для lanes функціональності built-app. Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають усім важким lanes live, npm-install і multi-service стартувати одночасно. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker host має більший запас ресурсів. Runner типово виконує Docker preflight, видаляє застарілі OpenClaw E2E containers, друкує статус кожні 30 секунд, зберігає тривалості успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці тривалості, щоб у наступних запусках першими стартували довші lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lanes без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести план CI для вибраних lanes, потреб package/image і облікових даних.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних containers і перевіряють integration-шляхи вищого рівня.

Docker runners для live-моделей також bind-mount лише потрібні каталоги auth для CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог container перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke спостережуваності: `pnpm qa:otel:smoke` — це приватний QA lane для source checkout. Він навмисно не входить до package Docker release lanes, оскільки npm tarball не містить QA Lab.
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding із посиланням на env і типово Telegram, перевіряє, що doctor відновлює активовані runtime deps plugin, і виконує один замоканий хід agent OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє, що збережений канал і plugin після оновлення працюють, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime context плюс відновлення через doctor для affected дублікатних гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` зі зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує один кеш npm для своїх containers root, update і direct-npm. Smoke оновлення типово використовує npm `latest` як stable baseline перед оновленням до tarball-кандидата. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke у GitHub. Перевірки інсталятора без root використовують ізольований кеш npm, щоб записи кешу, створені root, не маскували локальну для користувача поведінку встановлення. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm у локальних повторних запусках.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke CLI для видалення спільного workspace агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає image кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому home container, запускає `agents delete --json` і перевіряє коректний JSON плюс поведінку зі збереженим workspace. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два containers, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke CDP snapshot браузера: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URL посилань, clickables, підняті курсором, refs iframe і метадані фреймів.
- Мінімальна reasoning-регресія OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає замоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналів MCP (засіяний Gateway + міст stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у пакеті Pi (реальний stdio MCP server + smoke allow/deny для вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього процесу stdio MCP після ізольованого Cron і одноразових запусків sub-agent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте типовий package через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker runner image, один раз збирає та пакує OpenClaw на host, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте host rebuild після свіжого локального build через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate попередньо пакує цей tarball один раз, а потім розбиває перевірки bundled channel на незалежні lanes, включно з окремими lanes оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити matrix каналів під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime deps bundled plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати і повторно використовувати спільний функціональний image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних наборів, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо їх установлено. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо він ще не локальний. Docker-тести QR і installer зберігають власні Dockerfiles, оскільки вони перевіряють поведінку package/install, а не спільний runtime built-app.

Docker runners для live-моделей також bind-mount поточний checkout у режимі лише для читання й
розгортають його в тимчасовий workdir усередині container. Це зберігає runtime
image компактним, але все одно запускає Vitest точно проти вашого локального source/config.
Крок розгортання пропускає великі локальні cache і результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання артефактів,
специфічних для машини.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probes Gateway не запускали
реальні workers каналів Telegram/Discord тощо всередині container.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити live-покриття Gateway з цього Docker lane.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
container Gateway OpenClaw з увімкненими HTTP endpoints, сумісними з OpenAI,
запускає закріплений container Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а Open WebUI може завершувати власне холодне початкове налаштування.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає засіяний
container Gateway, запускає другий container, який піднімає `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, читання transcript, метадані вкладень,
поведінку live event queue, маршрутизацію outbound send і сповіщення про channel +
дозволи у стилі Claude через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо аналізує сирі кадри stdio MCP, тож smoke перевіряє те, що міст
справді надсилає, а не лише те, що певний клієнтський SDK випадково показує.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker image репозиторію, запускає реальний probe server stdio MCP
усередині container, матеріалізує цей server через вбудований runtime Pi bundle
MCP, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає засіяний Gateway із реальним probe server stdio MCP, виконує
ізольований хід Cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підключається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підключені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, як-от `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині container
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний image `openclaw:local-live` для повторних запусків, яким не потрібне нове збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечно для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик tools Gateway (mock OpenAI, реальний gateway + цикл agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «evals надійності агента»:

- Mock-виклик tools через реальний gateway + цикл agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, які перевіряють wiring сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір рішень:** коли Skills перелічено в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок tools, перенесення history сесії та межі sandbox.

Майбутні evals мають спочатку залишатися детермінованими:

- Runner сценаріїв, який використовує mock-провайдери для перевірки викликів tools + порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на skills (використовувати чи уникати, gating, injection у prompt).
- Необов’язкові live evals (opt-in, керовані env) лише після того, як безпечний для CI набір уже буде впроваджено.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони проходять по всіх виявлених plugins і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розміщені в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт wizard налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID тредів
- **directory** - API каталогу/реєстру
- **group-policy** - Забезпечення group policy

### Контракти статусу provider

Розміщені в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки status channel
- **registry** - Форма registry plugin

### Контракти provider

Розміщені в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/добір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Wizard налаштування

### Коли запускати

- Після зміни exports або subpaths у plugin-sdk
- Після додавання або зміни plugin channel або provider
- Після рефакторингу реєстрації plugin або discovery

Контрактні тести запускаються в CI і не потребують реальних API keys.

## Додавання регресійних тестів (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub provider або фіксацію точної трансформації форми запиту)
- Якщо це за своєю природою лише live-проблема (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який виявляє помилку:
  - помилка conversion/replay запиту provider → прямий тест моделей
  - помилка session/history/tool pipeline Gateway → live smoke Gateway або безпечний для CI mock-тест Gateway
- Guardrail для обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою для некласифікованих target ids, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
