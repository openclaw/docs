---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори тестів, Docker runners і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-07-02T08:45:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір тестів (і що він свідомо _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, під час налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) - архітектура, командна поверхня, авторинг сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) - довідник для `pnpm openclaw qa matrix`.
- [Карта зрілості](/uk/maturity/scorecard) - як докази release QA підтримують рішення щодо стабільності та LTS.
- [QA-канал](/uk/channels/qa-channel) - синтетичний транспортний Plugin, який використовується сценаріями з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на просторій машині: `pnpm test:max`
- Прямий watch-цикл Vitest: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Коли ви ітеруєтеся над однією помилкою, спершу надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-смуга на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

## Тимчасові директорії тестів

Для тимчасових директорій, що належать тестам, надавайте перевагу спільним
хелперам у `test/helpers/temp-dir.ts`. Вони роблять володіння явним і тримають
очищення в тому самому життєвому циклі тесту:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` навмисно не надає методу ручного очищення; Vitest
володіє очищенням після кожного тесту. Наявні низькорівневі хелпери залишаються для тестів, які
ще не були перенесені, але нові та перенесені тести мають використовувати трекер
з автоочищенням. Уникайте нового використання ручних `makeTempDir`, `cleanupTempDirs` або
`createTempDirTracker` і уникайте нових прямих викликів `fs.mkdtemp*` у тестах,
якщо кейс явно не перевіряє сиру поведінку temp-dir. Додавайте придатний для аудиту
дозвільний коментар із конкретною причиною, коли тест навмисно потребує прямої тимчасової
директорії:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Для видимості міграції `node scripts/report-test-temp-creations.mjs` звітує про
нове пряме створення temp-dir і нове ручне використання спільних хелперів у доданих рядках
diff, не блокуючи наявні стилі очищення. Його файлова область навмисно
дотримується тієї самої класифікації test-path, яку використовує `scripts/changed-lanes.mjs`,
замість підтримки окремої евристики імен файлів test-helper, водночас пропускаючи
саму реалізацію спільного хелпера. `check:changed` запускає цей звіт для
змінених тестових шляхів як warning-only сигнал CI; знахідки є warning-анотаціями GitHub,
а не збоями.

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + проби gateway tool/image): `pnpm test:live`
- Цільовий запуск одного live-файлу тихо: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти продуктивності runtime: запустіть `OpenClaw Performance` з
  `live_openai_candidate=true` для реального agent turn `openai/gpt-5.5` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти смуг mock-provider, deep-profile і GPT 5.5 до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить числа source-level gateway boot, memory,
  plugin-pressure, repeated fake-model hello-loop і CLI startup.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає текстовий turn плюс невелику пробу в стилі file-read.
    Моделі, чиї metadata оголошують вхід `image`, також запускають крихітний image turn.
    Вимкніть додаткові проби за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають багаторазовий live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, шардовані за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і image attachment
    маршрутизуються через native Plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через Codex app-server harness, яким володіє Plugin,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує проби image,
    cron MCP, sub-agent і Guardian. Вимкніть пробу sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші проби:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після проби sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Встановлює запакований tarball OpenClaw у Docker, запускає onboarding OpenAI API-key
    і перевіряє, що Codex Plugin плюс залежність `@openai/codex`
    були завантажені до керованого кореня npm-проєкту на вимогу.
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Пакує fixture Plugin із реальною залежністю `slugify`, встановлює його через
    `npm-pack:`, перевіряє залежність під керованим коренем npm-проєкту,
    потім просить live-модель OpenAI викликати інструмент Plugin і повернути прихований
    slug.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders перевірка для поверхні rescue command message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без config із фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback транслюється в audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожньої директорії стану OpenClaw, перевіряє сучасний onboard
    entrypoint Crestodian, застосовує записи setup/model/agent/Discord Plugin + SecretRef,
    валідує config і перевіряє audit entries. Той самий шлях налаштування Ring 0
    також покритий у QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON звітує Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний кейс, надавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди стоять поруч з основними наборами тестів, коли потрібен реалізм QA-lab:

CI запускає QA Lab у виділених workflow. Agentic parity вкладено під
`QA-Lab - All Lanes` і release validation, а не в окремий PR workflow.
Широка валідація має використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. Стабільні/default release
checks тримають exhaustive live/Docker soak за `run_release_soak=true`; профіль
`full` примусово вмикає soak. `QA-Lab - All Lanes`
запускається щоночі на `main` і з ручного dispatch із mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельними jobs. Scheduled QA і release checks передають Matrix
`--profile fast` явно, тоді як Matrix CLI і manual workflow input
за замовчуванням залишаються `all`; ручний dispatch може шардити `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс швидкі Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими й уникали звичайного startup provider-plugin. Ці live transport
gateways вимикають memory search; поведінка memory залишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA, підтримувані репозиторієм, безпосередньо на хості.
  - Записує артефакти верхнього рівня `qa-evidence.json`, `qa-suite-summary.json` і
    `qa-suite-report.md` для вибраного набору сценаріїв, включно з
    виборами змішаних потоків, Vitest і Playwright-сценаріїв.
  - Коли запускається через `pnpm openclaw qa run --qa-profile <profile>`, вбудовує
    scorecard вибраного таксономічного профілю в той самий `qa-evidence.json`.
    `smoke-ci` записує стислий evidence, який встановлює `evidenceMode: "slim"` і пропускає
    `execution` для кожного запису. `release` охоплює підібраний зріз готовності до релізу;
    `all` вибирає кожну активну категорію зрілості й призначений для явних запусків workflow
    QA Profile Evidence, коли потрібен повний артефакт scorecard.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, коли будь-який сценарій не проходить. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими provider `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний server provider на базі AIMock для експериментального
    покриття fixtures і protocol-mock без заміни scenario-aware
    лінії `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Шукає scenario IDs, titles, surfaces, coverage IDs, docs refs, code refs,
    plugins і provider requirements, а потім виводить відповідні suite targets.
  - Використовуйте це перед запуском QA Lab, коли ви знаєте змінену поведінку або шлях до файлу,
    але не найменший сценарій. Це лише рекомендація; усе одно вибирайте mock,
    live, Multipass, Matrix або transport proof на основі поведінки, яку змінюєте.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає live OpenAI Kitchen Sink plugin gauntlet через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє inventory поверхні plugin SDK,
    перевіряє `/healthz` і `/readyz`, записує Gateway CPU/RSS
    evidence, запускає live OpenAI turn і перевіряє adversarial diagnostics.
    Потребує live OpenAI auth, наприклад `OPENAI_API_KEY`. У hydrated Testbox
    sessions він автоматично підтягує Testbox live-auth profile, коли наявний
    helper `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний summary CPU observations
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як metrics
    і не виглядають як хвилинна regression із gateway peg.
  - Використовує зібрані артефакти `dist`; спершу запустіть build, якщо checkout ще не має
    свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині disposable Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі flags вибору provider/model, що й `qa suite`.
  - Live runs передають підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він наявний.
  - Output dirs мають залишатися під repo root, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary, а також Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один local agent turn проти
    mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    лінію з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім seed-ить affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його в active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate пакета OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, а потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - Wrapper монтує лише source harness `qa-lab` з checkout; installed package
    володіє `dist`, `openclaw/plugin-sdk` і bundled plugin
    runtime, тому lane не змішує plugins з поточного checkout у package
    under test.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - За замовчуванням виводить repeated RTT timing у `qa-evidence.json` з
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Перевизначте
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` або
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, щоб налаштувати RTT run.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` приймає comma-separated list
    Telegram QA check IDs для вибірки; коли не встановлено, default RTT-capable check
    — `telegram-mentioned-message-reply`.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret наявні в CI,
    Docker wrapper автоматично вибирає Convex.
  - Wrapper перевіряє Telegram або Convex credential env на хості перед
    Docker build/install work. Встановлюйте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише коли навмисно налагоджуєте pre-credential setup.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane. Коли вибрано Convex credentials
    і role не встановлено, wrapper використовує `ci` у CI та
    `maintainer` поза CI.
  - GitHub Actions expose-ить цю lane як manual maintainer workflow
    `NPM Telegram Beta E2E`. Вона не запускається під час merge. Workflow використовує
    environment `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також expose-ить `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, upload-ить
  normalized `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler зі smoke, package, product, full або custom
  lane profiles. Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
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

