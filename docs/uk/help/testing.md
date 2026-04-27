---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-27T04:17:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 171b23d78a42b05305cfcf824e70fcd19b0abae5852afce41bab2d7b9152f5df
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір раннерів Docker. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний контрольний прогін (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск усіх наборів на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над окремим падінням спочатку надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-лінія на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Контрольний прогін покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Запустити один live-файл у тихому режимі: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Прогін live-моделей у Docker: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає текстовий хід плюс невелику перевірку у стилі читання файлу.
    Моделі, у чиїх метаданих вказано вхід `image`, також запускають невеликий хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі матричні завдання Docker live-моделей,
    розшардовані за провайдером.
  - Для цільових повторних запусків у CI викличте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів за розкладом/для релізу.
- Smoke-тест нативного Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-лінію проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення із зображенням
    проходять через нативну прив’язку plugin, а не через ACP.
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через app-server harness Codex, який належить plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням також виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex.
    Для цільової перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Цей прогін завершується після перевірки sub-agent, якщо тільки
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` не встановлено.
- Smoke-тест команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова перевірка поверхні команди порятунку каналу повідомлень, що вмикається явно.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису аудиту/конфігурації.
- Smoke-тест Docker для планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI у `PATH`
    і перевіряє, що fuzzy fallback планувальника перетворюється на типізований запис
    конфігурації з аудитом.
- Smoke-тест першого запуску Crestodian у Docker: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує налаштування setup/model/agent/Discord plugin + записи SecretRef,
    перевіряє конфігурацію і перевіряє записи аудиту. Той самий шлях налаштування Ring 0
    також покривається в QA Lab командою
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke-тест вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований запуск
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6 і що
  транскрипт асистента зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## Раннери, специфічні для QA

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм QA Lab:

CI запускає QA Lab у спеціальних workflow. `Parity gate` запускається для відповідних PR
і з ручного виклику з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного виклику з mock parity gate, live Matrix lane і
керованою Convex live Telegram lane як паралельними завданнями. `OpenClaw Release Checks`
запускає ті самі лінії перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. `qa-channel` за замовчуванням використовує concurrency 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування
    кількості працівників, або `--concurrency 1` для старої послідовної лінії.
  - Повертає ненульовий код завершення, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни сценарійно-орієнтованої лінії
    `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що і `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, які практично передати в гостьову систему:
    ключі провайдерів на базі env, шлях до конфігурації QA live-провайдера і `CODEX_HOME`,
    якщо присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад
    через змонтований workspace.
  - Записує звичайний звіт і підсумок QA, а також логи Multipass до
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Створює npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний онбординг із ключем OpenAI API, налаштовує Telegram
    за замовчуванням, перевіряє, що ввімкнення plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний хід агента проти замоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму
    лінію встановлення з пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke для built-app для транскриптів вбудованого runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    користувацьке повідомлення, що не відображається, замість витоку у видимий хід користувача,
    потім підкладає пошкоджений JSONL сеансу і перевіряє, що
    `openclaw doctor --fix` переписує його до активної гілки з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидатний пакет OpenClaw у Docker, виконує онбординг
    установленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим установленим пакетом як SUT Gateway.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати локальний tarball замість
    встановлення з реєстру.
  - Використовує ті самі облікові дані Telegram через env або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізу встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`, а також
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions також надає цю лінію як ручний workflow для супроводжувача
    `NPM Telegram Beta E2E`. Вона не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для додаткового продуктового підтвердження
  для одного кандидатного пакета. Він приймає довірений ref, опубліковану npm-специфікацію,
  HTTPS tarball URL плюс SHA-256 або артефакт tarball з іншого запуску,
  завантажує нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний планувальник Docker E2E з профілями ліній smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити workflow Telegram QA
  проти того самого артефакту `package-under-test`.
  - Останнє продуктове підтвердження beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Для підтвердження через точний tarball URL потрібен digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Підтвердження через артефакт завантажує tarball-артефакт з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugins через редагування конфігурації.
  - Перевіряє, що виявлення setup не встановлює runtime-залежності
    для не налаштованих plugin, що перший налаштований запуск Gateway або doctor
    встановлює runtime-залежності кожного вбудованого plugin на вимогу, і що другий перезапуск не
    перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базову версію, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor кандидатної версії відновлює runtime-залежності вбудованих channel
    без postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає smoke-тест оновлення нативного встановлення з пакета в гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім виконує команду
    `openclaw update` установленого пакета в тій самій гостьовій системі й перевіряє встановлену версію,
    статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`, коли
    ітеруєте над однією гостьовою системою. Використовуйте `--json` для отримання шляху до підсумкового артефакту та
    статусу кожної лінії.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для підтвердження live-ходу агента.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу модель OpenAI.
  - Обгорніть довгі локальні запуски хостовим timeout, щоб збої транспорту Parallels не
    поглинули решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи ліній до `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10–15 хвилин на post-update doctor/відновлення
    runtime-залежностей на холодній гостьовій системі; це все ще є нормальним станом, якщо вкладений
    npm debug log просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-лініями Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, роздачі пакетів або стану guest gateway.
  - Підтвердження після оновлення запускає звичайну поверхню вбудованих plugin, оскільки
    фасади можливостей, такі як speech, image generation і media
    understanding, завантажуються через вбудовані runtime API, навіть коли сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лінію Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Упаковані встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout репозиторію безпосередньо завантажують вбудований раннер; окремий крок
    встановлення plugin не потрібен.
  - Надає три тимчасових користувачі Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway із реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки лінія локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований лог stdout/stderr до `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і примусово обмежує час виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а збої містять команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA-лінію Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути спільні оренди.
  - Повертає ненульовий код завершення, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, при цьому бот SUT має мати Telegram username.
  - Для стабільного спостереження бот-до-бота увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages до `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live-транспортні лінії використовують єдиний стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним набором QA і не входить до матриці покриття live-транспорту.

| Лінія    | Canary | Керування згадками | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження реакцій | Команда help |
| -------- | ------ | ------------------ | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | --------------------- | ------------ |
| Matrix   | x      | x                  | x                    | x                         | x                             | x                          | x               | x                     |              |
| Telegram | x      |                    |                      |                           |                               |                            |                 |                       | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
цієї оренди під час роботи лінії та звільняє оренду під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Потрібні змінні середовища:

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди супроводжувача (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для супроводжувачів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
endpoint prefix, HTTP timeout і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і утилітах CI.

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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий корінь команди QA верхнього рівня, якщо спільний хост `qa-lab`
може керувати цим процесом.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням набору
- паралелізмом працівників
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як відкриваються транскрипти й нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг впровадження для нового каналу:

1. Зберігайте `qa-lab` як власника спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Зберігайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкурентного кореневого командного шляху.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте наявні псевдоніми сумісності працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення є суворим:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, зберігайте її в runner plugin або harness цього plugin.
- Якщо сценарію потрібна нова можливість, яку можуть використовувати більше одного каналу, додайте загальну helper-функцію замість channel-специфічної гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно вказуйте це в контракті сценарію.

Для нових сценаріїв рекомендовані такі імена загальних helper-функцій:

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати загальні імена helper-функцій.
Псевдоніми сумісності існують, щоб уникнути міграції одним днем, а не як модель
для створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростаючий реалізм» (і зростаючу нестабільність/вартість):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати мультипроєктні shard у конфігурації на рівні окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelist-нуті node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (автентифікація gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped-лінії">

    - Нетаргетовані запуски `pnpm test` виконують дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує нативний граф проєктів root `vitest.config.ts`, тому що цикл спостереження з кількома shard непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped-лінії, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платить повний податок на запуск root project.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи у дешеві scoped-лінії: прямі редагування тестів, сусідні файли `*.test.ts`, явні зіставлення вихідного коду і локальні залежні з графа імпортів. Редагування config/setup/package не запускають широкі тести, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний gate перевірок для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для підтвердження тестами викликайте `pnpm test:changed` або явне `pnpm test <target>`. Підвищення версії лише в release metadata запускає цільові перевірки версії/config/root-dependency, із guard, що відхиляє зміни package поза полем версії верхнього рівня.
    - Редагування live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для скриптів live Docker auth і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, export, version та інші редагування поверхні package усе ще використовують ширші guard.
    - Unit-тести з легкими імпортами з agents, commands, plugins, helper-функцій auto-reply, `plugin-sdk` та подібних чистих утилітних ділянок маршрутизуються через лінію `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних лініях.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких лініях, тому редагування helper-функцій не спричиняють повторний запуск повного важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для helper-функцій core верхнього рівня, integration-тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на shard agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими імпортами не утримував увесь хвіст Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані для виявлення message-tool або runtime
      context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії helper-функцій для чистих меж
      маршрутизації та нормалізації.
    - Підтримуйте працездатність integration-наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише на helper-функції
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення пулу й ізоляції Vitest">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, e2e і live-конфігураціях.
    - Root UI-лінія зберігає свій `jsdom` setup і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх
      процесів Node у Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні лінії запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно індексує відформатовані файли і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли
      вам потрібен розумний локальний gate перевірок.
    - `pnpm test:changed` за замовчуванням маршрутизує через дешеві scoped-лінії. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що редагування harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею кількості працівників.
    - Автомасштабування локальних працівників навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли
      змінюється підключення тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід деталізації імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання
      файлами, зміненими від `origin/main`.
    - Дані про час виконання shard записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски цілої конфігурації використовують шлях конфігурації як ключ; CI-shard
      з include-pattern додають назву shard, щоб відфільтровані shard можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокуйте цей seam напряму замість глибокого імпорту runtime-helper-функцій лише
      для того, щоб передати їх у `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з нативним шляхом root-project для цього закоміченого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для
      накладних витрат старту Vitest/Vite і transform.
    - `pnpm test:perf:profile:runner` записує CPU+heap-профілі runner для
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один працівник
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через WS RPC Gateway
  - Покриває helper-функції збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS не перевищують бюджет тиску, а глибина черг на сеанс зливається назад до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька лінія для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих plugin у `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість працівників (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати на I/O консолі.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість працівників (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - End-to-end поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pairing Node і важчий networking
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke для backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальний `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через міст sandbox fs
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарний файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін форматів провайдерів, особливостей tool calling, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно нестабільний для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють матеріали config/auth до тимчасового test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: зберігає вивід прогресу `[live] ...`, але пригнічує додаткове повідомлення про `~/.profile` і заглушує логи bootstrap gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу до stderr, щоб довгі виклики провайдера помітно залишалися активними, навіть коли захоплення консолі Vitest працює в тихому режимі.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat для прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато що змінили)
- Зміни в мережевій частині gateway / протоколі WS / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / збоїв, специфічних для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Live (тести, що торкаються мережі)

Для live-матриці моделей, smoke-тестів backend CLI, smoke-тестів ACP, harness app-server Codex і всіх live-тестів медіа-провайдерів (Deepgram, BytePlus, ComfyUI, image, music, video, media harness) — а також для обробки облікових даних під час live-запусків — див. [Тестування — live-набори](/uk/help/testing-live).

## Раннери Docker (необов’язкові перевірки «працює в Linux»)

Ці раннери Docker поділяються на дві групи:

- Раннери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл зі своїм profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- За замовчуванням Docker live-раннери мають меншу межу smoke, щоб повний прогін Docker залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли
  вам явно потрібне більше, вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише раннер Node/Git для ліній install/update/plugin-dependency; ці лінії монтують попередньо зібраний tarball. Функціональний образ установлює той самий tarball у `/app` для ліній функціональності built-app. Визначення Docker-ліній розташовані в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають усім важким live-, npm-install- і multi-service-лініям стартувати одночасно. Якщо одна лінія важча за активні обмеження, планувальник усе одно може запустити її, коли пул порожній, а потім триматиме її запущеною наодинці, доки знову не з’явиться доступна місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. За замовчуванням раннер виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, друкує статус кожні 30 секунд, зберігає час успішних ліній у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані, щоб у наступних запусках спочатку стартували довші лінії. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест ліній без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести CI-план для вибраних ліній, потреб package/image і облікових даних.
- `Package Acceptance` — це GitHub-native gate пакетів для перевірки «чи працює цей tarball, який можна встановити, як продукт?». Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-лінії проти саме цього tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірений workflow/скрипти harness, а `package_ref` — вихідний commit/branch/tag для пакування, коли `source=ref`; це дозволяє поточній логіці acceptance перевіряти старіші довірені commit. Профілі впорядковані за шириною охоплення: `smoke` — це швидка перевірка install/channel/agent плюс gateway/config, `package` — контракт package/update/plugin і типовий нативний замінник більшості покриття package/update у Parallels, `product` додає канали MCP, cleanup cron/subagent, OpenAI web search і OpenWebUI, а `full` запускає Docker-чанки шляху релізу з OpenWebUI. Для перевірки релізу запускається профіль `package` для цільового ref з увімкненим Telegram package QA.
- Container smoke-раннери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-раннери live-моделей також bind-mount лише потрібні auth-home для CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени, не змінюючи host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням покриває Claude, Codex і Gemini, а суворе покриття Droid/OpenCode доступне через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke спостережуваності: `pnpm qa:otel:smoke` — це приватна QA-лінія для перевірки checkout вихідного коду. Вона навмисно не входить до Docker-ліній релізу пакетів, оскільки npm tarball не містить QA Lab.
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke онбордингу/каналу/агента через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює runtime-залежності активованих plugin, і виконує один замоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє, що збережений канал і plugin після оновлення працюють, а потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke runtime context сеансу: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого транскрипту runtime context плюс відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудовані image-провайдери замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один кеш npm для своїх контейнерів root, update і direct-npm. Smoke оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до tarball-кандидата. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke у GitHub. Перевірки інсталятора без root зберігають ізольований кеш npm, щоб записи кешу, що належать root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm глобальне оновлення через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; локально запускайте скрипт без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke CLI видалення shared workspace агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ root Dockerfile, підкладає два агенти з одним workspace в ізольований home контейнера, запускає `agents delete --json` і перевіряє коректний JSON плюс поведінку зі збереженим workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke browser CDP snapshot: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP покривають URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Мінімальна reasoning-регресія для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає замоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` із `minimal` до `low`, потім примусово спричиняє відхилення схеми провайдера й перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + raw Claude smoke notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте типовий package через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke незмінного оновлення plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованих plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker-образ раннера, один раз збирає і пакує OpenClaw на хості, а потім монтує цей tarball у кожен Linux-сценарій встановлення. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегат попередньо пакує цей tarball один раз, а потім розподіляє перевірки вбудованих channel на незалежні лінії, включно з окремими лініями оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску вбудованої лінії, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime-залежності вбудованих plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для конкретного набору, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти виконують `pull`, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, оскільки перевіряють поведінку package/install, а не спільний runtime built-app.

Docker-раннери live-моделей також монтують поточний checkout лише для читання і
розміщують його у тимчасовому workdir всередині контейнера. Це зберігає
образ runtime компактним, але все одно дозволяє запускати Vitest проти ваших точних локальних source/config.
Етап staging пропускає великі локальні кеші та артефакти збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
Gradle output, щоб Docker live-запуски не витрачали хвилини на копіювання
специфічних для машини артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні працівники каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття gateway із цієї Docker-лінії.
`test:docker:openwebui` — це smoke сумісності вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає зафіксований контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може потребувати завантаження
образу Open WebUI, а самому Open WebUI може знадобитися завершити власне cold-start налаштування.
Ця лінія очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload, наприклад `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
контейнер, запускає другий контейнер, який стартує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення каналу +
дозволів у стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frame, тому smoke перевіряє те, що міст
справді випромінює, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує ключа live-моделі.
Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через runtime MCP вбудованого пакета Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke тредів ACP природною мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації тредів ACP, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування auth зовнішніх CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні auth-каталоги/файли CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані походять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити зафіксований тег образу Open WebUI

## Перевірка коректності документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібна перевірка заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Tool calling Gateway (mock OpenAI, реальний loop gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «evals надійності агента»:

- Mock tool-calling через реальний loop gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють wiring сеансу й ефекти config (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір рішення:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сеансу та межі sandbox.

Майбутні evals мають спочатку залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і wiring сеансу.
- Невеликий набір сценаріїв, сфокусованих на skills (використовувати чи уникати, gating, ін’єкція в prompt).
- Необов’язкові live-evals (opt-in, із керуванням через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони проходять по всіх виявлених plugin і запускають набір
перевірок форми та поведінки. Типова unit-лінія `pnpm test` навмисно
пропускає ці файли спільних seam і smoke; запускайте контрактні команди явно,
коли змінюєте спільні поверхні channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сеансу
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID тредів
- **directory** - API directory/roster
- **group-policy** - Забезпечення групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/добір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації plugin або виявлення

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub provider або фіксацію точної трансформації форми запиту)
- Якщо проблема за своєю природою лише для live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через змінні середовища
- Надавайте перевагу найменшому шару, який виявляє помилку:
  - помилка конвертації/відтворення запиту provider → тест прямих моделей
  - помилка pipeline сеансу/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Захисний механізм обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментами обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
