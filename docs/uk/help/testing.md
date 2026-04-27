---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та те, що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-27T19:39:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 142d45ff5b05c38c6a8220752ac683b9b0f4492eaa3f41dc9507f1d0d885c364
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для поширених сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовується в сценаріях на основі репозиторію.

Ця сторінка охоплює запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ нижче, присвячений QA-раннерам ([QA-специфічні ранери](#qa-specific-runners)), перелічує конкретні виклики `qa` і спрямовує назад до наведених вище довідкових матеріалів.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Коли ви ітеруєтеся над однією помилкою, спочатку віддавайте перевагу цільовим запускам.
- Сайт QA на базі Docker: `pnpm qa:lab:up`
- Лінія QA на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більшої впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway-перевірки інструментів/зображень): `pnpm test:live`
- Тихий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Для кожної вибраної моделі тепер виконується текстовий хід плюс невелика перевірка у стилі читання файлу.
    Моделі, чиї метадані вказують на вхід `image`, також виконують маленький хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який містить окремі матричні Docker-job для live-моделей,
    розбиті за провайдером.
  - Для цільових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів у `scripts/ci-hydrate-live-auth.sh`,
    а також у `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    виклики за розкладом/релізом.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-лінію проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення
    із зображенням проходять через native binding Plugin, а не через ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Пропускає ходи gateway-агента через harness app-server Codex, що належить Plugin,
    перевіряє `/codex status` і `/codex models`, а також за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex.
    Для цільової перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Цей запуск завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke перевірка команди rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Добровільна додаткова перевірка поверхні команди rescue для message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI в `PATH`
    і перевіряє, що нечіткий fallback планувальника перетворюється на аудований типізований запис конфігурації.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, спрямовує простий `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + записи SecretRef,
    валідує конфігурацію та перевіряє записи аудиту. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke перевірка вартості Moonshot/Kimi: коли встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON показує Moonshot/K2.6, а
  транскрипт помічника зберігає нормалізоване `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env-змінні allowlist, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди використовуються поряд з основними наборами тестів, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і
через ручний запуск з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний запуск із mock parity gate, live-лінією Matrix,
live-лінією Telegram під керуванням Convex і live-лінією Discord під керуванням Convex
як паралельні job. Заплановані перевірки QA і релізу явно передають Matrix `--profile fast`,
тоді як CLI Matrix і стандартне значення ручного параметра workflow залишаються
`all`; ручний запуск може розбивати `all` на job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
швидкі лінії Matrix і Telegram перед схваленням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на основі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker gateway. Для `qa-channel` типове значення concurrency — 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість
    worker, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без помилкового коду завершення.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на основі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни сценарійно-орієнтованої
    лінії `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані автентифікації QA, які практичні для гостьової системи:
    ключі провайдера на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`,
    якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний звіт QA + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає сайт QA на базі Docker для операторської роботи з QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивне онбординг-налаштування ключа OpenAI API, за замовчуванням налаштовує
    Telegram, перевіряє, що ввімкнення Plugin встановлює runtime-залежності за потреби,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію
    встановлення з пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke built-app для вбудованих транскриптів runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    користувацьке повідомлення, яке не відображається, замість витоку у видимий хід користувача,
    потім підкладає пошкоджений JSONL сесії й перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидат пакета OpenClaw у Docker, запускає онбординг встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live-лінію Telegram QA з цим встановленим пакетом як Gateway SUT.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати локально отриманий tarball замість
    встановлення з реєстру.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізів встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions також надає цю лінію як ручний workflow для супровідників
    `NPM Telegram Beta E2E`. Вона не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для побічного підтвердження продукту
  проти одного кандидата пакета. Він приймає довірений ref, опубліковану npm-spec,
  HTTPS URL tarball із SHA-256 або артефакт tarball з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler з профілями ліній smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити workflow Telegram QA
  проти того самого артефакту `package-under-test`.
  - Підтвердження продукту для останньої beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Підтвердження через точний URL tarball потребує digest:

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
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає неналаштовані runtime-залежності Plugin
    відсутніми, перший налаштований запуск Gateway або doctor встановлює runtime-залежності
    кожного вбудованого Plugin за потреби, а другий перезапуск не перевстановлює
    залежності, які вже були активовані.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що
    post-update doctor кандидата виправляє runtime-залежності вбудованого channel без
    postinstall-виправлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke перевірку оновлення встановленого пакета в гостях Parallels. Для кожної
    вибраної платформи спочатку встановлюється запитаний baseline-пакет, потім
    у тій самій гостьовій системі запускається встановлена команда `openclaw update`, після чого перевіряються
    встановлена версія, статус оновлення, готовність gateway і один локальний
    хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`, коли
    ітеруєтеся над однією гостьовою системою. Використовуйте `--json` для отримання шляху до артефакту підсумку та
    статусу кожної лінії.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для live-перевірки
    ходу агента. Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте тривалі локальні запуски в host timeout, щоб зависання транспорту Parallels
    не поглинало решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10–15 хвилин на post-update doctor/виправлення
    runtime-залежностей на холодній гостьовій системі; це все ще є нормальним станом, якщо вкладений
    npm debug log продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-лініями Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати через
    відновлення snapshot, роздачу пакетів або стан gateway у гостьовій системі.
  - Post-update-перевірка запускає звичайну поверхню вбудованого Plugin, тому що
    фасади можливостей, такі як speech, image generation і media
    understanding, завантажуються через вбудовані runtime API навіть тоді, коли сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-лінію Matrix QA проти тимчасового homeserver Tuwunel на базі Docker. Лише для source-checkout — встановлення з пакета не постачає `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env-змінні та структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live-лінію Telegram QA проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути оренду зі спільного пулу.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без помилкового коду завершення.
  - Потребує двох різних ботів в одній приватній групі, причому SUT bot має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live-лінії transport мають один спільний стандартний контракт, щоб нові transport не розходилися; матриця покриття для окремих ліній знаходиться в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір, і він не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
цієї оренди, поки лінія виконується, і звільняє оренду під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Стандартне значення з env: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI типово `ci`, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди супровідника (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для супровідників:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машиночитаного виводу в скриптах і CI-утилітах.

Стандартний контракт endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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

### Додавання channel до QA

Архітектура та назви scenario-helper для нових channel-адаптерів описані в [QA overview → Adding a channel](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і написати сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Думайте про ці набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір шардованих конфігів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні shard у конфіги на рівні окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; unit-тести UI запускаються в окремому shard `unit-ui`
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

    - Нетаргетований `pnpm test` запускає дванадцять менших shard-конфігів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` і далі використовує native root-граф проєктів `vitest.config.ts`, тому що цикл watch із багатьма shard непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root-project.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення вихідного коду та локальні залежні вузли з import-графа. Зміни config/setup/package не запускають широкі тести, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний gate перевірок для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для підтвердження тестів викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версії лише в release metadata запускає цільові перевірки version/config/root-dependency, із guard, який відхиляє зміни package поза полем версії верхнього рівня.
    - Зміни в live Docker ACP harness запускають сфокусовані перевірки: shell-синтаксис для live Docker auth-скриптів і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежено `scripts["test:docker:live-*"]`; зміни залежностей, exports, version та інших поверхонь package, як і раніше, використовують ширші guard.
    - Полегшені за import unit-тести для agents, commands, plugins, хелперів auto-reply, `plugin-sdk` та подібних чистих утилітних зон маршрутизуються через лінію `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важкі для runtime лишаються на наявних лініях.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють запуски в changed-mode з явними сусідніми тестами в цих легких лініях, тож зміни в хелперах не примушують повторно запускати весь важкий набір для цього каталогу.
    - `auto-reply` має окремі кошики для top-level core helper, top-level integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. У CI піддерево reply додатково ділиться на шарди agent-runner, dispatch і commands/state-routing, щоб один важкий щодо import кошик не забирав увесь хвіст Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context
      Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та
      нормалізації.
    - Підтримуйте інтеграційні набори embedded runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction, як і раніше, проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only тести
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Стандартні значення пулу та ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, e2e та live-конфігах.
    - Root-лінія UI зберігає своє налаштування `jsdom` і optimizer, але теж запускається на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні лінії зачіпає diff.
    - Pre-commit hook відповідає лише за форматування. Він повторно індексує відформатовані файли й
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею чи push, коли вам
      потрібен розумний локальний gate перевірок.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      просто з вищою межею worker.
    - Автомасштабування локальних worker навмисно консервативне й зменшує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється
      wiring тестів.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість import плюс
      вивід розбивки import.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний вигляд
      файлами, зміненими відносно `origin/main`.
    - Дані про час shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски для всього config використовують шлях config як ключ; CI-shard
      з include-pattern додають ім’я shard, щоб відфільтровані shard можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові import,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam напряму, замість глибокого import runtime-хелперів лише
      для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native root-project-шляхом для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфіг Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль main-thread для
      накладних витрат запуску та transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap-профілі runner для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичне навантаження повідомленнями gateway, пам’яттю та великими payload через шлях діагностичних подій
  - Опитує `diagnostics.stability` через Gateway WS RPC
  - Охоплює хелпери збереження diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, синтетичні RSS-вибірки лишаються в межах бюджету тиску, а глибина черг для кожної сесії знову зменшується до нуля
- Очікування:
  - Безпечно для CI та без ключів
  - Вузька лінія для подальших дій щодо регресій стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих Plugin у `extensions/`
- Типові налаштування runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість worker (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в тихому режимі, щоб зменшити накладні витрати на вивід у консоль.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості worker (максимум 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути детальний вивід у консоль.
- Обсяг:
  - End-to-end-поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, спарювання Node та складніші мережеві сценарії
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke перевірка backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальний `sandbox ssh-config` + виконання через SSH
  - Перевіряє поведінку файлової системи в remote-canonical режимі через bridge fs sandbox
- Очікування:
  - Лише за бажанням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і справного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний двійковий файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих Plugin у `extensions/`
- Типово: **увімкнено** командою `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limit
  - Віддавайте перевагу запуску звужених підмножин, а не «всього»
- Live-запуски зчитують `~/.profile`, щоб підібрати відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і вимикає bootstrap-логи gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (для конкретного провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), або використовуйте перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів було видно як активні навіть тоді, коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі у Vitest, тому рядки прогресу провайдера/gateway передаються відразу під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте таку таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої конкретного провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (із доступом до мережі)

Для матриці live-моделей, smoke-перевірок backend CLI, ACP smoke, harness
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також для роботи з обліковими даними під час live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл за ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і зчитують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням мають меншу верхню межу smoke, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише Node/Git-ранер для ліній install/update/plugin-dependency; ці лінії монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для ліній функціональності built-app. Визначення Docker-ліній знаходяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як обмеження ресурсів не дають важким live-, npm-install- і multi-service-лініям стартувати одночасно. Якщо одна лінія важча за активні обмеження, планувальник усе одно може запустити її, коли пул порожній, а потім триматиме її єдиною активною, доки знову не з’явиться доступна місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. Ранер за замовчуванням виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає час успішних ліній у `.artifacts/docker-tests/lane-timings.json` і використовує ці значення часу, щоб у наступних запусках спочатку стартували довші лінії. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест ліній без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести CI-план для вибраних ліній, потреб package/image і облікових даних.
- `Package Acceptance` — це нативний package-gate GitHub для перевірки «чи працює цей installable tarball як продукт?». Він визначає один кандидат пакета з `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-лінії проти саме цього tarball замість перепакування вибраного ref. `workflow_ref` вибирає довірені workflow/harness-скрипти, а `package_ref` вибирає вихідний commit/branch/tag для пакування, коли `source=ref`; це дає змогу поточній логіці acceptance перевіряти старіші довірені commit. Профілі впорядковано за шириною покриття: `smoke` — це швидка перевірка install/channel/agent плюс gateway/config, `package` — package/update/plugin contract і типова native-замiна для більшості пакетних/оновлювальних перевірок Parallels, `product` додає MCP channels, cron/subagent cleanup, OpenAI web search і OpenWebUI, а `full` запускає Docker-частини шляху релізу з OpenWebUI. Перевірка релізу запускає custom package delta (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, тому що Docker-частини шляху релізу вже покривають лінії package/update/plugin, що перетинаються. Цільові команди повторного запуску Docker у GitHub, згенеровані з артефактів, включають попередній артефакт пакета та підготовлені входи образів, коли вони доступні, тому збійні лінії можуть уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичний built-граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо startup-import-и до dispatch завантажують залежності пакета, такі як Commander, prompt UI, undici або logging, ще до диспетчеризації команди. Smoke перевірка запакованого CLI також охоплює root help, onboard help, doctor help, status, schema config і команду model-list.
- Legacy-сумісність `Package Acceptance` обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини в метаданих уже випущених пакетів: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, похідній від tarball, відсутній збережений `update.channel`, legacy-розташування install-record Plugin, відсутнє збереження marketplace install-record і міграцію метаданих config під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи вважаються строгими збоями.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-mount-ять лише потрібні CLI auth home (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke перевірка ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke перевірка backend CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke перевірка harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke перевірка спостережуваності: `pnpm qa:otel:smoke` — це приватна QA-лінія для source-checkout. Вона навмисно не входить до package Docker-ліній релізу, оскільки npm tarball не містить QA Lab.
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke перевірка npm tarball для онбордингу/channel/agent: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref плюс Telegram за замовчуванням, перевіряє, що doctor виправляє активовані runtime-залежності Plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте channel через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перевірка перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і працездатність Plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke перевірка runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context у транскрипті, а також виправлення через doctor для заторкнутих дубльованих гілок prompt-rewrite.
- Smoke перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудовані image-провайдери, а не зависає. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke перевірка Docker-інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш для своїх root-, update- і direct-npm-контейнерів. Smoke перевірка оновлення за замовчуванням використовує npm `latest` як stable baseline перед оновленням до tarball-кандидата. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, або через вхід workflow Install Smoke `update_baseline_version` у GitHub. Перевірки інсталятора без root зберігають ізольований npm-кеш, щоб записи кешу, створені root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm у локальних повторних запусках.
- CI Install Smoke пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke перевірка CLI для видалення agents зі спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає root Dockerfile-образ, створює два агенти з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку збереженого workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke перевірка snapshot для Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E-образ плюс шар Chromium, запускає Chromium з сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshot-и ролі CDP охоплюють URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі подробиці з’являються в логах Gateway.
- MCP bridge channel (seeded Gateway + stdio bridge + raw smoke перевірка кадрів повідомлень Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + smoke перевірка allow/deny для вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke перевірка встановлення, встановлення/видалення ClawHub, оновлення marketplace та увімкнення/перевірка Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте package за замовчуванням через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke перевірка незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke перевірка метаданих reload config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованого Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає малий Docker-образ раннера, один раз збирає та пакує OpenClaw на хості, а потім монтує цей tarball у кожен Linux-сценарій встановлення. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте host rebuild після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегатор і chunk `bundled-channels` для шляху релізу попередньо пакують цей tarball один раз, а потім розбивають перевірки вбудованих channel на незалежні лінії, включно з окремими лініями оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Workflow релізу також розбиває chunks інсталятора провайдера та chunks встановлення/видалення вбудованого Plugin; legacy-chunk-и `package-update`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю channel під час прямого запуску вбудованої лінії, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують виправлення doctor/runtime-dependency.
- Поки ітеруєтеся, звужуйте runtime-залежності вбудованого Plugin, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати та повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів на рівні конкретного набору, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, тому що вони перевіряють поведінку package/install, а не спільний runtime built-app.

Docker-ранери live-моделей також монтують поточний checkout лише для читання і
розміщують його у тимчасовому workdir усередині контейнера. Це зберігає runtime-образ
компактним, але водночас дає змогу запускати Vitest точно проти вашого локального source/config.
Етап розміщення пропускає великі локальні кеші та вихідні дані збірки застосунків, такі
як `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-проби gateway не запускали
реальні worker channel Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` все одно запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live з цієї Docker-лінії.
`test:docker:openwebui` — це smoke перевірка сумісності вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
образ Open WebUI, а самому Open WebUI — завершити власне холодне стартове налаштування.
Ця лінія очікує наявності придатного ключа live-моделі, а `OPENCLAW_PROFILE_FILE`
(за замовчуванням `~/.profile`) — це основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
у контейнері, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованої розмови, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та повідомлення у стилі Claude для channel +
permission через реальний stdio MCP bridge. Перевірка повідомлень
безпосередньо аналізує сирі stdio MCP-кадри, тож smoke перевірка валідує те, що
bridge реально випромінює, а не лише те, що певний client SDK випадково показує.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через runtime вбудованого Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна smoke перевірка ACP plain-language thread (не в CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для валідації маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і зчитується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, зчитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне перебирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані беруться зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke перевірки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke перевірка Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Після змін у документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібна перевірка заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів через Gateway (mock OpenAI, реальний Gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock tool-calling через реальний Gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, які перевіряють session wiring і вплив config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи дотримується потрібних кроків/аргументів?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval-набори мають насамперед залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і session wiring.
- Невеликий набір сценаріїв, орієнтованих на Skills (використовувати чи уникати, gate, prompt injection).
- Необов’язкові live-eval-набори (за бажанням, із gate через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
інтерфейсному контракту. Вони проходять усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit-лінія `pnpm test` навмисно
пропускає ці файли спільних seam і smoke; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Примусове застосування group policy

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
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export-ів або subpath у plugin-sdk
- Після додавання чи зміни channel або provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub provider або захопіть точну трансформацію форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), залишайте live-тест вузьким і добровільним через env-змінні
- Віддавайте перевагу націлюванню на найменший шар, який ловить баг:
  - баг конвертації/відтворення запиту provider → тест direct models
  - баг у pipeline gateway session/history/tool → live smoke gateway або безпечний для CI mock-тест gateway
- Захисний механізм обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою для не класифікованих target id, щоб нові класи не можна було непомітно пропустити.

## Пов’язані матеріали

- [Live-тестування](/uk/help/testing-live)
- [CI](/uk/ci)
