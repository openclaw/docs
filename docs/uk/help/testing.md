---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T00:18:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 106fd042e6b065595df0b7c7667cb0e07aceff28d88bb2cd59752c0946ba2edd
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
ранерів Docker. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Прямий таргетинг файлу тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією проблемою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Набір live (моделі + зондування tool/image через Gateway): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker sweep live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелике зондування у стилі читання файлу.
    Моделі, чиї метадані вказують на вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові зондування через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі matrix jobs Docker live-моделей,
    розбиті за провайдерами.
  - Для точкових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів зі schedule/release.
- Native Codex smoke для bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення-зображення
    проходять через native Plugin binding, а не через ACP.
- Smoke команди rescue для Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Необов’язкова додаткова перевірка поверхні команди rescue для message-channel.
    Вона виконує `/crestodian status`, ставить у чергу стійку
    зміну моделі, відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke planner для Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що нечіткий fallback planner перетворюється на audited typed
    запис у конфігурацію.
- Docker smoke першого запуску для Crestodian: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord Plugin + SecretRef,
    перевіряє конфігурацію та записи audit. Той самий шлях налаштування Ring 0
    також охоплюється в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke перевірка вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6 і що
  transcript асистента зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env-змінні allowlist, описані нижче.

## Спеціальні ранери для QA

Ці команди стоять поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR
і через ручний dispatch з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch із mock parity gate, live Matrix lane і
керованим Convex live Telegram lane як паралельними jobs. `OpenClaw Release Checks`
запускає ті самі lane перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker-и Gateway. Для `qa-channel` типовим є concurrency 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування
    кількості worker-ів або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнав невдачі. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і protocol-mock без заміни lane `mock-openai`,
    орієнтованого на сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані автентифікації QA, практичні для guest:
    ключі провайдерів через env, шлях до конфігурації live-провайдера QA і `CODEX_HOME`,
    якщо він наявний.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований робочий простір.
  - Записує звичайний звіт і підсумок QA, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської роботи в QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний onboarding з ключем OpenAI API, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення Plugin встановлює runtime-залежності на вимогу,
    запускає doctor і один локальний хід агента проти mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    пакетного встановлення з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke для зібраного застосунку для transcript-ів із
    вбудованим runtime context. Перевіряє, що прихований runtime context OpenClaw
    зберігається як недоступне для відображення кастомне повідомлення замість витоку у видимий хід користувача,
    потім підставляє уражений зламаний JSONL сесії та перевіряє, що
    `openclaw doctor --fix` переписує його в активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    QA lane live Telegram із цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`, а також
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і secret ролі Convex присутні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions надає цей lane як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Він не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, а потім вмикає bundled channel/plugins через зміни конфігурації.
  - Перевіряє, що виявлення setup залишає runtime-залежності
    не налаштованих Plugin відсутніми, що перший налаштований запуск Gateway або doctor
    встановлює runtime-залежності кожного bundled Plugin на вимогу, і що другий restart
    не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базову версію, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, а потім перевіряє, що
    post-update doctor у candidate відновлює runtime-залежності bundled channel без
    postinstall-виправлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення пакетного встановлення в guest-системах Parallels. Для кожної
    вибраної платформи спочатку встановлюється потрібний базовий пакет, а потім у тій самій guest-системі
    запускається встановлена команда `openclaw update` і перевіряються встановлена версія,
    статус оновлення, готовність Gateway і один локальний хід агента.
  - Під час ітерацій над однією guest-системою використовуйте `--platform macos`, `--platform windows` або `--platform linux`.
    Використовуйте `--json` для шляху до підсумкового артефакту і статусу кожного lane.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels
    не з’їли решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/runtime
    repair залежностей на холодній guest-системі; це все ще нормальний стан, якщо вкладений
    npm debug log продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke lane Parallels для
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакетів або стану guest Gateway.
  - Post-update proof запускає звичайну поверхню bundled Plugin, оскільки
    capability facades, такі як speech, генерація зображень і
    розуміння медіа, завантажуються через bundled runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA host наразі призначений лише для repo/dev. Пакетні встановлення OpenClaw не постачають
    `qa-lab`, тому не відкривають `openclaw qa`.
  - Checkout-и репозиторію завантажують bundled runner напряму; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки lane локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і об’єднаний лог виводу stdout/stderr у `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і примусово застосовує жорсткий timeout виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а у випадку збоїв включається команда відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних пулованих облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на пуловані lease.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнав невдачі. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати username Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання від driver до спостережуваної відповіді SUT.

