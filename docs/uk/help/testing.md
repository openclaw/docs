---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, виконавці Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-28T02:07:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2511d646a4e86fa0b7c17eb94dcc4931b88abb510a67f31e155f7da3f41279d
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
виконавців Docker. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, що використовується сценаріями з репозиторію.

Ця сторінка охоплює запуск звичайних наборів тестів і виконавців Docker/Parallels. Розділ про виконавці, специфічні для QA, нижче ([Виконавці, специфічні для QA](#qa-specific-runners)) перелічує конкретні виклики `qa` і посилається назад на наведені вище довідкові матеріали.
</Note>

## Швидкий старт

У більшості випадків:

- Повний бар’єр перевірок (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- Сайт QA на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете мати додаткову впевненість:

- Бар’єр покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker sweep live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає текстовий хід плюс невелику перевірку в стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також запускають невеликий хід із зображенням.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розшардовані за провайдером.
  - Для цільових повторних запусків у CI dispatch-те `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів scheduled/release.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane на шляху app-server Codex, прив’язує синтетичний
    Slack DM за допомогою `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення із зображенням
    проходять через native binding Plugin, а не через ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness app-server Codex, що належить Plugin,
    перевіряє `/codex status` і `/codex models`, а також типово виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої
    app-server Codex. Для цільової перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke перевірки команди rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова opt-in перевірка «про всяк випадок» для поверхні команд rescue у message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну
    зміну моделі, надсилає відповідь `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що резервний fuzzy planner перетворюється на audited typed
    запис конфігурації.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord Plugin + SecretRef,
    валідує конфігурацію та перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke перевірка вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6, а в
  transcript помічника зберігається нормалізоване `usage.cost`.

<Tip>
Коли вам потрібен лише один проблемний випадок, віддавайте перевагу звуженню live-тестів за допомогою env-змінних allowlist, описаних нижче.
</Tip>

## Виконавці, специфічні для QA

Ці команди використовуються поряд з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається на відповідних PR і
з ручного dispatch з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch з mock parity gate, live Matrix lane,
live Telegram lane під керуванням Convex і live Discord lane під керуванням Convex як
паралельні jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і значення manual workflow input за замовчуванням залишаються
`all`; ручний dispatch може шардити `all` на jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
швидкі Matrix і Telegram lanes перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. `qa-channel` типово використовує concurrency 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старого послідовного lane.
  - Повертає ненульовий код завершення, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без помилкового коду завершення.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`,
    що враховує сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, які практично використовувати в guest:
    ключі провайдерів через env, шлях до конфігурації QA live provider і `CODEX_HOME`,
    якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайні QA report + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає сайт QA на базі Docker для операторської роботи з QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний onboarding OpenAI API key, налаштовує Telegram
    за замовчуванням, перевіряє, що увімкнення Plugin встановлює runtime-залежності за потреби,
    запускає doctor і виконує один локальний хід агента проти mock OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    встановлення з пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke built-app для вбудованих runtime context
    transcript. Він перевіряє, що прихований runtime context OpenClaw зберігається як
    недемонстроване custom message замість витоку у видимий user turn,
    потім підставляє уражений зламаний session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидата пакета OpenClaw у Docker, виконує onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - Типово використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати визначений локальний tarball замість
    встановлення з реєстру.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret Convex присутні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions також надає цей lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренду CI-облікових даних Convex.
- GitHub Actions також надає `Package Acceptance` для побічної product-перевірки
  одного кандидата пакета. Він приймає довірений ref, опубліковану npm spec,
  HTTPS tarball URL із SHA-256 або артефакт tarball з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний планувальник Docker E2E з профілями lane smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити workflow Telegram QA
  проти того самого артефакта `package-under-test`.
  - Остання beta product-перевірка:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Для перевірки точного tarball URL потрібен digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Перевірка артефакта завантажує артефакт tarball з іншого run Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує й встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/Plugin через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає runtime-залежності
    не налаштованих Plugin відсутніми, перший налаштований запуск Gateway або doctor
    встановлює runtime-залежності кожного вбудованого Plugin за потреби, а другий
    перезапуск не перевстановлює залежності, які вже були активовані.
  - Також установлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor кандидата відновлює runtime-залежності вбудованого channel
    без postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke перевірки оновлення встановленого пакета у Parallels guests. Кожна
    вибрана платформа спочатку встановлює запитаний baseline package, а потім запускає
    команду встановленого `openclaw update` у тому ж guest і перевіряє
    встановлену версію, статус оновлення, готовність gateway та один локальний
    хід агента.
  - Під час ітерацій над одним guest використовуйте `--platform macos`, `--platform windows` або `--platform linux`.
    Використовуйте `--json` для шляху до summary artifact і статусу
    кожного lane.
  - За замовчуванням lane OpenAI використовує `openai/gpt-5.5` для live-перевірки ходу агента.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски host timeout, щоб збої транспорту Parallels
    не спожили решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane до `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/
    відновлення runtime-залежностей у холодному guest; це все ще вважається нормальним станом, якщо
    вкладений журнал налагодження npm продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke lanes Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, видачі пакета або стану gateway guest.
  - Post-update proof запускає звичайну поверхню вбудованого Plugin, оскільки
    capability facades, такі як мовлення, генерація зображень і
    розуміння медіа, завантажуються через вбудовані runtime API навіть тоді, коли сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker. Лише checkout вихідного коду — встановлені пакети не постачають `qa-lab`.
  - Повний CLI, каталог profile/scenario, env-змінні та структура artifact: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути спільні оренди.
  - Повертає ненульовий код завершення, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без помилкового коду завершення.
  - Потребує двох різних ботів у тій самій приватній групі, при цьому SUT bot має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати трафік ботів у групі.
  - Записує Telegram QA report, summary і artifact observed-messages до `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостереженої відповіді SUT.

Live transport lanes мають один спільний стандартний контракт, щоб нові транспорти не дрейфували; матриця покриття для кожного lane міститься в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки lane виконується, і звільняє оренду під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Команди адміністрування для maintainer (add/remove/list у пулі) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
секретних значень. Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI
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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання channel до QA

Архітектура та назви scenario-helper для нових адаптерів channel описані в [QA overview → Adding a channel](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і написати сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростаючий реалізм» (і зростаючу нестабільність/вартість):

### Unit / integration (типовий режим)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати шарди multi-project у конфігурації для кожного проєкту для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit-тести запускаються в окремому шарді `unit-ui`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресійні тести для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує піковий RSS на завантажених машинах і не дозволяє роботі auto-reply/extension заважати не пов’язаним наборам.
    - `pnpm test --watch` усе ще використовує граф проєктів native root `vitest.config.ts`, оскільки цикл watch для багатьох шардів є непрактичним.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні source mappings і локальні dependents графа імпортів. Зміни config/setup/package не запускають широкі тести, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний бар’єр перевірок для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для доказу тестування викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версії лише в metadata релізу запускає цільові перевірки version/config/root-dependency, із guard, який відхиляє зміни package поза полем версії верхнього рівня.
    - Зміни в live Docker ACP harness запускають цільові перевірки: shell syntax для live Docker auth-скриптів і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependency, export, version та інших поверхонь package і далі використовують ширші guard.
    - Unit-тести з легкими імпортами для agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих утилітних зон маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних lanes.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed mode з явними сусідніми тестами в цих легких lanes, тому зміни helper уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має окремі bucket для top-level core helpers, top-level integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один bucket із важкими імпортами не контролював увесь хвіст Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте входи виявлення message-tool або runtime
      context для Compaction, зберігайте обидва рівні покриття.
    - Додавайте цільові регресійні тести helper для чистих меж
      маршрутизації та нормалізації.
    - Підтримуйте в робочому стані integration-набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction, як і раніше, проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише на рівні helper
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Пули Vitest і типові значення ізоляції">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, e2e і live config.
    - Root lane UI зберігає свій `jsdom` setup і optimizer, але теж працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидкі локальні ітерації">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає до staging відформатовані файли і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли вам
      потрібен розумний локальний бар’єр перевірок.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею кількості workers.
    - Автоматичне масштабування локальних workers навмисно є консервативним і знижує навантаження,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/файли конфігурації як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed mode залишалися коректними, коли
      змінюється wiring тестів.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту плюс
      вивід розбивки імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання файлами,
      зміненими відносно `origin/main`.
    - Дані про час виконання shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; шарди CI
      з include-pattern додають назву shard, щоб відфільтровані шарди можна було
      відстежувати окремо.
    - Коли один «гарячий» тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      напряму мокайте цей seam замість глибокого імпорту runtime helper лише
      для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native root-project path для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для
      старту Vitest/Vite і накладних витрат transform.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
      unit-набору з вимкненим паралелізмом по файлах.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Пропускає синтетичне навантаження повідомленнями gateway, пам’яттю та великими payload через шлях діагностичних подій
  - Виконує запит `diagnostics.stability` через Gateway WS RPC
  - Охоплює helper збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS лишаються в межах бюджету тиску, а глибини черг для кожної сесії знову спадають до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих Plugin у `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і в решті репозиторію.
  - Використовує адаптивних workers (CI: до 2, локально: типово 1).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати на I/O консолі.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pairing Node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє канонічну поведінку віддаленої файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і справного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб указати нестандартний двійковий файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих Plugin у `extensions/`
- Типове значення: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно нестабільний для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски завантажують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-fixtures не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає журнали bootstrap gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову бачити повні стартові журнали.
- Ротація API-ключів (залежно від провайдера): встановлюйте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдера помітно активні, навіть коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway відразу транслювалися під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтесь мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / специфічні збої провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke перевірок backend CLI, ACP smoke, harness
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також для обробки облікових даних у live-запусках — див.
[Тестування — live-набори](/uk/help/testing-live).

## Виконавці Docker (необов’язкові перевірки «працює в Linux»)

Ці виконавці Docker поділяються на дві групи:

- Виконавці live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (а також завантажують `~/.profile`, якщо він змонтований). Відповідні локальні entrypoint: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Виконавці Docker live за замовчуванням мають менший ліміт smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два image `scripts/e2e/Dockerfile`. Базовий image — це лише виконавець Node/Git для lane встановлення/оновлення/залежностей Plugin; ці lanes монтують попередньо зібраний tarball. Функціональний image встановлює той самий tarball у `/app` для lane функціональності built-app. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а ліміти ресурсів не дозволяють усім важким live, npm-install і multi-service lanes стартувати одночасно. Якщо один lane важчий за активні ліміти, scheduler все одно може запустити його, коли пул порожній, і потім триматиме його запущеним окремо, доки знову не з’явиться доступна ємність. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. За замовчуванням runner виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає час виконання успішних lane у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані, щоб у наступних запусках спочатку стартували довші lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane без збірки або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести план CI для вибраних lane, потреб package/image та облікових даних.
- `Package Acceptance` — це нативний для GitHub бар’єр перевірки пакета для питання «чи працює цей встановлюваний tarball як продукт?». Він визначає один кандидат пакета з `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E lanes проти саме цього tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені workflow/скрипти harness, а `package_ref` вибирає вихідний commit/branch/tag для пакування, коли `source=ref`; це дозволяє поточній логіці acceptance перевіряти старіші довірені commit. Профілі впорядковано за шириною охоплення: `smoke` — це швидке встановлення/channel/agent плюс gateway/config, `package` — це контракт package/update/Plugin і типова native заміна для більшості покриття package/update Parallels, `product` додає MCP channels, cron/subagent cleanup, OpenAI web search і OpenWebUI, а `full` запускає Docker-частини шляху release з OpenWebUI. Перевірка release запускає спеціальну різницю package (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, оскільки Docker-частини шляху release вже покривають суміжні lanes package/update/Plugin. Цільові команди повторного запуску GitHub Docker, згенеровані з artifact, включають попередні входи artifact пакета та підготовленого image, коли вони доступні, тому для невдалих lane можна уникнути повторної збірки пакета та image.
- Перевірки build і release запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичним зібраним графом від `dist/entry.js` і `dist/cli/run-main.js` і завершується з помилкою, якщо імпорти старту до dispatch статично імпортують залежності package, такі як Commander, prompt UI, undici або logging, до dispatch команди; він також утримує зібраний run chunk gateway у межах бюджету й відхиляє статичні імпорти відомих холодних шляхів gateway. Smoke перевірки пакованого CLI також охоплюють root help, onboard help, doctor help, status, schema config і команду списку моделей.
- Legacy-сумісність `Package Acceptance` обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness терпимо ставиться лише до прогалин у метаданих shipped-package: пропущені приватні записи інвентарю QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git fixture, похідному від tarball, відсутній збережений `update.channel`, застарілі розташування записів встановлення Plugin, відсутнє збереження записів встановлення marketplace і міграція метаданих config під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи вважаються суворими помилками.
- Виконавці container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Виконавці Docker для live-моделей також bind-mount лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у сховищі автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, із суворим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke перевірка CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke перевірка harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke перевірка спостережуваності: `pnpm qa:otel:smoke` — це приватний lane QA для checkout вихідного коду. Його навмисно не включено до Docker lane релізу пакета, оскільки npm tarball не містить QA Lab.
- Smoke перевірка live Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke перевірка onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює runtime-залежності активованого Plugin, і запускає один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову хоста через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, або змініть channel через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перевірка перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений channel і роботу Plugin після оновлення, а потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke перевірка runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime context плюс відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів image замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку хоста через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, або скопіюйте `dist/` зі зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує спільний кеш npm для своїх контейнерів root, update і direct-npm. Smoke перевірка оновлення типово використовує npm `latest` як стабільний baseline перед оновленням до tarball кандидата. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки installer без root зберігають ізольований кеш npm, щоб записи кешу, які належать root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними перезапусками.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke перевірка CLI для видалення agents із shared workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає root Dockerfile image, створює два agent із одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженням workspace. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke перевірка snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E image плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролі CDP охоплюють URL посилань, clickables, підняті курсором, iframe refs і метадані frame.
- Мінімальна регресійна перевірка reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` із `minimal` до `low`, потім примусово викликає відхилення schema провайдера і перевіряє, що сирі деталі з’являються в журналах Gateway.
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke перевірка allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke перевірка встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте package за замовчуванням через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke перевірка незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke перевірка метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованого Plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker image runner, один раз збирає та пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову хоста після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, або вкажіть наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний агрегат Docker і частини bundled-channel шляху релізу попередньо пакують цей tarball один раз, а потім розбивають перевірки bundled channel на незалежні lanes, включно з окремими lanes оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Частини релізу поділяють smoke перевірки channel, цілі оновлення та контракти setup/runtime на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; агрегатна частина `bundled-channels` залишається доступною для ручних повторних запусків. Workflow релізу також поділяє частини installer провайдерів і частини встановлення/видалення вбудованих Plugin; застарілі частини `package-update`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними псевдонімами для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю channel під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime-залежності вбудованого Plugin під час ітерації, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати та повторно використати спільний функціональний image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних наборів, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, як і раніше, мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Тести QR та installer у Docker зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime built-app.

Виконавці Docker для live-моделей також bind-mount поточний checkout у режимі лише для читання і
розгортають його в тимчасовий workdir всередині контейнера. Це дозволяє зберігати runtime
image компактним, але все одно запускати Vitest проти вашого точного локального вихідного коду/config.
Крок розгортання пропускає великі локальні кеші та артефакти збірки застосунку, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунку каталоги `.build` або
вивід Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки gateway не запускали
реальні працівники channel Telegram/Discord/etc. усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цього Docker lane.
`test:docker:openwebui` — це суміснісна smoke перевірка вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
image Open WebUI, а самому Open WebUI — завершити власне cold-start налаштування.
Цей lane очікує наявність придатного live-ключа моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
контейнер, запускає другий контейнер, який піднімає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення в стилі Claude про channel +
дозволи через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо перевіряє сирі кадри stdio MCP, тож smoke перевірка валідує те, що
міст справді випромінює, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live-
ключа моделі. Він збирає Docker image репозиторію, запускає реальний сервер перевірки stdio MCP
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP пакета Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live-
ключа моделі. Він запускає seeded Gateway з реальним сервером перевірки stdio MCP, виконує
ізольований хід cron і one-shot дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна smoke перевірка ACP thread простою мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для валідації маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і завантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, завантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування автентифікації зовнішніх CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI в `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Можна перевизначити вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke перевірки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke перевірка Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка коректності документації

Після змін у документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну валідацію якірних посилань Mintlify, коли вам також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (змоканий OpenAI, реальний цикл gateway + агент): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис config + примусове застосування auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «evals надійності агента»:

- Змоканий виклик інструментів через реальний цикл gateway + агент (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють підключення сесії та вплив на config (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/аргументів?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals мають спочатку залишатися детермінованими:

- Виконавець сценаріїв, що використовує mock-провайдерів для перевірки викликів інструментів + порядку, читання skill-файлів і підключення сесії.
- Невеликий набір сценаріїв, сфокусованих на skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live evals (opt-in, з керуванням через env) — лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає
своєму інтерфейсному контракту. Вони проходять по всіх виявлених plugins і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці файли спільних seam і smoke; запускайте команди контрактів явно,
коли змінюєте спільні поверхні channel або провайдера.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка thread ID
- **directory** - API каталогу/складу
- **group-policy** - Застосування групової політики

### Контракти статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма реєстру Plugin

### Контракти провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/добір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни channel чи Plugin провайдера
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену у live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдера або фіксацію точного перетворення форми запиту)
- Якщо проблема за своєю природою лише для live (rate limit, політики auth), зберігайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому рівню, який вловлює баг:
  - баг перетворення/повторення запиту провайдера → тест прямих моделей
  - баг конвеєра сесії/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментами обходу відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язані матеріали

- [Live-тестування](/uk/help/testing-live)
- [CI](/uk/ci)
