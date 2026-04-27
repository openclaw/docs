---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для багів моделей/провайдерів
    - Налагодження поведінки gateway та агентів
summary: 'Набір для тестування: модульні/e2e/live набори, Docker-ранери та що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-27T12:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f91deebbf835100826f77e36cba64ae0b35dc0c6a5b4cad0b8f360099c4259bf
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і чого він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести виявляють облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

## Швидкий початок

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл watch для Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-смуга на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більшої впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потребує реальних облікових даних):

- Live-набір (моделі + gateway-проби інструментів/зображень): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-обхід live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику пробу у стилі читання файла.
    Моделі, чиї метадані оголошують вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові проби через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі матричні Docker-завдання для live-моделей,
    розбиті за провайдером.
  - Для цільових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    запланованих/релізних викликачів.
- Native Codex bind-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker-smoke live-смуги проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і вкладення із зображенням
    маршрутизуються через нативну прив’язку plugin, а не через ACP.
- Smoke для app-server harness Codex: `pnpm test:docker:live-codex-harness`
  - Запускає ходи gateway-агента через app-server harness Codex, що належить plugin,
    перевіряє `/codex status` і `/codex models`, і типово виконує проби image,
    cron MCP, субагента та Guardian. Вимкніть пробу субагента через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої
    app-server Codex. Для цільової перевірки субагента вимкніть інші проби:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після проби субагента, якщо тільки
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` не встановлено.
- Smoke команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Опційна додаткова перевірка поверхні команди порятунку каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу стійку зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях аудиту/запису конфігурації.
- Docker-smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що нечіткий резервний планувальник транслюється в перевірений
    типізований запис конфігурації.
- Docker-smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Запускається з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує запис налаштування/моделі/агента/Discord plugin + SecretRef,
    валідує конфігурацію та перевіряє записи аудиту. Той самий шлях налаштування Ring 0
    також покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє про Moonshot/K2.6 і що
  транскрипт помічника зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один проблемний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розміщені поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab у виділених workflows. `Parity gate` запускається для відповідних PR
і з ручного dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch із mock parity gate, live Matrix lane,
live Telegram lane під керуванням Convex і live Discord lane під керуванням Convex як
паралельні завдання. Заплановані QA та релізні перевірки явно передають Matrix `--profile fast`,
тоді як типове значення CLI Matrix і ручного входу workflow залишається `all`; ручний dispatch може розбивати
`all` на завдання `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
швидкі Matrix і Telegram lane перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на базі репозиторію безпосередньо на хості.
  - Типово запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker-процесами gateway. `qa-channel` типово використовує concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість worker-процесів, або `--concurrency 1` для старішої послідовної смуги.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без помилкового коду завершення.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстурами та макетами протоколу без заміни сценарно-орієнтованої
    смуги `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані входи автентифікації QA, практичні для гостя:
    ключі провайдера на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гість міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт і підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний онбординг OpenAI API-key, типово налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює залежності середовища виконання на вимогу,
    запускає doctor і виконує один локальний хід агента проти змоканого кінцевого пункту OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму смугу
    встановлення з пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker-smoke для зібраного застосунку для вбудованих
    транскриптів контексту середовища виконання. Він перевіряє, що прихований контекст середовища виконання OpenClaw
    зберігається як недисплейне кастомне повідомлення замість витоку у видимий хід користувача,
    потім сіє уражений зламаний JSONL сесії та перевіряє, що
    `openclaw doctor --fix` переписує його в активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Установлює кандидатний пакет OpenClaw у Docker, запускає онбординг установленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим установленим пакетом як Gateway SUT.
  - Типово використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; установіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати локальний tarball, що розв’язався, замість
    встановлення з реєстру.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізів установіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет Convex присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї смуги.
  - GitHub Actions також надає цю смугу як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Він не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для побічного доказу продукту
  щодо одного кандидатного пакета. Він приймає довірений ref, опублікований npm spec,
  URL HTTPS tarball плюс SHA-256 або артефакт tarball з іншого запуску,
  вивантажує нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler з профілями смуг smoke, package, product, full або custom.
  Установіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
  - Останній beta proof продукту:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Для proof із точною URL tarball потрібен digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Proof артефакта завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає неналаштовані залежності
    середовища виконання plugin відсутніми, що перший налаштований запуск Gateway або doctor
    встановлює залежності середовища виконання кожного вбудованого plugin на вимогу, і що другий перезапуск
    не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базову версію, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor кандидата відновлює залежності середовища виконання вбудованого channel без
    postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає smoke перевірки оновлення нативного встановленого пакета у гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім виконує
    встановлену команду `openclaw update` у тій самій гостьовій системі та перевіряє встановлену
    версію, статус оновлення, готовність gateway і один локальний хід агента.
  - Під час ітерацій над однією гостьовою системою використовуйте `--platform macos`, `--platform windows` або `--platform linux`.
    Використовуйте `--json` для шляху до підсумкового артефакту та статусу
    кожної смуги.
  - Смуга OpenAI типово використовує `openai/gpt-5.5` для доказу live agent-turn.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо свідомо перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб збої транспорту Parallels
    не поглинули решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи смуг у `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10–15 хвилин на post-update doctor/відновлення
    залежностей середовища виконання на холодній гостьовій системі; це все ще нормально, якщо вкладений
    npm debug log просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими Parallels
    smoke-смугами для macOS, Windows або Linux. Вони використовують спільний стан VM і можуть конфліктувати під час
    відновлення snapshot, роздавання пакетів або стану guest gateway.
  - Пост-update proof запускає звичайну поверхню вбудованого plugin, тому що
    фасади можливостей, такі як мовлення, генерація зображень і
    розуміння медіа, завантажуються через API вбудованого середовища виконання навіть коли сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke
    тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA host наразі призначений лише для репозиторію/розробки. Встановлені пакети OpenClaw не постачають
    `qa-lab`, тож вони не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують вбудований runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Matrix plugin як транспортом SUT.
  - Типово використовує `--profile all`. Використовуйте `--profile fast --fail-fast` для критично важливого доказу транспорту перед релізом, або `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` під час шардінгу повного каталогу.
  - Типово використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, тому що смуга локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований журнал stdout/stderr у `.artifacts/qa-e2e/...`.
  - Типово виводить прогрес і примусово застосовує жорсткий timeout запуску через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` налаштовує негативні тихі вікна no-reply, а очищення обмежується через `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`; у разі збоїв додається команда відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи, використовуючи токени bot driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим id чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. Типово використовуйте режим env, або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулінгові оренди.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без помилкового коду завершення.
  - Потребує двох різних bot у тій самій приватній групі, причому bot SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що bot driver може спостерігати bot-трафік у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live transport lane використовують один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці покриття live
transport.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди під час роботи смуги та звільняє оренду під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URL для суто локальної розробки.

У звичайній роботі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди для мейнтейнерів (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні команди CLI для мейнтейнерів:

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
- `groupId` має бути рядком із числовим id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Набір сценаріїв, що перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, коли спільний хост `qa-lab` може
володіти цим потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команд `openclaw qa`
- запуском і завершенням набору
- паралелізмом worker-процесів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- аліасами сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють контрактом транспорту:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як ін’єктуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг прийняття для нового каналу такий:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному шві хоста `qa-lab`.
3. Утримуйте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; ледаче виконання CLI і runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Для нових сценаріїв використовуйте загальні допоміжні функції сценаріїв.
7. Зберігайте працездатність наявних аліасів сумісності, якщо тільки репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, зберігайте її в runner plugin або harness цього plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте загальний helper замість гілки, специфічної для каналу, у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно зазначайте це в контракті сценарію.

Бажані назви загальних helper для нових сценаріїв:

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

Аліаси сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота з каналами має використовувати загальні назви helper.
Аліаси сумісності існують, щоб уникнути міграції за принципом flag day, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростаючий реалізм» (і зростаючу крихкість/вартість):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: запуск без націлювання використовує набір шард-конфігів `vitest.full-*.config.ts` і може розгортати багатопроєктні шарди в конфіги окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit-тести запускаються в окремому шарді `unit-ui`
- Область:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped lanes">

    - Запуск `pnpm test` без націлювання використовує дванадцять менших шард-конфігів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу root project. Це знижує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати нерелевантні набори.
    - `pnpm test --watch` усе ще використовує нативний граф проєктів кореневого `vitest.config.ts`, тому що багатошардовий цикл watch непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені шляхи git у дешеві scoped lanes: прямі редагування тестів, сусідні файли `*.test.ts`, явні зіставлення вихідних файлів і локальні залежні файли з графа імпортів. Зміни config/setup/package не запускають широкі тести, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний gate перевірок для вузької роботи. Він класифікує diff у core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для доказу тестами викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency з guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Редагування harness live Docker ACP запускають цільові перевірки: shell syntax для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; залежності, export, version та інші редагування поверхні package усе ще використовують ширші guard.
    - Легкі щодо імпортів unit-тести з agents, commands, plugins, helper для auto-reply, `plugin-sdk` та подібних чистих утилітних ділянок маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані helper-вихідні файли `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих легких lanes, тож редагування helper уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для top-level core helper, top-level integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими імпортами не володів усім довгим хвостом Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте цільові helper-регресії для чистих меж маршрутизації та нормалізації.
    - Підтримуйте здоровими integration-набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; одних лише helper-тестів
      недостатньо як заміни цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення пулу та ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, конфігах e2e та live.
    - Коренева UI lane зберігає своє налаштування `jsdom` та optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staging і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передаванням роботи або push, коли
      вам потрібен розумний локальний gate перевірок.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що редагування harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею worker-процесів.
    - Автомасштабування локальних worker-процесів навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тож кілька паралельних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/файли конфігурації як
      `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється
      зв’язування тестів.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід розбивки імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий профільний перегляд
      файлами, зміненими від `origin/main`.
    - Дані про час виконання шардів записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски цілих конфігів використовують шлях до конфіга як ключ; шарди CI з include-pattern
      додають назву шарда, щоб відфільтровані шарди можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      макетуйте цей шов безпосередньо замість глибокого імпорту helper середовища виконання
      лише для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом root-project для цього закоміченого
      diff і друкує wall time плюс максимальний RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркує поточне брудне дерево,
      маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневий конфіг Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для
      старту Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Проганяє синтетичне навантаження повідомленнями gateway, пам’яттю та великими payload через шлях діагностичних подій
  - Опитує `diagnostics.stability` через WS RPC Gateway
  - Покриває helper збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS залишаються в межах бюджету тиску, а глибини черг на рівні сесій знову зменшуються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для подальшої роботи над регресіями stability, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих plugin у `extensions/`
- Типові значення середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість worker-процесів (CI: до 2, локально: типово 1).
  - Типово працює в тихому режимі, щоб зменшити витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості worker-процесів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного виводу в консоль.
- Область:
  - End-to-end поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, спарювання вузлів і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Виконує бекенд OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через fs bridge sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін форматів провайдерів, особливостей виклику інструментів, проблем автентифікації та поведінки обмеження швидкості
- Очікування:
  - Навмисно нестабільно для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підключають `~/.profile`, щоб підхопити відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає логи bootstrap gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (специфічна для провайдера): установіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або окреме live-перевизначення через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби при відповідях з rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів помітно активні навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/gateway негайно передаються під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (з доступом до мережі)

Для live matrix моделей, smoke бекендів CLI, smoke ACP, app-server
harness Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — дивіться
[Тестування — live-набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл із profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підключають `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово використовують меншу межу smoke, щоб повний Docker-обхід лишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  свідомо хочете більший вичерпний обхід.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише раннер Node/Git для смуг install/update/plugin-dependency; ці смуги монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для смуг функціональності зібраного застосунку. Визначення Docker-smug розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають усім важким smugs live, npm-install і multi-service стартувати одночасно. Якщо одна смуга важча за активні обмеження, scheduler усе одно може запустити її, коли пул порожній, а потім тримає її окремо, доки знову не з’явиться доступна місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли хост Docker має більший запас ресурсів. Ранер типово виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає час успішних смуг у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані часу, щоб у наступних запусках стартувати довші смуги раніше. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест смуг без збірки чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести план CI для вибраних смуг, потреб package/image та облікових даних.
- `Package Acceptance` — це нативний для GitHub gate пакетів для питання «чи працює цей tarball, придатний до встановлення, як продукт?». Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, вивантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E smugs проти цього точного tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірений workflow/harness scripts, а `package_ref` вибирає вихідний commit/branch/tag для пакування, коли `source=ref`; це дозволяє поточній логіці acceptance перевіряти старіші довірені commit. Профілі впорядковані за шириною: `smoke` — це швидке install/channel/agent плюс gateway/config, `package` — це контракт package/update/plugin і типова нативна заміна для більшості покриття Parallels package/update, `product` додає MCP channels, cron/subagent cleanup, OpenAI web search і OpenWebUI, а `full` запускає релізні Docker-частини з OpenWebUI. Перевірка релізу запускає кастомну delta package (`bundled-channel-deps-compat plugins-offline`) плюс Telegram QA пакета, оскільки релізні Docker-частини вже покривають смуги package/update/plugin, що перетинаються. Цільові команди повторного запуску Docker у GitHub, згенеровані з артефактів, включають попередній артефакт package і підготовлені образи, коли вони доступні, тож для невдалих смуг можна уникнути повторного збирання пакета й образів.
- Перевірки збірки та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить статичний граф зібраного коду від `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо до dispatch команди під час старту імпортуються залежності package на кшталт Commander, prompt UI, undici або логування. Smoke перевірка запакованого CLI також покриває root help, onboard help, doctor help, status, config schema і команду списку моделей.
- Застаріла сумісність `Package Acceptance` обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness терпить лише пропуски метаданих уже випущених пакетів: пропущені приватні записи інвентарю QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git fixture, похідному від tarball, відсутній збережений `update.channel`, застарілі розташування install-record plugin, відсутнє збереження marketplace install-record і міграцію метаданих config під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи вважаються суворими збоями.
- Container smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-mount лише потрібні CLI auth home-каталоги (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени, не змінюючи сховище auth на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, із суворим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke app-server harness Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observability: `pnpm qa:otel:smoke` — це приватна смуга source-checkout QA. Вона навмисно не входить до release-smugs Docker для пакетів, оскільки npm tarball не містить QA Lab.
- Live-smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke npm tarball для онбордингу/каналу/агента: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref і типово Telegram, перевіряє, що doctor відновлює активовані runtime deps plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, а потім повертається до package `stable` і перевіряє статус оновлення.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context у транскрипті плюс відновлення doctor для уражених дубльованих гілок переписування prompt.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає вбудовані image-провайдери замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує спільний npm cache для своїх контейнерів root, update і direct-npm. Smoke оновлення типово використовує npm `latest` як стабільну базову версію перед оновленням до tarball кандидата. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, або через вхід `update_baseline_version` workflow Install Smoke у GitHub. Перевірки інсталятора без root зберігають ізольований npm cache, щоб root-owned записи кешу не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- CI Install Smoke пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; локально запускайте скрипт без цього env, коли потрібне покриття прямого `npm install -g`.
- CLI-smoke видалення спільного workspace агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ з root Dockerfile, сіє двох агентів з одним workspace в ізольований container home, виконує `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережеве тестування Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс Chromium layer, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshot охоплюють URL посилань, clickables, підняті курсором, посилання iframe і метадані frame.
- Мінімальна reasoning-регресія OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, а потім примусово змушує схему провайдера відхилити запит і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + smoke сирих notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke allow/deny для embedded Pi profile): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron/субагентів (реальний Gateway + teardown дочірнього stdio MCP після ізольованого cron і одноразових запусків субагента): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка Claude bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначайте типовий пакет через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke незмінності оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps вбудованих plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker-образ runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегатор і релізна частина `bundled-channels` попередньо пакують цей tarball один раз, а потім шардують перевірки вбудованих каналів у незалежні смуги, включно з окремими смугами оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Застаріла частина `plugins-integrations` залишається агрегатним аліасом для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску вбудованої smugs, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Смуга також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Під час ітерацій звужуйте runtime deps вбудованих plugin, вимикаючи нерелевантні сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів, специфічні для наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо локально його ще немає. QR- і installer-Docker тести зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільне runtime зібраного застосунку.

