---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + agent
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T10:46:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск усіх наборів на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу точковим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + probes інструментів/зображень Gateway): `pnpm test:live`
- Точково запустити один live-файл у тихому режимі: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід, а також невеликий probe у стилі читання файла.
    Моделі, метадані яких оголошують вхід `image`, також виконують маленький хід із зображенням.
    Вимкніть додаткові probes за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі матричні завдання Docker live-моделей,
    розбиті за провайдером.
  - Для точкових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`, а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів за розкладом/для релізів.
- Native Codex bind-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху app-server Codex, прив’язує синтетичний
    Slack DM за допомогою `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native binding plugin, а не через ACP.
- Smoke для harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Проганяє agent-turn-и Gateway через harness app-server Codex, який належить Plugin,
    перевіряє `/codex status` і `/codex models`, а також за замовчуванням виконує probes для image,
    cron MCP, sub-agent і Guardian. Вимкніть probe sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex.
    Для точкової перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після probe sub-agent, якщо тільки не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова belt-and-suspenders перевірка поверхні команди порятунку каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису аудиту/конфігурації.
- Docker smoke planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що резервний fuzzy planner перетворюється на аудований типізований запис конфігурації.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    валідує конфігурацію та перевіряє записи аудиту. Той самий шлях налаштування Ring 0
    також покривається в QA Lab за допомогою
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6, а
  транскрипт помічника зберігає нормалізоване `usage.cost`.

Порада: якщо вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env vars allowlist, описані нижче.

