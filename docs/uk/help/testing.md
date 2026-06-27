---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделей/провайдерів
    - Налагодження поведінки Gateway і агента
summary: 'Набір для тестування: unit/e2e/live-набори, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-06-27T17:39:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, для налагодження).
- Як live-тести виявляють облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) - архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) - довідник для `pnpm openclaw qa matrix`.
- [Оціночна картка зрілості](/uk/maturity/scorecard) - як докази release QA підтримують рішення щодо стабільності та LTS.
- [QA channel](/uk/channels/qa-channel) - синтетичний transport plugin, який використовується сценаріями, підкріпленими репозиторієм.

Ця сторінка описує запуск звичайних тестових наборів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на просторій машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extensions/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Надавайте перевагу цільовим запускам спочатку, коли ітеруєте над одним збоєм.
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли змінюєте тести або хочете більшої впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

## Тимчасові каталоги тестів

Надавайте перевагу спільним допоміжним засобам у `test/helpers/temp-dir.ts` для тимчасових каталогів,
які належать тестам. Вони роблять володіння явним і тримають очищення в тому самому
життєвому циклі тесту:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Використовуйте `makeTempDir(tempDirs, prefix)` і `cleanupTempDirs(tempDirs)`, коли тест
уже володіє масивом або набором шляхів. Уникайте нових голих викликів `fs.mkdtemp*` у
тестах, якщо кейс не перевіряє явно raw temp-dir behavior. Додайте
аудитований allow-коментар із конкретною причиною, коли тест навмисно потребує
голого тимчасового каталогу:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Для видимості міграції `node scripts/report-test-temp-creations.mjs` повідомляє про
нове голе створення temp-dir у доданих рядках diff, не блокуючи наявні стилі
очищення. Його file scope навмисно використовує ту саму класифікацію test-path,
що й `scripts/changed-lanes.mjs`, замість підтримки окремої евристики імен файлів
test-helper, при цьому пропускаючи саму реалізацію спільного helper.
`check:changed` запускає цей звіт для змінених test paths як warning-only CI
signal; знахідки є GitHub warning annotations, а не failures.

