---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live-тестів, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-02T15:53:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: eae3bda71caeb2c2ea8842c940897dc79e4e99be6c337967be41e557b44a41fc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, під час налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [Канал QA](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовується сценаріями на основі репозиторію.

Ця сторінка описує запуск звичайних тестових наборів і Docker/Parallels-ранерів. Розділ специфічних для QA раннерів нижче ([специфічні для QA ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшість днів:

- Повний гейт (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над окремим збоєм спершу віддавайте перевагу цільовим запускам.
- QA-сайт на Docker: `pnpm qa:lab:up`
- QA-lane на Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли змінюєте тести або хочете додаткової впевненості:

- Гейт покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + gateway-проби інструментів/зображень): `pnpm test:live`
- Тихий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти продуктивності runtime: запустіть `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`.
- Live sweep моделей у Docker: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невелику пробу в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний хід із зображенням.
    Вимкніть додаткові проби за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` під час ізоляції збоїв провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix-завдання, розділені за провайдерами.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    разом із `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release-викликачами.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через нативну прив’язку plugin замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи gateway-агента через harness Codex app-server, що належить plugin,
    перевіряє `/codex status` і `/codex models` і за замовчуванням виконує проби image,
    cron MCP, sub-agent і Guardian. Вимкніть пробу sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` під час ізоляції інших збоїв Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші проби:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після проби sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова перевірка з підстрахуванням для поверхні команди порятунку message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що нечіткий fallback планувальника перетворюється на аудитований типізований
    запис конфігурації.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує простий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    перевіряє конфігурацію і перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: із встановленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## Специфічні для QA ранери

Ці команди розташовані поруч з основними тестовими наборами, коли потрібен реалізм QA-lab:

CI запускає QA Lab у виділених workflow. `Parity gate` запускається на відповідних PR і
з ручного dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch з mock parity gate, live Matrix lane,
керованою Convex live Telegram lane і керованою Convex live Discord lane як
паралельними завданнями. Заплановані QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і ручний workflow input за замовчуванням залишаються
`all`; ручний dispatch може розділити `all` на завдання `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
швидкі Matrix і Telegram lanes перед затвердженням релізу, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
й уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
пошук пам’яті; поведінка пам’яті залишається покритою QA parity suites.

Повні release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторного збирання
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`, що враховує сценарії.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає bench запуску Gateway плюс невеликий пакет mock-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведений підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі спостереження високого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    і не виглядають як регресія з тривалим навантаженням gateway протягом хвилин.
  - Використовує зібрані артефакти `dist`; спершу запустіть build, якщо checkout ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA у disposable Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані автентифікації QA, практичні для guest:
    ключі провайдера з env, шлях до QA live provider config і `CODEX_HOME`,
    якщо він наявний.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний звіт QA + підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding з ключем OpenAI API, за замовчуванням налаштовує Telegram,
    перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один локальний agent turn проти
    mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму lane packaged-install
    з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для transcript вбудованого runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім додає affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює package candidate OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через встановлений CLI, потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret наявні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions надає цю lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler з профілями lane smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакта `package-under-test`.
  - Останній beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof завантажує tarball artifact з іншого Actions run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перший налаштований doctor repair явно встановлює кожен відсутній downloadable
    plugin, а другий restart не запускає прихований dependency
    repair.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor candidate
    очищає legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke на guests Parallels. Кожна
    вибрана платформа спершу встановлює requested baseline package, потім запускає
    встановлену команду `openclaw update` у тому самому guest і перевіряє
    встановлену версію, статус update, gateway readiness і один локальний agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному guest. Використовуйте `--json` для шляху summary artifact і
    статусу кожної lane.
  - OpenAI lane за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски host timeout, щоб stalls транспорту Parallels не
    забрали решту тестового вікна:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перевірте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед тим, як припускати, що зовнішній wrapper завис.
  - Windows update може витратити 10-15 хвилин на post-update doctor і package
    update work на cold guest; це все ще справний стан, якщо вкладений npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони спільно використовують VM state і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну bundled plugin surface, тому що
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам agent
    turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер AIMock provider для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти disposable Docker-backed Tuwunel homeserver. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог profile/scenario, env vars і layout артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних bot в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від driver send request до observed SUT reply.

Live transport lanes мають один standard contract, щоб нові transports не розходилися; per-lane coverage matrix розміщена в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким synthetic suite і не входить до цієї matrix.

### Спільні Telegram credentials через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує exclusive lease з Convex-backed pool, heartbeats
цей lease, поки lane працює, і звільняє lease під час shutdown.

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної role:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір credential role:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs для local-only development.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у нормальній роботі.

Maintainer admin commands (pool add/remove/list) вимагають саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live runs, щоб перевірити Convex site URL, broker secrets,
endpoint prefix, HTTP timeout і admin/list reachability без виведення
secret values. Використовуйте `--json` для machine-readable output у scripts і CI
utilities.

Контракт типового кінцевого пункту (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (лише секрет супровідника)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет супровідника)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет супровідника)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма корисного навантаження для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні корисні навантаження.

### Додавання каналу до QA

Архітектура й назви допоміжних сценарних компонентів для нових адаптерів каналів наведені в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному хостовому шві `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте ці набори як «зростання реалістичності» (і зростання нестабільності/вартості):

### Модульні / інтеграційні (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардiв `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в поконфігураційні проєкти для паралельного планування
- Файли: інвентарі core/модульних тестів у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні тести UI запускаються у виділеному шарді `unit-ui`
- Обсяг:
  - Чисті модульні тести
  - Внутрішньопроцесні інтеграційні тести (автентифікація Gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести резолвера й завантажувача публічної поверхні мають доводити резервну поведінку широких `api.js` і
    `runtime-api.js` на згенерованих мініатюрних фікстурах plugin, а не
    на реальних API джерел вбудованих plugin. Завантаження реального API plugin належать до
    контрактних/інтеграційних наборів, якими володіють plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардiв (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного великого нативного процесу кореневого проєкту. Це зменшує пікове RSS на завантажених машинах і не дає роботі auto-reply/розширень витісняти непов’язані набори.
    - `pnpm test --watch` і далі використовує нативний граф проєктів кореневого `vitest.config.ts`, бо цикл спостереження з багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через обмежені смуги, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві обмежені смуги: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні вузли графа імпортів. Зміни конфігурації/налаштування/пакетів не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним контрольним шлюзом для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, застосунки, документацію, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди перевірки типів, lint і guard. Він не запускає тести Vitest; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підняття версій лише в release metadata запускає цільові перевірки версії/конфігурації/кореневих залежностей із guard, який відхиляє зміни package поза полем версії верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, export, версії та іншої поверхні package все одно використовують ширші guards.
    - Легкі за імпортами модульні тести з agents, commands, plugins, helpers auto-reply, `plugin-sdk` та подібних чистих утилітарних зон маршрутизуються через смугу `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важкою runtime-логікою лишаються на наявних смугах.
    - Вибрані допоміжні джерельні файли `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними сусідніми тестами в цих легких смугах, тому зміни helpers не перезапускають повний важкий набір для цього каталогу.
    - `auto-reply` має окремі кошики для верхньорівневих helpers core, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один важкий за імпортами кошик не володів усім хвостом Node.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep extension і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих важких за plugin/extension наборів на кандидатах релізу.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли змінюєте входи виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додайте сфокусовані регресії helpers для чистих меж маршрутизації та нормалізації.
    - Підтримуйте здоровими інтеграційні набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction і далі проходять
      реальними шляхами `run.ts` / `compact.ts`; тести лише helpers
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Коренева смуга UI зберігає своє налаштування `jsdom` і optimizer, але також
      працює на спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх процесів Node
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні смуги запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли й
      не запускає lint, перевірку типів або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен розумний локальний контрольний шлюз.
    - `pnpm test:changed` типово маршрутизується через дешеві обмежені смуги. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, конфігурації, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Локальне автоматичне масштабування workers навмисно консервативне й відступає,
      коли середнє навантаження host уже високе, тому кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб повторні запуски changed-mode лишалися коректними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний перегляд
      файлами, зміненими з `origin/main`.
    - Дані часу шардiв записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; CI-шарди
      include-pattern додають назву шарда, щоб відфільтровані шарди можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      мокайте цей шов напряму замість deep-import runtime helpers лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з нативним шляхом кореневого проєкту для цього закоміченого
      diff і друкує wall time плюс максимальний RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль main-thread для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою типово
  - Проганяє synthetic gateway message, memory і large-payload churn через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження diagnostic stability bundle
  - Перевіряє, що recorder лишається bounded, synthetic RSS samples лишаються в межах pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI й без ключів
  - Вузька смуга для подальших stability-regression робіт, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих plugin у `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних workers (CI: до 2, локально: типово 1).
  - Типово запускається в silent mode, щоб зменшити overhead console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути verbose console output.
- Обсяг:
  - End-to-end поведінка багатьох екземплярів gateway
  - Поверхні WebSocket/HTTP, pairing node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у модульних тестах (може бути повільніше)

### E2E: smoke бекенду OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell Gateway на хості через Docker
  - Створює пісочницю з тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за явного ввімкнення; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і пісочницю
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI-бінарника або wrapper-скрипта

### Живі (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і живі тести bundled-plugin у `extensions/`
- Стандартно: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?”
  - Виявляє зміни формату провайдерів, особливості tool-calling, проблеми автентифікації та поведінку rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені піднабори, а не “все”
- Живі запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- Стандартно живі запуски все одно ізолюють `HOME` і копіюють конфігураційні/автентифікаційні матеріали в тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб живі тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер стандартно працює в тихішому режимі: зберігає виведення прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежить від провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для окремого live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях rate limit.
- Виведення прогресу/heartbeat:
  - Живі набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів були помітно активними навіть тоді, коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway транслювалися одразу під час живих запусків.
  - Налаштовуйте heartbeat-и direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat-и Gateway/проб через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії Gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “мій бот не працює” / збої, специфічні для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Живі (з мережевим доступом) тести

Для live model matrix, CLI backend smokes, ACP smokes, harness Codex app-server
і всіх живих тестів media-provider (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для живих запусків — див.
[Тестування живих наборів](/uk/help/testing-live). Для спеціального checklist оновлень і
перевірки Plugin див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners стандартно мають меншу smoke-межу, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` стандартно задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` стандартно задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ є лише Node/Git runner для lanes встановлення/оновлення/plugin-dependency; ці lanes монтують попередньо зібраний tarball. Functional-образ встановлює той самий tarball у `/app` для lanes функціональності зібраного застосунку. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а resource caps не дають важким live, npm-install і multi-service lanes стартувати всім одночасно. Якщо один lane важчий за активні caps, scheduler усе одно може запустити його, коли pool порожній, і потім тримає його єдиним запущеним, доки знову не з’явиться місткість. Стандартні значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас. Runner стандартно виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає timings успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці timings, щоб у наступних запусках спершу стартували довші lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений lane manifest без збірки або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних lanes, потреб пакетів/образів і облікових даних.
- `Package Acceptance` — це GitHub-native package gate для "чи працює цей installable tarball як продукт?" Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковано за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) щодо контракту package/update/plugin, survivor matrix для published-upgrade, стандартних значень релізу та triage збоїв.
- Перевірки збірки та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичний built graph від `dist/entry.js` і `dist/cli/run-main.js` і падає, якщо pre-dispatch startup імпортує залежності пакета, як-от Commander, prompt UI, undici або logging, до dispatch команди; він також утримує bundled gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Legacy compatibility для Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цього cutoff harness терпить лише прогалини metadata shipped-package: пропущені записи private QA inventory, відсутній `gateway install --wrapper`, відсутні patch-файли у tarball-derived git fixture, відсутній persisted `update.channel`, legacy розташування plugin install-record, відсутня persistence marketplace install-record і міграція config metadata під час `plugins update`. Для пакетів після `2026.4.25` ці paths є strict failures.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` завантажують один або більше реальних контейнерів і перевіряють higher-level integration paths.

Live-model Docker runners також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб external-CLI OAuth міг оновлювати токени без зміни host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` — це приватна QA-смуга перевірки вихідного checkout. Її навмисно не включено до Docker-смуг релізу пакета, тому що npm tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг із посиланням на env і Telegram за замовчуванням, запускає doctor і виконує один змокований хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball за допомогою `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на host через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх брудної фікстури старого користувача з агентами, конфігурацією каналу, allowlist Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він запускає оновлення пакета плюс неінтерактивний doctor без live-ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей базовий стан за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, startup, `/healthz`, `/readyz` і бюджети RPC-статусу. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, а також розгорніть issue-подібні фікстури через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, як-от `reported-issues`; Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context transcript, а також repair doctor для зачеплених дубльованих гілок prompt-rewrite.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers, а не зависає. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між контейнерами root, update і direct-npm. Update smoke за замовчуванням використовує npm `latest` як stable baseline перед оновленням до кандидатного tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, власником яких є root, не маскували поведінку встановлення user-local. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття direct `npm install -g`.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає image кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого workspace. Повторно використовуйте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс Chromium layer, запускає Chromium із raw CDP, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований OpenAI server через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає provider schema reject і перевіряє, що raw detail з’являється в Gateway logs.
- MCP channel bridge (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (реальний Gateway + stdio MCP child teardown після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update smoke для local path, `file:`, npm registry з hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture server ClawHub.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює install/update smoke для local path, `file:`, npm registry з hoisted dependencies, git moving refs, фікстур ClawHub, marketplace updates і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` охоплює поведінку unchanged update для встановлених plugins.

Щоб вручну попередньо зібрати й повторно використовувати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретного suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений shared image, скрипти завантажують його, якщо він ще не є локальним. QR і installer Docker tests зберігають власні Dockerfiles, тому що вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker runners для live-model також bind-mount поточний checkout у режимі read-only і
стейджать його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, водночас запускаючи Vitest проти саме вашого локального source/config.
Крок staging пропускає великі локальні cache та outputs збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків `.build` або
output-директорії Gradle, щоб Docker live runs не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live probes Gateway не запускали
реальних Telegram/Discord/etc. channel workers усередині контейнера.
`test:docker:live-models` все ще запускає `pnpm test:live`, тому передавайте також
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage із цієї Docker lane.
`test:docker:openwebui` — це compatibility smoke вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoints,
запускає pinned контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися завантажити
Open WebUI image, а Open WebUI може потребувати завершення власного cold-start setup.
Ця lane очікує придатний live model key, і `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, transcript reads, attachment metadata,
поведінку live event queue, outbound send routing і channel +
permission notifications у стилі Claude через реальний stdio MCP bridge. Перевірка notification
безпосередньо інспектує raw stdio MCP frames, тож smoke перевіряє те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає repo Docker image, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway із реальним stdio MCP probe server, виконує
ізольований cron turn і одноразовий child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для regression/debug workflows. Він може знову знадобитися для валідації ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевірити лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочого простору й без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдера монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілів (а не з середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway відкриває для перевірки Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовується перевіркою Open WebUI smoke
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування документів: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «справжнього pipeline» без справжніх провайдерів:

- Виклики інструментів Gateway (імітація OpenAI, справжній gateway + agent loop): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + забезпечує автентифікацію): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Імітовані виклики інструментів через справжні gateway + agent loop (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють зв’язування сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли skills перелічено в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають насамперед залишатися детермінованими:

- Ранер сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання файлів skill і зв’язування сесії.
- Невеликий набір сценаріїв, сфокусованих на skill (використати або уникнути, gating, prompt injection).
- Необов’язкові live-оцінювання (opt-in, керовані env) лише після появи безпечного для CI набору.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
інтерфейсному контракту. Вони проходять усі виявлені plugins і запускають набір
перевірок форми та поведінки. Стандартний unit-lane `pnpm test` навмисно
пропускає ці спільні файли seam і smoke; запускайте контрактні команди явно,
коли змінюєте спільні поверхні channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API каталогу/roster
- **group-policy** - Застосування політики груп

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма registry plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або subpaths plugin-sdk
- Після додавання або змінення channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують справжніх API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub provider або захоплення точної трансформації форми запиту)
- Якщо це за своєю природою лише live (обмеження швидкості, політики автентифікації), залишайте live-тест вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/відтворення запиту provider → прямий тест моделей
  - помилка pipeline сесії/історії/інструментів gateway → gateway live smoke або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль на клас SecretRef з метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-сегментами відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було мовчки пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