## QA-специфічні ранери

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм QA Lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і
з ручного виклику з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного виклику з mock parity gate, live Matrix lane та live Telegram lane під керуванням Convex як паралельні завдання. `OpenClaw Release Checks`
запускає ті самі lane-и перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    воркерами Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість воркерів, або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнав невдачі. Використовуйте `--allow-failures`, якщо
    хочете отримати артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`, що враховує сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA-входи автентифікації, практичні для гостьової системи:
    ключі провайдерів на основі env, шлях до конфігурації live-провайдера QA і `CODEX_HOME`, якщо він є.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний звіт + summary QA, а також журнали Multipass до
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в стилі оператора.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding OpenAI API-key, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний agent-turn проти змоканого OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    інсталяції з пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke для зібраного застосунку для transcript-ів
    вбудованого runtime context. Він перевіряє, що прихований runtime context OpenClaw
    зберігається як спеціальне повідомлення, що не відображається, замість витоку у видимий хід користувача,
    потім підкладає зламаний session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, запускає onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі облікові дані Telegram з env або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізів встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` разом із
    `OPENCLAW_QA_CONVEX_SITE_URL` і секретом ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - У GitHub Actions цей lane доступний як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує й установлює поточну збірку OpenClaw у Docker, запускає Gateway з налаштованим OpenAI, а потім вмикає bundled channel/plugins через зміни конфігурації.
  - Перевіряє, що виявлення налаштування залишає runtime-залежності
    не налаштованого Plugin відсутніми, перший налаштований запуск Gateway або doctor встановлює runtime-залежності кожного bundled Plugin на вимогу, а другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    виправляє runtime-залежності bundled channel без відновлення postinstall з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення встановленого пакета у гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний baseline package, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі й перевіряє встановлену
    версію, статус оновлення, готовність gateway та один локальний agent-turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерації над однією гостьовою системою. Використовуйте `--json` для шляху до summary artifact і
    статусу кожного lane.
  - За замовчуванням lane OpenAI використовує `openai/gpt-5.5` для live-доказу agent-turn.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте тривалі локальні запуски хостовим timeout, щоб збої транспорту Parallels не
    спожили решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane до `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10–15 хвилин на відновлення doctor/runtime-залежностей після оновлення на холодній гостьовій системі;
    це все ще нормальний стан, якщо вкладений npm debug log продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke lane-ами Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати через
    відновлення snapshot, обслуговування пакетів або стан guest Gateway.
  - Доказ після оновлення запускає звичайну поверхню bundled Plugin, оскільки
    capability facades, такі як speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть якщо сам
    agent-turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти одноразового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для repo/dev. Пакетні інсталяції OpenClaw не постачають `qa-lab`, тому не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки lane локально створює одноразових користувачів.
  - Записує звіт Matrix QA, summary, артефакт observed-events і комбінований журнал stdout/stderr до `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і застосовує жорсткий timeout виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (за замовчуванням 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а помилки містять команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте режим env, або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнав невдачі. Використовуйте `--allow-failures`, якщо хочете отримати артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, при цьому бот SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, summary і артефакт observed-messages до `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостереженої відповіді SUT.

Live transport lane-и мають один спільний стандартний контракт, щоб нові транспорти не дрейфували:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну lease із пулу на базі Convex, надсилає Heartbeat для
цієї lease під час виконання lane і звільняє lease під час завершення роботи.

Опорний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди maintainer (додати/видалити/перелічити пул) вимагають
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer-ів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL-адресу сайту Convex, секрети broker,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і утилітах CI.

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
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA вимагає рівно двох речей:

1. Адаптер транспорту для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний root верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` володіє спільною механікою хоста:

- кореневою командою `openclaw qa`
- запуском і завершенням набору
- concurrency воркерів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner Plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як ін’єктуються вхідні події
- як спостерігаються вихідні повідомлення
- як відкриваються transcript-и та нормалізований стан транспорту
- як виконуються дії, підтримувані транспортом
- як обробляються специфічні для транспорту reset або cleanup

Мінімальний поріг впровадження для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на межі спільного хоста `qa-lab`.
3. Зберігайте специфічну для транспорту механіку всередині runner Plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючу кореневу команду.
   Runner Plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic scenario helpers для нових сценаріїв.
7. Зберігайте наявні compatibility aliases працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, зберігайте її в runner Plugin або harness цього Plugin.
- Якщо сценарію потрібна нова можливість, яку може використати більше ніж один канал, додайте generic helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, зберігайте сценарій специфічним для цього транспорту й явно зазначайте це в контракті сценарію.

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

Нова робота над каналами має використовувати generic helper names.
Compatibility aliases існують, щоб уникнути міграції типу flag day, а не як модель
для написання нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання flaky/cost):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelist-нуті node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Не потребує реальних ключів
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, shard-и та scoped lane-и">

    - Нетаргетовані запуски `pnpm test` використовують дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі `auto-reply`/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує native граф проєктів root `vitest.config.ts`, оскільки цикл watch із кількома shard не є практичним.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lane-и, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lane-и, коли diff торкається лише routable файлів source/test; редагування config/setup усе ще повертаються до широкого повторного запуску root project.
    - `pnpm check:changed` — це звичний smart local gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні lane-и typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають один прохід валідації extension, оскільки extensions залежать від цих контрактів core. Бампи версій лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, що відхиляє зміни пакета поза полем версії верхнього рівня.
    - Зміни live Docker ACP harness запускають фокусований локальний gate: shell syntax для live Docker auth scripts, dry-run live Docker scheduler, unit-тести ACP bind і тести extension ACPX. Зміни `package.json` включаються лише тоді, коли diff обмежено `scripts["test:docker:live-*"]`; зміни dependencies, exports, versions та інших поверхонь пакета все ще використовують ширші guard-и.
    - Import-light unit-тести з agents, commands, plugins, helper-ів `auto-reply`, `plugin-sdk` та подібних чистих utility-областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lane-ах.
    - Вибрані helper-файли source з `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling test у цих light lane-ах, тож зміни helper-ів не вимагають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має виділені bucket-и для helper-ів core верхнього рівня, integration-тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. У CI піддерево reply додатково розділяється на shard-и agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім Node tail.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та нормалізації.
    - Підтримуйте в робочому стані integration-набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction як і раніше проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper-ів
      не є достатньою заміною цим integration-шляхам.

  </Accordion>

  <Accordion title="Типові значення пулу та ізоляції Vitest">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, а також у конфігураціях e2e і live.
    - Root lane UI зберігає свій `jsdom` setup та optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидкі локальні ітерації">

    - `pnpm changed:lanes` показує, які архітектурні lane-и запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до stage і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед передачею роботи або push, коли
      вам потрібен smart local gate. Зміни публічного Plugin SDK і plugin-contract
      включають один прохід валідації extension.
    - `pnpm test:changed` маршрутизує через scoped lane-и, коли змінені шляхи
      чисто зіставляються з меншим набором.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом воркерів.
    - Автомасштабування локальних воркерів навмисно консервативне і знижує навантаження,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними,
      коли змінюється wiring тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпортів, а також
      вивід розбивки імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий профільований вигляд
      файлами, зміненими відносно `origin/main`.
    - Дані таймінгів shard записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски цілої конфігурації використовують шлях до config як ключ; shard-и CI за include-pattern
      додають ім’я shard, щоб відфільтровані shard-и можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      зберігайте важкі залежності за вузькою локальною межею `*.runtime.ts` і
      мокайте цю межу напряму замість глибокого імпорту helper-ів runtime лише
      для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з native шляхом root-project для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркає поточне
      брудне дерево, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль main thread для
      накладних витрат запуску та transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap для runner
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один воркер
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичні churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запити до `diagnostics.stability` через WS RPC Gateway
  - Покриває helper-и збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS не перевищують бюджет тиску, а глибини черг на рівні сесії повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повному набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує adaptive workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову увімкнути докладний вивід у консоль.
- Обсяг:
  - End-to-end поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing Node і важче мережеве навантаження
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Не потребує реальних ключів
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через fs bridge sandbox
- Очікування:
  - Лише за явним бажанням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику tools, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API key.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний home directory.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає журнали bootstrap gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові журнали.
- Ротація API key (специфічна для провайдера): встановіть `*_API_KEYS` у форматі comma/semicolon або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдера залишаються видимо активними, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки progress провайдера/gateway транслюються негайно під час live-запусків.
  - Налаштовуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтесь мережевої взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / специфічні для провайдера збої / виклик tools: запускайте звужений `pnpm test:live`

## Live (мережеві) тести

Для матриці live-моделей, smoke-тестів CLI backend, smoke-тестів ACP, harness Codex app-server
та всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл з ключем профілю всередині Docker image репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації й workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням мають менший smoke-ліміт, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для live Docker lane-ів. Також він збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для E2E smoke-ранерів у контейнерах, які перевіряють зібраний застосунок. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають усім важким live, npm-install і multi-service lane-ам стартувати одночасно. За замовчуванням це 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. За замовчуванням runner виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, виводить статус кожні 30 секунд, зберігає таймінги успішних lane-ів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках запускати довші lane-и першими. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane-ів без збирання й запуску Docker.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-mount-ять лише потрібні home-каталоги для автентифікації CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени, не змінюючи сховище автентифікації хоста:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням покриває Claude, Codex і Gemini, зі strict-покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke для harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding env-ref і за замовчуванням Telegram, перевіряє, що doctor відновлює runtime deps активованого Plugin, і запускає один змоканий agent-turn OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє, що збережений канал і Plugin після оновлення працюють, потім повертається на package `stable` і перевіряє статус оновлення.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження transcript прихованого runtime context, а також виправлення doctor для заторкнутих дубльованих гілок prompt-rewrite.
- Smoke глобальної інсталяції Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його за допомогою `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збирання на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує спільний npm cache для контейнерів root, update і direct-npm. За замовчуванням smoke оновлення використовує npm `latest` як stable baseline перед оновленням до tarball кандидата. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, що належать root, не маскували поведінку локальної інсталяції користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- CLI smoke видалення спільного workspace агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає root Dockerfile image, створює два агенти з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON плюс поведінку збереження workspace. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot браузерного CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium з raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URL-адреси посилань, clickable-елементи, підняті курсором, iframe refs і frame metadata.
- Мінімальна reasoning-регресія OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema й перевіряє, що сирі деталі з’являються в журналах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у Pi bundle (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke інсталяції, інсталяція/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте пакет за замовчуванням через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій інсталяції Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate попередньо пакує цей tarball один раз, а потім розбиває перевірки bundled channel на незалежні lane-и, включно з окремими lane-ами оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime deps bundled Plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний built-app image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретного набору, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакета/інсталяції, а не спільний runtime зібраного застосунку.

Docker-ранери live-моделей також bind-mount-ять поточний checkout у режимі лише для читання й
розгортають його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але водночас дозволяє запускати Vitest точно на вашому локальному source/config.
Крок staging пропускає великі локальні cache та результати збирання застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги
`.build` або вивід Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe-и gateway не запускали
реальні channel workers Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway live-покриття з цього Docker lane.
`test:docker:openwebui` — це smoke перевірка сумісності вищого рівня: вона запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoint, запускає
закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а Open WebUI може потребувати завершення власного cold-start налаштування.
Цей lane очікує придатний live key моделі, а `OPENCLAW_PROFILE_FILE`
(за замовчуванням `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` є навмисно детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded контейнер
Gateway, стартує другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих conversation, читання transcript, метадані вкладень,
поведінку черги live events, маршрутизацію outbound send і сповіщення про channel +
permissions у стилі Claude через реальний stdio міст MCP. Перевірка сповіщень
напряму аналізує сирі stdio MCP frames, тож smoke перевіряє те, що міст
фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live
key моделі. Він збирає Docker image репозиторію, запускає реальний probe server stdio MCP
усередині контейнера, матеріалізує цей сервер через вбудований runtime Pi bundle
MCP, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live
key моделі. Він запускає seeded Gateway з реальним probe server stdio MCP, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI-автентифікації
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих інсталяцій CLI всередині Docker
- Зовнішні каталоги/файли CLI-автентифікації в `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний image `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища profile, а не з env
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка документації

Запускайте перевірки документації після змін у документації: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечно для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик tools Gateway (mock OpenAI, реальний gateway + agent loop): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, запис config + auth enforced): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності agent (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності agent»:

- Mock-виклик tools через реальний gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end потоки wizard, які перевіряють wiring сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills перелічені в prompt, чи вибирає agent правильний Skill (або уникає нерелевантних)?
- **Compliance:** чи читає agent `SKILL.md` перед використанням і чи дотримується потрібних кроків/аргументів?
- **Workflow contracts:** багатохідні сценарії, які перевіряють порядок tools, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають спочатку залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів tools + їхнього порядку, читання Skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, сфокусованих на Skills (використовувати чи уникати, gating, injection у prompt).
- Необов’язкові live-оцінювання (opt-in, з керуванням через env) лише після того, як з’явиться безпечний для CI набір.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
інтерфейсному контракту. Вони проходять по всіх виявлених Plugins і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтесь спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт wizard налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Застосування політики групи

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Проби статусу channel
- **registry** - Форма registry Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/добір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Wizard налаштування

### Коли запускати

- Після змін exports або subpath у plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI й не потребують реальних API key.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додавайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), зберігайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу націлюванню на найменший шар, який виявляє помилку:
  - помилка конвертації/відтворення запиту provider → direct models test
  - помилка pipeline session/history/tool у gateway → gateway live smoke або безпечний для CI gateway mock test
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