Коли налагоджуєте реальних провайдерів/моделі (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти продуктивності runtime: dispatch `OpenClaw Performance` з
  `live_openai_candidate=true` для реального agent turn `openai/gpt-5.5` або
  `deep_profile=true` для CPU/heap/trace artifacts Kova. Щоденні заплановані запуски
  публікують artifacts mock-provider, deep-profile і GPT 5.5 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить source-level gateway boot, memory,
  plugin-pressure, repeated fake-model hello-loop і CLI startup numbers.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn плюс невеликий file-read-style probe.
    Моделі, чиї metadata оголошують вхід `image`, також виконують крихітний image turn.
    Вимикайте додаткові probes за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, sharded by provider.
  - Для сфокусованих повторних запусків CI, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal provider secrets до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти Codex app-server path, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє plain reply та image attachment
    route через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probes. Вимикайте sub-agent probe за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Встановлює запакований tarball OpenClaw у Docker, запускає onboarding з OpenAI API-key
    і перевіряє, що Codex plugin плюс залежність `@openai/codex`
    були завантажені до managed npm project root на вимогу.
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Пакує fixture plugin з реальною залежністю `slugify`, встановлює її через
    `npm-pack:`, перевіряє залежність у managed npm project root,
    потім просить live OpenAI model викликати plugin tool і повернути hidden
    slug.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders перевірка для message-channel rescue command
    surface. Вона виконує `/crestodian status`, ставить у чергу persistent model
    change, відповідає `/crestodian yes` і перевіряє audit/config write path.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у configless container з fake Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього OpenClaw state dir, перевіряє сучасний onboard
    Crestodian entrypoint, застосовує setup/model/agent/Discord plugin + SecretRef
    writes, валідовує config і перевіряє audit entries. Той самий Ring 0 setup
    path також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON reports Moonshot/K2.6 і
  assistant transcript stores normalized `usage.cost`.

<Tip>
Коли потрібен лише один failing case, надавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч з основними тестовими наборами, коли потрібен реалізм QA-lab:

CI запускає QA Lab у dedicated workflows. Agentic parity вкладено під
`QA-Lab - All Lanes` і release validation, а не окремий PR workflow.
Для broad validation слід використовувати `Full Release Validation` з
`rerun_group=qa-parity` або release-checks QA group. Stable/default release
checks тримають exhaustive live/Docker soak за `run_release_soak=true`; профіль
`full` примусово вмикає soak. `QA-Lab - All Lanes`
запускається щоночі на `main` і через manual dispatch з mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як parallel jobs. Scheduled QA і release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і manual workflow input
default залишаються `all`; manual dispatch може shard `all` на `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими й уникали звичайного provider-plugin startup. Ці live transport
gateways вимикають memory search; memory behavior залишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, побудований один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість rebuilding
усередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - Записує артефакти верхнього рівня `qa-evidence.json`, `qa-suite-summary.json` і
    `qa-suite-report.md` для вибраного набору сценаріїв, включно з
    виборами сценаріїв змішаних потоків, Vitest і Playwright.
  - Коли запускається через `pnpm openclaw qa run --qa-profile <profile>`, вбудовує
    scorecard вибраного профілю таксономії в той самий `qa-evidence.json`.
    `smoke-ci` записує стислий evidence, який встановлює `evidenceMode: "slim"` і пропускає
    `execution` для кожного запису. `release` охоплює підібраний зріз готовності до релізу;
    `all` вибирає кожну активну категорію зрілості й призначений для явних запусків
    workflow QA Profile Evidence, коли потрібен повний артефакт scorecard.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу помилки.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни орієнтованої на сценарії
    лінії `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Шукає ID сценаріїв, заголовки, surfaces, coverage IDs, посилання на docs, посилання на code,
    плагіни та вимоги до провайдера, а потім виводить відповідні цілі suite.
  - Використовуйте це перед запуском QA Lab, коли відома змінена поведінка або шлях до файла,
    але не найменший сценарій. Це лише рекомендація; усе одно вибирайте mock,
    live, Multipass, Matrix або transport proof відповідно до поведінки, яку змінюють.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає live-випробування плагіна OpenAI Kitchen Sink через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє inventory поверхні plugin SDK,
    зондує `/healthz` і `/readyz`, записує evidence CPU/RSS Gateway,
    виконує live-хід OpenAI і перевіряє adversarial diagnostics.
    Потребує live-автентифікації OpenAI, наприклад `OPENAI_API_KEY`. У hydrated Testbox
    sessions він автоматично підключає Testbox live-auth profile, коли присутній
    helper `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock-пакет сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний підсумок CPU observations
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як metrics
    і не виглядають як регресія gateway peg тривалістю в кілька хвилин.
  - Використовує зібрані артефакти `dist`; спочатку запустіть build, коли checkout ще не має
    свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині одноразової Linux VM Multipass.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, які практичні для guest:
    env-based provider keys, шлях до QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary плюс logs Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA site на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Створює npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний onboarding OpenAI API-key, налаштовує Telegram
    за замовчуванням, перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один локальний agent turn проти
    mock endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію packaged-install
    з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що прихований runtime context OpenClaw зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім додає affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - Wrapper монтує лише source harness `qa-lab` з checkout; installed package
    володіє `dist`, `openclaw/plugin-sdk` і bundled plugin runtime, тому lane не змішує
    plugins поточного checkout у package under test.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; установіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати resolved local tarball замість
    встановлення з registry.
  - За замовчуванням виводить повторюване RTT timing у `qa-evidence.json` з
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Перевизначте
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` або
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, щоб налаштувати RTT run.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` приймає comma-separated list із
    Telegram QA check IDs для sample; коли не задано, стандартна RTT-capable check
    — `telegram-mentioned-message-reply`.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - Wrapper перевіряє env credentials Telegram або Convex на хості перед
    Docker build/install work. Установлюйте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише коли навмисно debug-ите pre-credential setup.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane. Коли вибрано Convex credentials
    і role не задано, wrapper використовує `ci` у CI та
    `maintainer` поза CI.
  - GitHub Actions надає цю lane як manual maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    environment `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  normalized `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler з smoke, package, product, full або custom
  lane profiles. Установіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof потребує digest і використовує public URL safety policy:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private tarball mirrors використовують явну trusted-source policy:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` читає `.github/package-trusted-sources.json` із trusted workflow ref і не приймає URL credentials або workflow-input private-network bypass. Якщо названа policy оголошує bearer auth, налаштуйте fixed secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Artifact proof завантажує tarball artifact з іншого Actions run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточний build OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через config
    edits.
  - Перевіряє, що setup discovery залишає unconfigured downloadable plugins відсутніми,
    перший configured doctor repair явно встановлює кожен missing downloadable
    plugin, а другий restart не запускає hidden dependency
    repair.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor candidate
    очищає legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke на Parallels guests. Кожна
    вибрана platform спочатку встановлює requested baseline package, потім запускає
    installed command `openclaw update` у тому самому guest і перевіряє
    installed version, update status, gateway readiness і один local agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному guest. Використовуйте `--json` для summary artifact path і
    статусу кожної lane.
  - OpenAI lane за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски host timeout, щоб Parallels transport stalls не могли
    використати решту testing window:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script записує nested lane logs у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що outer wrapper завис.
  - Windows update може витратити 10-15 хвилин на post-update doctor і package
    update work на cold guest; це все ще нормально, коли nested npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони спільно використовують VM state і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну bundled plugin surface, тому що
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам agent
    turn перевіряє лише просту text response.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-лінію QA для Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише для вихідного checkout - пакетовані встановлення не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, змінні середовища та структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live-лінію QA для Telegram проти справжньої приватної групи, використовуючи токени driver і SUT bot із середовища.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулові оренди.
  - Значення за замовчуванням покривають canary, mention gating, адресацію команд, `/status`, згадані відповіді bot-to-bot і відповіді основних нативних команд. Значення за замовчуванням `mock-openai` також покривають детермінований reply-chain і регресії streaming фінального повідомлення Telegram. Використовуйте `--list-scenarios` для необов’язкових перевірок, таких як `session_status`.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох окремих bot в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати груповий bot-трафік.
  - Записує звіт Telegram QA, підсумок і `qa-evidence.json` у `.artifacts/qa-e2e/...`. Сценарії з відповідями містять RTT від запиту надсилання driver до спостереженої відповіді SUT.

`Mantis Telegram Live` — це обгортка PR-доказів навколо цієї лінії. Вона запускає
candidate ref з Telegram-обліковими даними, орендованими через Convex, відтворює редагований QA
звіт/пакет доказів у браузері Crabbox desktop, записує MP4-доказ,
генерує GIF з обрізанням до руху, завантажує пакет артефактів і публікує inline PR
доказ через Mantis GitHub App, коли встановлено `pr_number`. Maintainers можуть
запустити це з Actions UI через `Mantis Scenario` (`scenario_id:
telegram-live`) або напряму з коментаря до pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — це agentic нативна обгортка Telegram Desktop
before/after для візуального доказу PR. Запустіть її з Actions UI з
довільними `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) або з коментаря PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читає PR, вирішує, яка Telegram-видима поведінка доводить
зміну, запускає лінію доказу real-user Crabbox Telegram Desktop на baseline і
candidate refs, ітерує, доки нативні GIF стають корисними, записує парний
маніфест `motionPreview` і публікує таку саму 2-колонкову таблицю GIF через
Mantis GitHub App, коли встановлено `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Орендує або повторно використовує Crabbox Linux desktop, встановлює нативний Telegram Desktop, налаштовує OpenClaw з орендованим токеном Telegram SUT bot, запускає gateway і записує screenshot/MP4-доказ із видимого VNC desktop.
  - За замовчуванням використовує `--credential-source convex`, щоб workflows потребували лише broker secret Convex. Використовуйте `--credential-source env` з тими самими змінними `OPENCLAW_QA_TELEGRAM_*`, що й `pnpm openclaw qa telegram`.
  - Telegram Desktop усе ще потребує входу/профілю користувача. Bot token налаштовує лише OpenClaw. Використовуйте `--telegram-profile-archive-env <name>` для base64 `.tgz` архіву профілю або `--keep-lease` і увійдіть вручну через VNC один раз.
  - Записує `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` і `telegram-desktop-builder.mp4` у вихідний каталог.

Live transport lanes мають один стандартний контракт, щоб нові transports не розходилися; матриця покриття для кожної лінії міститься в [огляді QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
live transport QA, QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat для
цієї оренди під час виконання лінії та звільняє оренду під час завершення. Назва розділу передує
підтримці Discord, Slack і WhatsApp; контракт оренди спільний для всіх kind.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URL для суто локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити Convex site URL, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без виведення
значень secret. Використовуйте `--json` для машиночитного виводу в scripts і CI
utilities.

Контракт endpoint за замовчуванням (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Вичерпано/можна повторити: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Успіх: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише maintainer secret)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише maintainer secret)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє malformed payloads.

Форма payload для Telegram real-user kind:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` і `telegramApiId` мають бути числовими рядками.
- `tdlibArchiveSha256` і `desktopTdataArchiveSha256` мають бути SHA-256 hex strings.
- `kind: "telegram-user"` зарезервовано для workflow Mantis Telegram Desktop proof. Загальні лінії QA Lab не повинні його отримувати.

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Лінії Slack також можуть орендувати з пулу, але перевірка payload Slack наразі
міститься в Slack QA runner, а не в broker. Використовуйте
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
для рядків Slack.

### Додавання каналу до QA

Архітектура та назви scenario-helper для нових channel adapters містяться в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному `qa-lab` host seam, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують shard-набір `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються в окремому shard `unit-ui`
- Обсяг:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Справжні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` за допомогою згенерованих крихітних plugin fixtures, а не
    справжніх bundled plugin source APIs. Справжні завантаження plugin API належать до
    plugin-owned contract/integration suites.

Політика нативних залежностей:

- Тестові встановлення за замовчуванням пропускають optional native Discord opus builds. Discord voice використовує bundled `libopus-wasm`, а `@discordjs/opus` лишається вимкненим у `allowBuilds`, щоб локальні тести та лінії Testbox не компілювали native addon.
- Порівнюйте продуктивність native opus у benchmark repo `libopus-wasm`, а не в стандартних циклах install/test OpenClaw. Не встановлюйте `@discordjs/opus` у `true` у стандартному `allowBuilds`; це змусить непов’язані цикли install/test компілювати native code.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілені запуски `pnpm test` виконують дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує пікове RSS на завантажених машинах і не дає роботі auto-reply/розширень виснажувати ресурси для непов’язаних наборів тестів.
    - `pnpm test --watch` досі використовує нативний граф проєктів кореневого `vitest.config.ts`, бо цикл спостереження з кількома шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені шляхи git у дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення вихідних файлів і локальні залежні елементи графа імпортів. Зміни конфігурації/налаштування/пакетів не запускають широкі тестові прогони, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним контрольним шлюзом для вузьких змін. Він класифікує diff на core, тести core, розширення, тести розширень, застосунки, документацію, метадані релізу, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Зміни версій лише в метаданих релізу запускають націлені перевірки версій/конфігурації/кореневих залежностей із guard, який відхиляє зміни пакета поза полем версії верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, експорту, версій та інших поверхонь пакета все одно використовують ширші guard-перевірки.
    - Легкі щодо імпортів unit tests з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-областей спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важкою runtime-логікою залишаються на наявних lanes.
    - Вибрані вихідні файли helper у `plugin-sdk` і `commands` також зіставляють прогони в режимі changed з явними сусідніми тестами в цих легких lanes, тож зміни helper уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має окремі buckets для верхньорівневих core helpers, верхньорівневих integration tests `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один bucket із важкими імпортами не володів усім хвостом Node.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep розширень і релізний шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття вбудованого runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для меж чистого routing і normalization.
    - Підтримуйте справність integration suites вбудованого runner:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` і
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction досі проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only tests не є
      достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Пул Vitest і типові налаштування ізоляції">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e і live configs.
    - Коренева UI lane зберігає своє налаштування `jsdom` і оптимізатор, але також працює на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.
    - `scripts/run-vitest.mjs` завершує явні non-watch запуски Vitest після
      5 хвилин без виводу stdout або stderr. Установіть
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, щоб вимкнути watchdog для
      навмисно тихого дослідження.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staging і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передаванням або push, коли вам
      потрібен розумний локальний check gate.
    - `pnpm test:changed` за замовчуванням спрямовується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      лише з вищим лімітом workers.
    - Автомасштабування локальних workers навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється
      підключення тестів.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпортів плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий перегляд профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; include-pattern CI
      shards додають назву шарда, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один гарячий тест досі витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam напряму, замість deep-importing runtime helpers лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із нативним шляхом кореневого проєкту для цього закоміченого
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточне
      брудне дерево, спрямовуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile головного потоку для
      startup Vitest/Vite і overhead трансформацій.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичний churn повідомлень gateway, пам’яті та великих payload через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження діагностичного stability bundle
  - Перевіряє, що recorder залишається bounded, синтетичні RSS samples залишаються в межах pressure budget, а глибини per-session queues повертаються до нуля
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Вузька lane для подальшої роботи зі stability-regression, а не заміна повного набору Gateway

### E2E (агрегат repo)

- Команда: `pnpm test:e2e`
- Обсяг:
  - Запускає lane gateway smoke E2E
  - Запускає mocked Control UI browser E2E lane
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Потребує встановленого Playwright Chromium

### E2E (gateway smoke)

- Команда: `pnpm test:e2e:gateway`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові runtime-налаштування:
  - Використовує `threads` Vitest із `isolate: false`, як і решта repo.
  - Використовує адаптивні workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити overhead console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний console output.
- Обсяг:
  - End-to-end поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing вузлів і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit tests (може бути повільніше)

### E2E (mocked browser Control UI)

- Команда: `pnpm test:ui:e2e`
- Конфігурація: `test/vitest/vitest.ui-e2e.config.ts`
- Файли: `ui/src/**/*.e2e.test.ts`
- Обсяг:
  - Запускає Vite Control UI
  - Керує реальною сторінкою Chromium через Playwright
  - Замінює Gateway WebSocket детермінованими in-browser mocks
- Очікування:
  - Запускається в CI як частина `pnpm test:e2e`
  - Реальний Gateway, agents або provider keys не потрібні
  - Browser dependency має бути присутня (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Повторно використовує активний локальний OpenShell gateway
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не є частиною стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Потребує активного локального OpenShell gateway і його config source
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати non-default CLI binary або wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`, щоб надати registered gateway config ізольованому тесту
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`, щоб перевизначити Docker gateway IP, який використовує host policy fixture

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - "Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?"
  - Виявляти зміни форматів провайдерів, особливості виклику інструментів, проблеми автентифікації та поведінку обмеження частоти запитів
- Очікування:
  - Навмисно не є стабільними для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують ліміти частоти запитів
  - Краще запускати звужені підмножини, а не "все"
- Live-запуски використовують уже експортовані API-ключі та підготовлені профілі автентифікації.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали конфігурації/автентифікації у тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...` і приглушує журнали bootstrap Gateway/повідомлення Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (залежить від провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби при відповідях про ліміт частоти запитів.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів помітно активні навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway одразу передавалися під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни мережевої взаємодії Gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагодження "мій бот не працює" / збоїв, специфічних для провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Live (тести, що торкаються мережі)

Для live-матриці моделей, smoke-тестів CLI backend, smoke-тестів ACP, harness app-server
Codex і всіх live-тестів media-provider (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - а також обробки облікових даних для live-запусків - див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального чекліста оновлень і
перевірки Plugin див.
[Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

## Docker runners (необов'язкові перевірки "працює в Linux")

Ці Docker runners поділяються на два блоки:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтувавши ваш локальний каталог конфігурації, workspace і необов'язковий env-файл профілю. Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners зберігають власні практичні обмеження там, де це потрібно:
  `test:docker:live-models` за замовчуванням використовує підібраний підтримуваний high-signal набір, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Встановлюйте `OPENCLAW_LIVE_MAX_MODELS`
  або env-змінні Gateway, коли явно хочете менший ліміт або ширше сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ є лише Node/Git runner для install/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball. Functional-образ встановлює той самий tarball у `/app` для lanes функціональності зібраного застосунку. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як обмеження ресурсів не дають важким live, npm-install і multi-service lanes запускатися одночасно. Якщо один lane важчий за активні обмеження, scheduler все одно може запустити його, коли пул порожній, а потім тримає його запущеним наодинці, доки місткість знову не стане доступною. Значення за замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише коли Docker-хост має більше запасу ресурсів. Runner за замовчуванням виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках починати довші lanes першими. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест lanes без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних lanes, потреб package/image і облікових даних.
- `Package Acceptance` - це GitHub-native package gate для "чи цей installable tarball працює як продукт?" Він визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins) щодо контракту package/update/Plugin, survivor-матриці published-upgrade, стандартних значень релізу та triage збоїв.
- Перевірки збірки та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить статичний зібраний граф із `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо запуск до dispatch імпортує залежності пакета, як-от Commander, prompt UI, undici або журналювання, до dispatch команди; він також утримує bundled gateway run chunk у межах бюджету та відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Застаріла сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише shipped-package metadata gaps: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, legacy plugin install-record locations, відсутня persistence marketplace install-record і міграція config metadata під час `plugins update`. Для пакетів після `2026.4.25` ці paths є суворими помилками.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні paths вищого рівня.
- Docker/Bash E2E lanes, які встановлюють запакований OpenClaw tarball через `scripts/lib/openclaw-e2e-instance.sh`, обмежують `npm install` значенням `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (за замовчуванням `600s`; встановіть `0`, щоб вимкнути wrapper для налагодження).

Live-model Docker runners також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб external-CLI OAuth міг оновлювати токени без зміни auth store хоста:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` і `pnpm qa:observability:smoke` є private QA source-checkout lanes. Вони навмисно не входять до package Docker release lanes, бо npm tarball пропускає QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований OpenClaw tarball у Docker, налаштовує OpenAI через env-ref onboarding плюс Telegram за замовчуванням, запускає doctor і виконує один mocked OpenAI agent turn. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke-тест шляху користувача релізу: `pnpm test:docker:release-user-journey` глобально встановлює запакований tarball OpenClaw у чистому домашньому каталозі Docker, запускає онбординг, налаштовує імітований провайдер OpenAI, виконує хід агента, встановлює/видаляє зовнішні plugins, налаштовує ClickClack на локальну фікстуру, перевіряє вихідні/вхідні повідомлення, перезапускає Gateway і запускає doctor.
- Smoke-тест типізованого онбордингу релізу: `pnpm test:docker:release-typed-onboarding` встановлює запакований tarball, проводить `openclaw onboard` через справжній TTY, налаштовує OpenAI як env-ref провайдера, перевіряє, що сирий ключ не зберігається, і запускає імітований хід агента.
- Smoke-тест медіа/пам’яті релізу: `pnpm test:docker:release-media-memory` встановлює запакований tarball, перевіряє розуміння зображення з PNG-вкладення, вивід генерації зображень, сумісний з OpenAI, пригадування через пошук у пам’яті та збереження пригадування після перезапуску Gateway.
- Smoke-тест шляху користувача оновлення релізу: `pnpm test:docker:release-upgrade-user-journey` за замовчуванням встановлює найновішу опубліковану базову версію, старішу за кандидатний tarball, налаштовує стан провайдера/plugin/ClickClack в опублікованому пакеті, оновлює до кандидатного tarball, а потім повторно запускає основний шлях агента/plugin/каналу. Якщо старішої опублікованої базової версії немає, він повторно використовує кандидатну версію. Перевизначте базову версію через `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke-тест маркетплейсу plugins релізу: `pnpm test:docker:release-plugin-marketplace` встановлює з локального фікстурного маркетплейсу, оновлює встановлений plugin, видаляє його та перевіряє, що CLI plugin зникає зі скороченими метаданими встановлення.
- Smoke-тест встановлення Skill: `pnpm test:docker:skill-install` глобально встановлює запакований tarball OpenClaw у Docker, вимикає встановлення завантажених архівів у конфігурації, знаходить поточний живий slug Skill ClawHub через пошук, встановлює його за допомогою `openclaw skills install` і перевіряє встановлений Skill разом із метаданими походження/lock `.clawhub`.
- Smoke-тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакета `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Smoke-тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх брудної фікстури старого користувача з агентами, конфігурацією каналів, allowlist plugins, застарілим станом залежностей plugins і наявними файлами workspace/session. Він запускає оновлення пакета плюс неінтерактивний doctor без живого провайдера або ключів каналу, потім запускає Gateway із локальним зворотним інтерфейсом і перевіряє збереження конфігурації/стану плюс бюджети запуску/статусу.
- Smoke-тест виживання після опублікованого оновлення: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, сіє реалістичні файли наявного користувача, налаштовує цю базову версію вбудованим рецептом команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає Gateway із локальним зворотним інтерфейсом і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегувальний планувальник розгорнути точні локальні базові версії через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, і розгорнути issue-подібні фікстури через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту встановлення зовнішніх plugins OpenClaw. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, розв’язує мета-токени базової версії, такі як `last-stable-4` або `all-since-2026.4.23`, а Full Release Validation розгортає пакетний gate release-soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Smoke-тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого транскрипту runtime-контексту плюс ремонт через doctor уражених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому домашньому каталозі та перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-тест Docker-інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш між контейнерами root, update і direct-npm. Smoke-тест оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до кандидатного tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm-кеш, щоб записи кешу, що належать root, не маскували поведінку встановлення локально для користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-тест CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає кореневий Dockerfile-образ, сіє двох агентів з одним workspace в ізольованому домашньому каталозі контейнера, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використайте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS-автентифікація + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест CDP-знімка браузера: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із raw CDP, запускає `browser doctor --deep` і перевіряє, що знімки CDP-ролей покривають URL посилань, клікабельні елементи, просунуті курсором, iframe refs і метадані фреймів.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає імітований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє схему провайдера та перевіряє, що raw detail з’являється в логах Gateway.
- Міст каналу MCP (засіяний Gateway + stdio-міст + smoke-тест raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета OpenClaw (справжній stdio MCP-сервер + smoke-тест allow/deny вбудованого профілю OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (скрипт: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (справжній Gateway + демонтаж дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест встановлення/оновлення для локального шляху, `file:`, npm-реєстру з піднятими залежностями, некоректних метаданих npm-пакета, рухомих git refs, kitchen-sink ClawHub, оновлень маркетплейсу та ввімкнення/інспекції Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару package/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний фікстурний сервер ClawHub.
- Smoke-тест незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований tarball OpenClaw у порожньому контейнері, встановлює npm plugin, перемикає enable/disable, оновлює та відкотить його через локальний npm-реєстр, видаляє встановлений код, а потім перевіряє, що uninstall усе ще прибирає застарілий стан, водночас логуючи метрики RSS/CPU для кожної фази життєвого циклу.
- Smoke-тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` покриває smoke-тест встановлення/оновлення для локального шляху, `file:`, npm-реєстру з піднятими залежностями, рухомих git refs, фікстур ClawHub, оновлень маркетплейсу та ввімкнення/інспекції Claude-bundle. `pnpm test:docker:plugin-update` покриває поведінку незміненого оновлення для встановлених plugins. `pnpm test:docker:plugin-lifecycle-matrix` покриває встановлення npm plugin з відстеженням ресурсів, enable, disable, upgrade, downgrade і uninstall за відсутнього коду.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для конкретних наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не локальний. QR і Docker-тести інсталятора зберігають власні Dockerfile, бо вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Docker-ранери live-model також монтують поточний checkout лише для читання та
розгортають його в тимчасову робочу директорію всередині контейнера. Це зберігає runtime-образ
компактним, водночас запускаючи Vitest саме з вашим локальним source/config.
Крок staging пропускає великі локальні кеші та вихідні файли збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку `.build` або
директорії виводу Gradle, щоб живі Docker-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live probes Gateway не запускали
справжні воркери каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття
Gateway з цієї Docker-смуги.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
справжній chat request через проксі Open WebUI `/api/chat/completions`.
Задайте `OPENWEBUI_SMOKE_MODE=models` для CI-перевірок release-шляху, які мають зупинятися
після входу в Open WebUI та виявлення моделі, не очікуючи на завершення live model.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися завантажити
образ Open WebUI, а Open WebUI може знадобитися завершити власне налаштування холодного старту.
Ця смуга очікує придатний ключ live model. Надайте його через process
environment, підготовлені auth profiles або явний `OPENCLAW_PROFILE_FILE`.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
справжнього облікового запису Telegram, Discord або iMessage. Він завантажує seeded-контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, metadata вкладень,
поведінку черги live event, маршрутизацію outbound send і сповіщення каналів +
permissions у стилі Claude через справжній stdio MCP bridge. Перевірка сповіщень
інспектує сирі stdio MCP frames напряму, щоб smoke-тест перевіряв те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:agent-bundle-mcp-tools` детермінований і не потребує ключа live
model. Він збирає Docker-образ репозиторію, запускає справжній stdio MCP probe server
усередині контейнера, матеріалізує цей server через вбудований OpenClaw bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live model.
Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і одноразовий дочірній turn `sessions_spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke-тест потоку природною мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Залиште цей script для regression/debug workflow. Він може знову знадобитися для перевірки маршрутизації потоків ACP, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтується та sourcing виконується перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, отриманих із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових config/workspace директорій і без зовнішніх CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для cached CLI installs усередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком tests
  - Типові dirs: `.minimax`
  - Типові files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider runs монтують лише потрібні dirs/files, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, як-от `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` у reruns, які не потребують rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` для гарантії, що creds надходять зі сховища profiles (не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку Gateway відкриває для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого image tag Open WebUI

## Перевірка документації

Запускайте перевірки docs після редагування документації: `pnpm check:docs`.
Запускайте повну валідацію anchors Mintlify, коли потрібні також перевірки headings на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії "real pipeline" без справжніх providers:

- Gateway tool calling (mock OpenAI, справжній Gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + примусово застосовує auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька CI-безпечних tests, які поводяться як "agent reliability evals":

- Mock tool-calling через справжній Gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які перевіряють session wiring і ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills перелічені в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає agent `SKILL.md` перед використанням і чи виконує required steps/args?
- **Workflow contracts:** multi-turn scenarios, які перевіряють tool order, перенесення session history і sandbox boundaries.

Майбутні evals мають насамперед залишатися детермінованими:

- Scenario runner із mock providers для перевірки tool calls + order, читання skill files і session wiring.
- Невеликий набір сценаріїв, сфокусованих на skills (use vs avoid, gating, prompt injection).
- Optional live evals (opt-in, gated через env) лише після появи CI-безпечного набору.

## Contract tests (форма Plugin і channel)

Contract tests перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
interface contract. Вони проходять усі виявлені plugins і запускають набір
assertions форми та поведінки. Типова unit-смуга `pnpm test` навмисно
пропускає ці спільні seam і smoke files; запускайте contract commands явно,
коли торкаєтеся спільних surfaces channel або provider.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Contract setup wizard
- **session-binding** - Поведінка session binding
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка inbound message
- **actions** - Handlers дій channel
- **threading** - Обробка thread ID
- **directory** - API directory/roster
- **group-policy** - Примусове застосування group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма registry Plugin

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/interface Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни exports або subpaths plugin-sdk
- Після додавання або модифікації channel чи provider plugin
- Після refactoring реєстрації або discovery Plugin

Contract tests запускаються в CI та не потребують справжніх API keys.

## Додавання регресій (настанови)

Коли ви виправляєте provider/model issue, виявлену live:

- Додайте CI-безпечну регресію, якщо можливо (mock/stub provider або capture точної request-shape transformation)
- Якщо це за своєю суттю лише live-only (rate limits, auth policies), тримайте live test вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-безпечний gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну sampled target на клас SecretRef з registry metadata (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-segment відхиляються.
  - Якщо ви додаєте нову target family SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно падає на unclassified target ids, щоб нові classes не можна було непомітно пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