- Enterprise/private tarball mirrors використовують explicit trusted-source policy:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` читає `.github/package-trusted-sources.json` з trusted workflow ref і не приймає URL credentials або workflow-input private-network bypass. Якщо названа policy оголошує bearer auth, налаштуйте fixed secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Artifact proof завантажує tarball artifact з іншого Actions run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Packs і встановлює поточний build OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через config
    edits.
  - Перевіряє, що setup discovery залишає unconfigured downloadable plugins absent,
    перший configured doctor repair явно встановлює кожен missing downloadable
    plugin, а другий restart не запускає hidden dependency
    repair.
  - Також встановлює known older npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що candidate
    post-update doctor очищує legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke на Parallels guests. Кожна
    вибрана platform спочатку встановлює requested baseline package, потім запускає
    installed command `openclaw update` у тому самому guest і перевіряє
    installed version, update status, gateway readiness і один local agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному guest. Використовуйте `--json` для summary artifact path і
    per-lane status.
  - OpenAI lane за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    OpenAI model.
  - Обгорніть довгі локальні runs у host timeout, щоб Parallels transport stalls не могли
    спожити решту testing window:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script записує nested lane logs у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що outer wrapper завис.
  - Windows update може витратити 10-15 хвилин у post-update doctor і package
    update work на cold guest; це все ще нормальний стан, коли nested npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони спільно використовують VM state і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну bundled plugin surface, оскільки
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли agent
    turn сам перевіряє лише просту text response.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лінію Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише для checkout вихідного коду - пакетовані встановлення не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, змінні середовища та структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA-лінію Telegram проти справжньої приватної групи, використовуючи токени driver і SUT-бота зі змінних середовища.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних pooled облікових даних. За замовчуванням використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled lease.
  - Значення за замовчуванням покривають canary, mention gating, адресацію команд, `/status`, відповіді bot-to-bot зі згадкою та відповіді основних нативних команд. Значення за замовчуванням `mock-openai` також покривають deterministic reply-chain і регресії стримінгу фінального повідомлення Telegram. Використовуйте `--list-scenarios` для додаткових probes, таких як `session_status`.
  - Завершується з ненульовим кодом, коли будь-який сценарій падає. Використовуйте `--allow-failures`, коли потрібні артефакти без failing exit code.
  - Потребує двох різних ботів в одній приватній групі, причому SUT-бот має відкривати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver-бот може спостерігати груповий трафік ботів.
  - Записує звіт Telegram QA, підсумок і `qa-evidence.json` у `.artifacts/qa-e2e/...`. Сценарії з відповідями містять RTT від запиту надсилання driver до спостереженої відповіді SUT.

`Mantis Telegram Live` - це PR-evidence wrapper навколо цієї лінії. Він запускає
candidate ref з орендованими через Convex обліковими даними Telegram, рендерить редагований QA
report/evidence bundle у desktop-браузері Crabbox, записує MP4-докази,
генерує GIF з обрізанням руху, завантажує bundle артефактів і публікує inline PR
evidence через Mantis GitHub App, коли задано `pr_number`. Maintainers можуть
запустити його з Actions UI через `Mantis Scenario` (`scenario_id:
telegram-live`) або напряму з коментаря pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` - це agentic native Telegram Desktop
before/after wrapper для візуального доказу PR. Запустіть його з Actions UI з
довільними `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) або з коментаря PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читає PR, вирішує, яка видима в Telegram поведінка доводить
зміну, запускає real-user Crabbox Telegram Desktop proof lane на baseline і
candidate refs, ітерує, доки нативні GIF не стануть корисними, записує paired
`motionPreview` manifest і публікує ту саму 2-column GIF table через
Mantis GitHub App, коли задано `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Орендує або повторно використовує desktop Crabbox Linux, встановлює нативний Telegram Desktop, налаштовує OpenClaw з орендованим токеном Telegram SUT-бота, запускає gateway і записує screenshot/MP4-докази з видимого VNC desktop.
  - За замовчуванням використовує `--credential-source convex`, тому workflows потребують лише broker secret Convex. Використовуйте `--credential-source env` з тими самими змінними `OPENCLAW_QA_TELEGRAM_*`, що й `pnpm openclaw qa telegram`.
  - Telegram Desktop усе ще потребує login/profile користувача. Bot token налаштовує лише OpenClaw. Використовуйте `--telegram-profile-archive-env <name>` для base64 `.tgz` архіву профілю або `--keep-lease` і один раз увійдіть вручну через VNC.
  - Записує `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` і `telegram-desktop-builder.mp4` у вихідному каталозі.