Docker-ранери live-моделей також монтують поточний checkout лише для читання і
переносять його до тимчасового workdir усередині контейнера. Це зберігає runtime-
образ компактним, але все одно дає змогу запускати Vitest проти ваших точних локальних source/config.
Під час перенесення пропускаються великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
виводу Gradle, тож live-запуски Docker не витрачають хвилини на копіювання
машинозалежних артефактів.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-проби gateway не запускали
реальні worker-процеси каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live з цієї Docker-smugs.
`test:docker:openwebui` — це compatibility smoke вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoint,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний запит чату через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
образу Open WebUI, а Open WebUI може завершувати власне холодне початкове налаштування.
Ця смуга очікує придатний live-ключ моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway-
контейнер, стартує другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідних відправлень і сповіщення у стилі Claude про channel +
permissions через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо інспектує сирі кадри stdio MCP, тож smoke перевіряє те, що міст
справді випромінює, а не лише те, що певний клієнтський SDK випадково показує назовні.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live-
ключа моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через embedded Pi bundle
MCP runtime, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live-
ключа моделі. Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації thread ACP, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підключається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підключені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування auth зовнішніх CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні auth-каталоги/файли CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані беруться зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки docs після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку якірних посилань Mintlify, коли вам також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайнова регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер gateway (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Mock-виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють прив’язування сесій і вплив конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/аргументів?
- **Контракти робочих процесів:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесій і межі sandbox.

Майбутні оцінювання мають спочатку залишатися детермінованими:

- Runner сценаріїв, який використовує mock-провайдери для перевірки викликів інструментів + їх порядку, читання skill-файлів і прив’язування сесій.
- Невеликий набір сценаріїв, зосереджених на Skills (використовувати чи уникати, gating, prompt injection).
- Опційні live-оцінювання (за явним увімкненням, із захистом env) лише після того, як безпечний для CI набір буде готовий.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit lane `pnpm test` навмисно
пропускає ці спільні seam і smoke-файли; явно запускайте контрактні команди,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розміщені в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** — базова форма plugin (id, name, capabilities)
- **setup** — контракт майстра налаштування
- **session-binding** — поведінка прив’язування сесій
- **outbound-payload** — структура payload повідомлень
- **inbound** — обробка вхідних повідомлень
- **actions** — обробники дій channel
- **threading** — обробка id thread
- **directory** — API каталогу/складу
- **group-policy** — застосування групової політики

### Контракти статусу provider

Розміщені в `src/plugins/contracts/*.contract.test.ts`.

- **status** — перевірки статусу channel
- **registry** — форма реєстру plugin

### Контракти provider

Розміщені в `src/plugins/contracts/*.contract.test.ts`:

- **auth** — контракт потоку автентифікації
- **auth-choice** — вибір/відбір автентифікації
- **catalog** — API каталогу моделей
- **discovery** — виявлення plugin
- **loader** — завантаження plugin
- **runtime** — середовище виконання provider
- **shape** — форма/інтерфейс plugin
- **wizard** — майстер налаштування

### Коли запускати

- Після зміни export або підшляхів plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додавайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точного перетворення форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), зберігайте live-тест вузьким і з явним увімкненням через env vars
- Віддавайте перевагу націлюванню на найменший шар, який виявляє баг:
  - баг перетворення/відтворення запиту provider → тест прямих моделей
  - баг pipeline сесії/історії/інструментів gateway → live gateway smoke або безпечний для CI mock-тест gateway
- Захисний механізм обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить по одній вибірковій цілі для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих id цілей, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [CI](/uk/ci)