Live transport lane використовують один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним набором QA і не входить до матриці покриття live transport.

| Lane     | Canary | Фільтрація за згадуванням | Блокування allowlist | Відповідь верхнього рівня | Відновлення після restart | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | ------------------------- | -------------------- | ------------------------- | ------------------------- | -------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x                         | x                    | x                         | x                         | x                          | x               | x                          |              |
| Telegram | x      |                           |                      |                           |                           |                            |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивний lease із пулу на базі Convex, надсилає Heartbeat
для цього lease, поки lane виконується, і звільняє lease під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL Convex `http://` лише для локальної розробки.

У звичайному режимі роботи `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди мейнтейнера (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для мейнтейнерів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети брокера,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машиночитаного виводу в скриптах і CI
утилітах.

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
  - Захист активного lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим chat id Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортний адаптер для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий top-level-командний простір QA, якщо спільний host `qa-lab`
може керувати цим потоком.

`qa-lab` керує спільною механікою host:

- кореневою командою `openclaw qa`
- запуском і завершенням suite
- паралелізмом worker-ів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Runner Plugin володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway конфігурується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcript-и й нормалізований транспортний стан
- як виконуються дії, прив’язані до транспорту
- як обробляються транспортно-специфічні reset або cleanup

Мінімальний поріг прийняття для нового каналу:

1. Залишити `qa-lab` власником спільного кореня `qa`.
2. Реалізувати transport runner на спільному seam host `qa-lab`.
3. Залишити транспортно-специфічну механіку всередині runner Plugin або harness каналу.
4. Монтувати runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner Plugin мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; ліниве виконання CLI і runner має бути винесене за окремі entrypoint.
5. Створювати або адаптувати markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Для нових сценаріїв використовувати загальні scenario helper-и.
7. Зберігати працездатність наявних alias сумісності, якщо тільки репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспортного каналу, залишайте її в runner Plugin або harness цього Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додавайте загальний helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій транспортно-специфічним і явно фіксуйте це в контракті сценарію.

Для нових сценаріїв бажані назви загальних helper-ів:

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

Нова робота над каналами має використовувати загальні назви helper-ів.
Alias сумісності існують, щоб уникнути міграції «в один день», а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shard-и в конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelisted node-тести `ui`, які охоплюються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація Gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, shard-и та scoped lane">

    - Нетаргетований `pnpm test` запускає дванадцять менших конфігурацій shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension витісняти не пов’язані набори.
    - `pnpm test --watch` усе ще використовує native root-граф проєктів `vitest.config.ts`, оскільки цикл watch із кількома shard не є практичним.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lane, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lane, коли diff зачіпає лише routable файли джерел/тестів; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
    - `pnpm check:changed` — це звичайний розумний локальний gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні lane typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають один прохід валідації extension, оскільки extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни пакета поза полем версії верхнього рівня.
    - Unit-тести з легкими імпортами з agents, commands, plugins, helper-ів auto-reply, `plugin-sdk` і подібних чистих утилітних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються в наявних lane.
    - Вибрані helper-вихідники `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких lane, тож редагування helper-ів уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для top-level helper-ів core, top-level integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на shard agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими імпортами не контролював увесь tail Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime
      context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії helper-ів для чистих меж маршрутизації та
      нормалізації.
    - Підтримуйте інтеграційні набори embedded runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка compaction все ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper-ів
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові значення пулу та ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, e2e і live config.
    - Root lane UI зберігає свій `jsdom` setup і optimizer, але теж запускається на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх процесів Node Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lane зачіпає diff.
    - Pre-commit hook виконує лише форматування. Він знову додає відформатовані файли до stage і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею роботи або push, коли
      вам потрібен розумний локальний gate. Зміни в публічному Plugin SDK і plugin-contract
      включають один прохід валідації extension.
    - `pnpm test:changed` маршрутизує через scoped lane, коли змінені шляхи
      чітко зіставляються з меншим набором.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом worker-ів.
    - Автомасштабування локальних worker-ів навмисно є консервативним і зменшує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли
      змінюється зв’язування тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      мати одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід детального розбору імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий режим профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані часу shard записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; shard-и CI з include-pattern
      додають назву shard, щоб відфільтровані shard можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      напряму mock-айте цей seam замість глибокого імпорту helper-ів runtime
      лише для того, щоб передати їх у `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з native шляхом root-project для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево,
      маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU основного потоку для
      накладних витрат старту та transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner-а для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичне навантаження повідомленнями gateway, пам’яттю та великими payload через шлях діагностичних подій
  - Виконує запит до `diagnostics.stability` через WS RPC Gateway
  - Охоплює helper-и збереження пакета діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS лишаються в межах бюджету тиску, а глибини черг на сесію знову зменшуються до нуля
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (smoke для gateway)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові параметри runtime:
  - Використовує `threads` Vitest з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість worker-ів (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в тихому режимі, щоб зменшити накладні витрати на вивід у консоль.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість worker-ів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути детальний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, спарювання Node і важчий мережевий стек
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
  - Перевіряє backend OpenShell у OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локальний CLI `openshell` і робочий Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний бінарний файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявляє зміни формату провайдера, особливості виклику tool, проблеми автентифікації та поведінку rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує логи bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (специфічна для провайдера): встановлюйте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для окремого live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдера видно як активні навіть тоді, коли захоплення консолі Vitest є тихим.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway негайно транслювалися під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Користуйтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зачіпаєте мережеву взаємодію Gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / специфічні збої провайдера / виклик tool: запускайте звужений `pnpm test:live`

## Live-тести (із доступом до мережі)

Для live-матриці моделей, smoke backend CLI, smoke ACP, harness
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також для обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Ранери Docker (необов’язкові перевірки «працює в Linux»)

Ці ранери Docker поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із profile-key всередині образу Docker репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочий простір (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runner-и типово мають менший smoke-ліміт, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше, вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для live Docker lane. Також він збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для E2E smoke-ранерів у контейнерах, які перевіряють зібраний застосунок. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як обмеження ресурсів не дають одночасно стартувати всім важким live-, npm-install- і multi-service lane. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker host має більший запас ресурсів. Runner типово виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає таймінги успішних lane у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках спочатку стартували довші lane. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane без збирання або запуску Docker.
- Smoke-ранери контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker runner-и live-моделей також bind-mount-ять лише потрібні home-каталоги CLI auth (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у home каталогу контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke bind для ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, із суворим покриттям OpenCode через `pnpm test:docker:live-acp-bind:opencode`)
- Smoke для backend CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює упакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з env-ref плюс типово Telegram, перевіряє, що doctor відновлює runtime deps активованого Plugin, і виконує один агентський хід проти mocked OpenAI. Використовуйте вже зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження transcript прихованого runtime context плюс виправлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Використовуйте вже зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke інсталятора: `bash scripts/test-install-sh-docker.sh` використовує один npm cache для своїх контейнерів root, update і direct-npm. Smoke оновлення типово бере npm `latest` як стабільну базову версію перед оновленням до tarball-кандидата. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи кешу з правами root не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними перезапусками.
- Install Smoke CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; локально запускайте скрипт без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke CLI для видалення спільного робочого простору agents: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає image з root Dockerfile, ініціалізує двох агентів з одним робочим простором в ізольованому home контейнера, виконує `agents delete --json` і перевіряє коректний JSON плюс поведінку зі збереженням робочого простору. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mocked сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` із `minimal` до `low`, потім примушує схему провайдера відхилити запит і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + smoke сирого notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у Pi bundle (реальний stdio MCP server + smoke allow/deny для вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron/subagent (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + alias `/plugin` + семантика restart для Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke оновлення Plugin без змін: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled Plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker runner image, один раз збирає та пакує OpenClaw на host, а потім монтує цей tarball у кожен Linux-сценарій встановлення. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть host rebuild після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate один раз попередньо пакує цей tarball, а потім розбиває перевірки bundled channel на незалежні lane, зокрема окремі lane оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити channel matrix під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Під час ітерацій звужуйте runtime deps bundled Plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати і повторно використовувати спільний image built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакування/встановлення, а не спільний runtime зібраного застосунку.

Docker runner-и live-моделей також bind-mount-ять поточний checkout у режимі лише для читання і
розміщують його в тимчасовому workdir усередині контейнера. Це дозволяє зберегти runtime
image компактним, водночас запускаючи Vitest точно проти вашого локального source/config.
Крок staging пропускає великі локальні кеші та вихідні дані збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
вихідні каталоги Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні worker-и каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити live-покриття Gateway з цього Docker lane.
`test:docker:openwebui` — це smoke перевірка сумісності вищого рівня: вона запускає
контейнер Gateway OpenClaw з увімкненими HTTP endpoint-ами, сумісними з OpenAI,
запускає зафіксований контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а Open WebUI може потребувати завершення власного cold-start налаштування.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded контейнер
Gateway, стартує другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутованих розмов, читання transcript, метадані вкладень,
поведінку черги live-подій, маршрутизацію outbound send, а також сповіщення у стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frame, тож smoke перевіряє те, що міст
справді виводить, а не лише те, що випадково показує конкретний клієнтський SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe server, виконує ізольований
хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke для ACP plain-language thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і source-иться перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, source-нуті з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішнього CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли CLI auth під `$HOME` монтуються в режимі лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний image `openclaw:local-live` для перезапусків, яким не потрібна нова збірка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt для перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити зафіксований тег image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Offline-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик tool через Gateway (mock OpenAI, реальний Gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Mock tool-calling через реальний Gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, які перевіряють прив’язку сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок tool, перенесення історії сесії та межі sandbox.

Майбутні eval мають спочатку залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів tool + порядку, читання файлів skill і прив’язки сесії.
- Невеликий набір сценаріїв, зосереджених на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-eval (opt-in, керовані env) лише після того, як безпечний для CI набір уже буде на місці.

## Contract-тести (форма Plugin і каналу)

Contract-тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
контракту інтерфейсу. Вони ітеруються по всіх виявлених Plugin і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці файли спільних seam і smoke; запускайте contract-команди явно,
коли зачіпаєте спільні поверхні каналу або провайдера.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт setup wizard
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID тредів
- **directory** - API каталогу/складу
- **group-policy** - Застосування групової політики

### Контракти статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Зондування статусу каналу
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/selection автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни export-ів або subpath у plugin-sdk
- Після додавання або зміни каналу чи Plugin провайдера
- Після рефакторингу реєстрації або виявлення Plugin

Contract-тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресійних тестів (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдера або фіксацію точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому рівню, який виявляє баг:
  - баг перетворення/відтворення запиту провайдера → direct models test
  - баг pipeline сесії/історії/tool у gateway → live smoke Gateway або безпечний для CI mock-тест Gateway
- Захисне правило обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову цільову сім’ю SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не могли бути тихо пропущені.

## Пов’язане

- [Live-тестування](/uk/help/testing-live)
- [CI](/uk/ci)