Live transport lanes мають один стандартний контракт, щоб нові transports не розходилися; матриця покриття для кожної лінії розміщена в [огляді QA → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` - це широкий синтетичний suite і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
live transport QA, QA lab отримує exclusive lease з pool на базі Convex, надсилає heartbeat для цього
lease, поки лінія виконується, і звільняє lease під час shutdown. Назва розділу передує
підтримці Discord, Slack і WhatsApp; контракт lease спільний для різних kinds.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Admin commands maintainer-а (pool add/remove/list) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live runs, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без друку
значень secrets. Використовуйте `--json` для машинозчитуваного виводу в scripts і CI
utilities.

Контракт endpoint за замовчуванням (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Success: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише maintainer secret)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove` (лише maintainer secret)
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Форма payload для Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє malformed payloads.

Форма payload для Telegram real-user kind:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` і `telegramApiId` мають бути числовими рядками.
- `tdlibArchiveSha256` і `desktopTdataArchiveSha256` мають бути hex-рядками SHA-256.
- `kind: "telegram-user"` зарезервовано для workflow Mantis Telegram Desktop proof. Generic QA Lab lanes не повинні його отримувати.

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes також можуть орендувати з pool, але перевірка payload Slack наразі
живе в Slack QA runner, а не в broker. Використовуйте
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
для рядків Slack.

### Додавання каналу до QA

Назви архітектури та scenario-helper для нових channel adapters наведені в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізуйте transport runner на спільному host seam `qa-lab`, оголосіть `qaRunners` у маніфесті Plugin, змонтуйте як `openclaw qa <runner>` і створіть сценарії в `qa/scenarios/`.

## Тестові suites (що де запускається)

Думайте про suites як про «зростання реалізму» (і зростання flakiness/cost):

### Unit / integration (default)

- Command: `pnpm test`
- Config: нецільові запуски використовують shard set `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для parallel scheduling
- Files: inventories core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у dedicated shard `unit-ui`
- Scope:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих bugs
- Expectations:
  - Запускається в CI
  - Не потребує справжніх keys
  - Має бути fast and stable
  - Tests resolver-а й public-surface loader-а мають доводити широке fallback behavior `api.js` і
    `runtime-api.js` із generated tiny plugin fixtures, а не
    реальними bundled plugin source APIs. Real plugin API loads належать до
    plugin-owned contract/integration suites.

Політика нативних залежностей:

- Встановлення тестів за замовчуванням пропускають optional native Discord opus builds. Discord voice використовує bundled `libopus-wasm`, а `@discordjs/opus` лишається вимкненим у `allowBuilds`, щоб local tests і Testbox lanes не компілювали native addon.
- Порівнюйте продуктивність native opus у benchmark repo `libopus-wasm`, а не в default OpenClaw install/test loops. Не задавайте `@discordjs/opus` як `true` у default `allowBuilds`; це змушує unrelated install/test loops компілювати native code.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує пікове RSS на навантажених машинах і не дає роботі auto-reply/розширень виснажувати ресурси для непов’язаних наборів тестів.
    - `pnpm test --watch` і далі використовує нативний кореневий граф проєктів `vitest.config.ts`, тому що цикл спостереження з кількома шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через обмежені за областю лінії, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не сплачує повну вартість запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві обмежені за областю лінії: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні елементи графа імпортів. Зміни конфігурації/налаштування/пакетів не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний контрольний шлюз для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версій лише в метаданих релізу запускають цільові перевірки версії/конфігурації/кореневих залежностей із guard, який відхиляє зміни пакетів поза верхньорівневим полем версії.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth-скриптів і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, export, версій та інших поверхонь пакета й далі використовують ширші guards.
    - Легкі щодо імпортів модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-областей спрямовуються через лінію `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важкі runtime-файли лишаються на наявних лініях.
    - Вибрані вихідні файли helper у `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними сусідніми тестами в цих легких лініях, тому зміни helper не перезапускають увесь важкий набір для цього каталогу.
    - `auto-reply` має окремі бакети для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один важкий щодо імпортів бакет не займав увесь хвіст Node.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep розширень і релізний шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих важких щодо plugin/розширень наборів на реліз-кандидатах.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли змінюєте вхідні дані discovery для message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресійні тести helper для чистих меж routing і normalization.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` і
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction досі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише для helper
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові значення пулу Vitest та ізоляції">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e і live-конфігураціях.
    - Коренева UI-лінія зберігає свої `jsdom` setup і optimizer, але також працює
      на спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.
    - `scripts/run-vitest.mjs` завершує явні non-watch запуски Vitest після
      5 хвилин без виводу stdout або stderr. Встановіть
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, щоб вимкнути watchdog для
      навмисно тихого дослідження.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні лінії запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед переданням або push, коли вам
      потрібен розумний локальний check gate.
    - `pnpm test:changed` типово спрямовується через дешеві обмежені за областю лінії. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішить, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      лише з вищою межею workers.
    - Локальне auto-scaling workers навмисно консервативне й відступає,
      коли load average хоста вже високий, тому кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб reruns у changed-mode лишалися коректними, коли змінюється
      тестове wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами,
      зміненими відносно `origin/main`.
    - Дані timing для shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; CI-шарди з include-pattern
      додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test досі витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузькою локальною межею `*.runtime.ts` і
      mock-айте цю межу напряму замість deep-importing runtime helpers лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` з нативним шляхом кореневого проєкту для цього committed
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarks поточне
      dirty tree, спрямовуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile головного thread для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає справжній loopback Gateway із diagnostics, увімкненими типово
  - Проганяє синтетичний churn gateway message, memory і large-payload через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers для persistence diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, синтетичні RSS samples лишаються нижче pressure budget, а глибини черг на session повертаються до нуля
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Вузька лінія для follow-up щодо stability-regression, не заміна повного набору Gateway

### E2E (агрегат репозиторію)

- Команда: `pnpm test:e2e`
- Область:
  - Запускає лінію gateway smoke E2E
  - Запускає mocked Control UI browser E2E lane
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Потребує встановленого Playwright Chromium

### E2E (gateway smoke)

- Команда: `pnpm test:e2e:gateway`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E tests у `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує adaptive workers (CI: до 2, локально: типово 1).
  - Типово працює в silent mode, щоб зменшити overhead console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Область:
  - Наскрізна поведінка multi-instance gateway
  - Поверхні WebSocket/HTTP, pairing node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit tests (може бути повільніше)

### E2E (Control UI mocked browser)

- Команда: `pnpm test:ui:e2e`
- Конфігурація: `test/vitest/vitest.ui-e2e.config.ts`
- Файли: `ui/src/**/*.e2e.test.ts`
- Область:
  - Запускає Vite Control UI
  - Проганяє реальну сторінку Chromium через Playwright
  - Замінює Gateway WebSocket детермінованими in-browser mocks
- Очікування:
  - Запускається в CI як частина `pnpm test:e2e`
  - Реальні Gateway, agents або provider keys не потрібні
  - Browser dependency має бути присутня (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Повторно використовує активний локальний OpenShell gateway
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical filesystem behavior через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Потребує активного локального OpenShell gateway і його config source
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI binary або wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` для надання registered gateway config ізольованому тесту
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` для перевизначення Docker gateway IP, який використовує host policy fixture

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих плагінів у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - "Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?"
  - Виявляти зміни форматів провайдерів, особливості виклику інструментів, проблеми автентифікації та поведінку обмежень швидкості
- Очікування:
  - За задумом не стабільно для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти швидкості
  - Надавайте перевагу запуску звужених підмножин замість "усього"
- Live-запуски використовують уже експортовані ключі API та підготовлені профілі автентифікації.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали конфігурації/автентифікації в тимчасовий тестовий домашній каталог, щоб unit-фікстури не могли змінити ваш справжній `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш справжній домашній каталог.
- `pnpm test:live` за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...` і приглушує журнали початкового запуску Gateway/повідомлення Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація ключів API (залежно від провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи перевизначення для окремого live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях про обмеження швидкості.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб тривалі виклики провайдерів були видимо активними навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway транслювалися негайно під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для Gateway/зондів через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни мережевої взаємодії Gateway / протоколу WS / сполучення: додайте `pnpm test:e2e`
- Налагодження "мій бот не працює" / збоїв, специфічних для провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke-тестів CLI-бекенду, smoke-тестів ACP, harness Codex app-server
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, медіа-harness), а також обробки облікових даних для live-запусків, див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального контрольного списку перевірки оновлень і
плагінів див.
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins).

## Docker-запускачі (необов’язкові перевірки "працює в Linux")

Ці Docker-запускачі поділяються на дві групи:

- Запускачі live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл ключів профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації, робочу область і необов’язковий env-файл профілю. Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-запускачі зберігають власні практичні обмеження там, де потрібно:
  `test:docker:live-models` за замовчуванням використовує підібраний підтримуваний набір із високою цінністю сигналу, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Встановіть `OPENCLAW_LIVE_MAX_MODELS`
  або змінні середовища Gateway, коли явно хочете менший ліміт або ширше сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Порожній образ є лише Node/Git-запускачем для напрямів інсталяції/оновлення/залежностей плагінів; ці напрями монтують попередньо зібраний tarball. Функціональний образ інсталює той самий tarball у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як ресурсні обмеження не дають важким live-, npm-install- і multi-service-напрямам запускатися всім одночасно. Якщо один напрям важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, а потім тримає його єдиним запущеним, доки знову не стане доступною ємність. Значення за замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише коли Docker-хост має більший запас ресурсів. Запускач за замовчуванням виконує Docker-перевірку перед стартом, видаляє застарілі E2E-контейнери OpenClaw, друкує статус кожні 30 секунд, зберігає таймінги успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках спершу стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб пакета/образу та облікових даних.
- `Package Acceptance` — це нативний для GitHub пакетний gate для питання "чи працює цей інстальований tarball як продукт?" Він визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-напрями проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковано за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins) щодо контракту пакета/оновлення/плагіна, матриці сумісності опублікованих оновлень, релізних значень за замовчуванням і розбору збоїв.
- Перевірки збірки й релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист проходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо старт перед dispatch імпортує залежності пакета, такі як Commander, prompt UI, undici або logging, до dispatch команди; він також утримує зібраний chunk запуску Gateway у межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Застарілу сумісність Package Acceptance обмежено версією `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини метаданих відвантажених пакетів: пропущені приватні записи інвентарю QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, застарілі розташування записів інсталяції плагінів, відсутнє збереження записів інсталяції marketplace і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими збоями.
- Container smoke-запускачі: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.
- Docker/Bash E2E-напрями, які інсталюють запакований OpenClaw tarball через `scripts/lib/openclaw-e2e-instance.sh`, обмежують `npm install` значенням `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (за замовчуванням `600s`; встановіть `0`, щоб вимкнути wrapper для налагодження).

Docker-запускачі live-моделей також bind-монтують лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke-тести: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` і `pnpm qa:observability:smoke` — це приватні QA-напрями для source-checkout. Вони навмисно не входять до пакетних Docker-релізних напрямів, бо npm-tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold-створення): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально інсталює запакований OpenClaw tarball у Docker, налаштовує OpenAI через onboarding із env-ref і Telegram за замовчуванням, запускає doctor і виконує один змокований turn агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke-тест користувацького шляху релізу: `pnpm test:docker:release-user-journey` глобально встановлює запакований tarball OpenClaw у чистому домашньому каталозі Docker, запускає onboarding, налаштовує мокований провайдер OpenAI, виконує хід агента, встановлює/видаляє зовнішні plugins, налаштовує ClickClack проти локальної фікстури, перевіряє вихідні/вхідні повідомлення, перезапускає Gateway і запускає doctor.
- Smoke-тест типізованого onboarding релізу: `pnpm test:docker:release-typed-onboarding` встановлює запакований tarball, проводить `openclaw onboard` через реальний TTY, налаштовує OpenAI як env-ref провайдер, перевіряє відсутність збереження сирого ключа й запускає мокований хід агента.
- Smoke-тест медіа/пам’яті релізу: `pnpm test:docker:release-media-memory` встановлює запакований tarball, перевіряє розуміння зображення з PNG-вкладення, вивід генерації зображення, сумісний з OpenAI, пригадування через пошук у пам’яті та збереження пригадування після перезапуску Gateway.
- Smoke-тест користувацького шляху оновлення релізу: `pnpm test:docker:release-upgrade-user-journey` за замовчуванням встановлює найновіший опублікований базовий пакет, старіший за кандидатний tarball, налаштовує стан провайдера/plugin/ClickClack в опублікованому пакеті, оновлює до кандидатного tarball, а потім повторно запускає основний шлях агента/plugin/каналу. Якщо старішої опублікованої базової версії немає, він повторно використовує кандидатну версію. Перевизначте базову версію через `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke-тест маркетплейсу plugins релізу: `pnpm test:docker:release-plugin-marketplace` встановлює з локальної фікстури маркетплейсу, оновлює встановлений plugin, видаляє його та перевіряє, що CLI plugin зникає разом з обрізаними метаданими встановлення.
- Smoke-тест встановлення Skills: `pnpm test:docker:skill-install` глобально встановлює запакований tarball OpenClaw у Docker, вимикає встановлення завантажених архівів у конфігурації, визначає поточний live slug Skills ClawHub із пошуку, встановлює його через `openclaw skills install` і перевіряє встановлений Skills разом із метаданими походження/lock `.clawhub`.
- Smoke-тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакета `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Smoke-тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналу, allowlists plugins, застарілим станом залежностей plugin та наявними файлами workspace/session. Він запускає оновлення пакета плюс неінтерактивний doctor без live provider або ключів каналів, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Smoke-тест виживання після оновлення з опублікованої версії: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цю базову версію за вбудованим рецептом команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні локальні базові версії через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, як-от `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, і розгорнути фікстури у формі issues через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, як-от `reported-issues`; набір reported-issues включає `configured-plugin-installs` для автоматичного ремонту встановлення зовнішніх OpenClaw plugins. Приймання пакета надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, розв’язує метатокени базових версій, як-от `last-stable-4` або `all-since-2026.4.23`, а повна валідація релізу розгортає package gate release-soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Smoke-тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє приховане збереження transcript runtime-контексту плюс ремонт doctor для зачеплених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому домашньому каталозі та перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень, а не зависає. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-тест інсталятора Docker: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між root-, update- і direct-npm-контейнерами. Smoke-тест оновлення за замовчуванням використовує npm `latest` як stable базову версію перед оновленням до кандидатного tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, які належать root, не маскували поведінку user-local install. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення через npm за допомогою `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цієї env, коли потрібне покриття прямого `npm install -g`.
- Smoke-тест CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ кореневого Dockerfile, засіває двох агентів одним workspace в ізольованому домашньому каталозі контейнера, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використайте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із raw CDP, запускає `browser doctor --deep` і перевіряє, що snapshots ролей CDP покривають URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає мокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє schema провайдера й перевіряє, що raw detail з’являється в логах Gateway.
- Міст MCP-каналів (засіяний Gateway + stdio bridge + smoke-тест raw notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP tools пакета OpenClaw (реальний stdio MCP server + smoke-тест allow/deny для вбудованого профілю OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (скрипт: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + демонтаж дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест встановлення/оновлення для локального шляху, `file:`, npm registry з hoisted dependencies, некоректних метаданих npm package, рухомих refs git, кухонної фікстури ClawHub, оновлень marketplace і enable/inspect для Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару package/runtime кухонної фікстури через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстури ClawHub.
- Smoke-тест незміненого оновлення plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест матриці життєвого циклу plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований tarball OpenClaw у голому контейнері, встановлює npm plugin, перемикає enable/disable, оновлює та понижує його через локальний npm registry, видаляє встановлений код, потім перевіряє, що uninstall усе ще видаляє застарілий стан, одночасно логуючи метрики RSS/CPU для кожної фази життєвого циклу.
- Smoke-тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` покриває smoke-тест встановлення/оновлення для локального шляху, `file:`, npm registry з hoisted dependencies, рухомих refs git, фікстур ClawHub, оновлень marketplace і enable/inspect для Claude-bundle. `pnpm test:docker:plugin-update` покриває поведінку незміненого оновлення для встановлених plugins. `pnpm test:docker:plugin-lifecycle-matrix` покриває встановлення npm plugin з відстеженням ресурсів, enable, disable, upgrade, downgrade і uninstall за відсутнього коду.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для окремих наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не локальний. Тести QR та Docker-інсталятора зберігають власні Dockerfiles, бо вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Виконавці Docker для live-моделей також монтують поточний checkout у режимі лише для читання та
розгортають його в тимчасовий workdir всередині контейнера. Це зберігає runtime-образ
компактним, водночас запускаючи Vitest саме на вашому локальному source/config.
Крок розгортання пропускає великі локальні кеші та вихідні файли збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку `.build` або
каталоги виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
справжні worker-и каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` все ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цього Docker lane.
`test:docker:openwebui` — це суміснісний smoke вищого рівня: він запускає
контейнер OpenClaw gateway з увімкненими HTTP-ендпойнтами, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
справжній chat-запит через proxy `/api/chat/completions` Open WebUI.
Задайте `OPENWEBUI_SMOKE_MODE=models` для CI-перевірок release-шляху, які мають зупинятися
після входу в Open WebUI та виявлення моделей, не чекаючи live model
completion.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися завантажити
образ Open WebUI, а Open WebUI може знадобитися завершити власне cold-start налаштування.
Цей lane очікує придатний ключ live-моделі. Надайте його через середовище
процесу, підготовлені auth-профілі або явний `OPENCLAW_PROFILE_FILE`.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує справжнього
облікового запису Telegram, Discord або iMessage. Він завантажує seeded Gateway
container, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, читання transcript-ів, metadata вкладень,
поведінку live event queue, маршрутизацію outbound send і сповіщення каналів у стилі Claude +
дозволи через справжній stdio MCP bridge. Перевірка сповіщень
інспектує raw stdio MCP frames напряму, тож smoke перевіряє те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:agent-bundle-mcp-tools` детермінований і не потребує ключа live
моделі. Він збирає Docker-образ репозиторію, запускає справжній stdio MCP probe server
всередині контейнера, матеріалізує цей server через вбудований OpenClaw bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і одноразовий дочірній turn `sessions_spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke для plain-language thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей script для regression/debug workflows. Він може знову знадобитися для валідації маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтується і source-иться перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, source-нутих із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових config/workspace dirs і без зовнішніх монтувань CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих CLI install-ів всередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються read-only під `/host-auth...`, а потім копіюються до `/home/node/...` перед стартом tests
  - Типові dirs: `.minimax`
  - Типові files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider-запуски монтують лише потрібні dirs/files, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` для повторних запусків, які не потребують rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` для гарантії, що creds надходять зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку gateway показує для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, що використовується Open WebUI smoke
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого тегу образу Open WebUI

## Перевірка коректності docs

Запускайте docs checks після редагування docs: `pnpm check:docs`.
Запускайте повну Mintlify anchor validation, коли також потрібні перевірки in-page heading: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

Це регресії "real pipeline" без справжніх providers:

- Gateway tool calling (mock OpenAI, справжній gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

У нас уже є кілька CI-safe tests, які поводяться як "agent reliability evals":

- Mock tool-calling через справжній gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які перевіряють session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills перелічені в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає agent `SKILL.md` перед використанням і чи виконує required steps/args?
- **Workflow contracts:** multi-turn сценарії, які assert-ять tool order, session history carryover і sandbox boundaries.

Майбутні evals передусім мають залишатися детермінованими:

- Scenario runner з mock providers для assert-ів tool calls + order, читання skill file і session wiring.
- Невеликий набір skill-focused scenarios (use vs avoid, gating, prompt injection).
- Опційні live evals (opt-in, env-gated) лише після появи CI-safe suite.

## Contract tests (форма plugin і channel)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі discovered plugins і запускають suite
assert-ів форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці shared seam і smoke files; запускайте contract commands явно,
коли торкаєтеся спільних channel або provider surfaces.

### Commands

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Contract setup wizard
- **session-binding** - Поведінка session binding
- **outbound-payload** - Структура message payload
- **inbound** - Обробка inbound message
- **actions** - Channel action handlers
- **threading** - Обробка thread ID
- **directory** - Directory/roster API
- **group-policy** - Застосування group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма registry plugin

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Форма/interface Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання або модифікації channel чи provider plugin
- Після refactoring plugin registration або discovery

Contract tests запускаються в CI і не потребують справжніх API keys.

## Додавання regressions (guidance)

Коли ви виправляєте provider/model issue, виявлену в live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або capture точної request-shape transformation)
- Якщо вона за своєю природою лише live-only (rate limits, auth policies), тримайте live test вузьким і opt-in через env vars
- Віддавайте перевагу найменшому layer, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну sampled target для кожного SecretRef class з registry metadata (`listSecretTargetRegistryEntries()`), а потім assert-ить, що traversal-segment exec ids відхиляються.
  - Якщо ви додаєте нову target family SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно падає на unclassified target ids, щоб нові classes не можна було тихо пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
