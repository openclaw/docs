---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори модульних, e2e і live-тестів, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-07-04T04:05:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, для налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документується окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) - архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) - довідник для `pnpm openclaw qa matrix`.
- [Оцінкова картка зрілості](/uk/maturity/scorecard) - як докази release QA підтримують рішення щодо стабільності та LTS.
- [QA-канал](/uk/channels/qa-channel) - синтетичний transport plugin, який використовується сценаріями, підкріпленими репозиторієм.

Ця сторінка охоплює запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ QA-специфічних раннерів нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на просторій машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extensions/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спершу віддавайте перевагу цільовим запускам, коли ітеруєтеся над одним збоєм.
- Docker-підкріплений QA-сайт: `pnpm qa:lab:up`
- QA-lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

## Тимчасові каталоги тестів

Віддавайте перевагу спільним helper-функціям у `test/helpers/temp-dir.ts` для тимчасових каталогів,
що належать тестам. Вони роблять власність явною й утримують очищення в тому самому
життєвому циклі тесту:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` навмисно не відкриває ручний метод очищення; Vitest
володіє очищенням після кожного тесту. Наявні нижчорівневі helper-функції залишаються для тестів, які
ще не перенесено, але нові та мігровані тести мають використовувати tracker
з автоматичним очищенням. Уникайте нового використання ручних `makeTempDir`, `cleanupTempDirs` або
`createTempDirTracker` і уникайте нових голих викликів `fs.mkdtemp*` у тестах,
якщо кейс явно не перевіряє сире поводження temp-dir. Додайте придатний до аудиту
дозвільний коментар із конкретною причиною, коли тест навмисно потребує голого тимчасового
каталогу:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Для видимості міграції `node scripts/report-test-temp-creations.mjs` повідомляє про
нове створення голих temp-dir і нове ручне використання спільних helper-функцій у доданих рядках diff
без блокування наявних стилів очищення. Його область дії на рівні файлів навмисно
дотримується тієї самої класифікації test-path, яку використовує `scripts/changed-lanes.mjs`,
замість підтримання окремої евристики імен файлів test-helper, водночас пропускаючи
саму реалізацію спільного helper. `check:changed` запускає цей звіт для
змінених тестових шляхів як warning-only CI-сигнал; знахідки є warning-анотаціями GitHub,
а не збоями.

Коли налагоджуєте реальних провайдерів/моделі (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти продуктивності runtime: dispatch `OpenClaw Performance` з
  `live_openai_candidate=true` для реального agent turn `openai/gpt-5.5` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.5 lane до
  `openclaw/clawgrit-reports`, коли `CLAWGRIT_REPORTS_TOKEN` налаштовано. Звіт
  mock-provider також включає source-level gateway boot, memory,
  plugin-pressure, repeated fake-model hello-loop і CLI startup numbers.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає текстовий turn плюс невеликий file-read-style probe.
    Моделі, чиї метадані оголошують вхід `image`, також запускають крихітний image turn.
    Вимкніть додаткові probes через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розшардовані за провайдером.
  - Для сфокусованих повторних запусків CI dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і image attachment
    проходять через нативну plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probes. Вимкніть sub-agent probe через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Встановлює запакований OpenClaw tarball у Docker, запускає onboarding з OpenAI API-key
    і перевіряє, що Codex plugin плюс залежність `@openai/codex`
    були завантажені до керованого кореня npm-проєкту на вимогу.
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Пакує fixture plugin з реальною залежністю `slugify`, встановлює його через
    `npm-pack:`, перевіряє залежність під керованим коренем npm-проєкту,
    потім просить live OpenAI model викликати plugin tool і повернути прихований
    slug.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders перевірка поверхні message-channel rescue command.
    Вона виконує `/crestodian status`, ставить у чергу persistent model
    change, відповідає `/crestodian yes` і перевіряє audit/config write path.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback транслюється в audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього OpenClaw state dir, перевіряє сучасний onboard
    Crestodian entrypoint, застосовує setup/model/agent/Discord plugin + SecretRef
    writes, валідує конфігурацію й перевіряє audit entries. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6 і
  assistant transcript зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний кейс, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч із основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab у виділених workflow. Agentic parity вкладено під
`QA-Lab - All Lanes` і release validation, а не в окремий PR workflow.
Широка валідація має використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. Стабільні/default release
checks тримають exhaustive live/Docker soak за `run_release_soak=true`; профіль
`full` примусово вмикає soak. `QA-Lab - All Lanes`
запускається щоночі на `main` і з manual dispatch з mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельними jobs. Scheduled QA і release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і manual workflow input
за замовчуванням залишаються `all`; manual dispatch може шардити `all` у `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими й уникали звичайного startup provider-plugin. Ці live transport
gateways вимикають memory search; поведінка memory залишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім витягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість перебудови
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - Записує артефакти верхнього рівня `qa-evidence.json`, `qa-suite-summary.json` і
    `qa-suite-report.md` для вибраного набору сценаріїв, зокрема
    вибірки змішаних потоків, Vitest і Playwright-сценаріїв.
  - Коли запускається через `pnpm openclaw qa run --qa-profile <profile>`, вбудовує
    scorecard вибраного профілю таксономії в той самий `qa-evidence.json`.
    `smoke-ci` записує скорочені докази, що встановлює `evidenceMode: "slim"` і пропускає
    `execution` для кожного запису. `release` охоплює підібрану частину готовності до релізу;
    `all` вибирає кожну активну категорію зрілості та призначений для явних запусків
    workflow QA Profile Evidence, коли потрібен повний артефакт scorecard.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway workers. `qa-channel` за замовчуванням має паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на основі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`, що враховує сценарії.
- `pnpm openclaw qa coverage --match <query>`
  - Шукає ID сценаріїв, заголовки, surfaces, coverage IDs, docs refs, code refs,
    плагіни й вимоги до провайдера, а потім виводить відповідні suite targets.
  - Використовуйте це перед запуском QA Lab, коли ви знаєте змінювану поведінку або шлях до файлу,
    але не найменший сценарій. Це лише рекомендація; все одно вибирайте mock,
    live, Multipass, Matrix або transport proof на основі поведінки, яку змінюють.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає live-ланцюжок OpenAI Kitchen Sink plugin через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє інвентар surface plugin SDK,
    зондує `/healthz` і `/readyz`, записує докази CPU/RSS Gateway,
    запускає live-хід OpenAI і перевіряє adversarial diagnostics.
    Потребує live-автентифікації OpenAI, наприклад `OPENAI_API_KEY`. У hydrated Testbox
    sessions він автоматично підключає Testbox live-auth profile, коли наявний
    helper `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає startup bench Gateway плюс невеликий пакет mock-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведення комбінованих спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише стійкі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    й не виглядають як хвилинна регресія зациклення Gateway.
  - Використовує зібрані артефакти `dist`; спочатку запустіть build, якщо checkout ще не має
    свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані QA auth, практичні для guest:
    provider keys на основі env, шлях до QA live provider config і `CODEX_HOME`,
    коли він наявний.
  - Output dirs мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding з OpenAI API-key, налаштовує Telegram
    за замовчуванням, перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і запускає один локальний хід агента проти
    mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований built-app Docker smoke для transcripts вбудованого runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    non-display custom message, а не витікає у видимий user turn,
    потім seed-ить уражений broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate-пакет OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через встановлений CLI, потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - Wrapper монтує лише harness source `qa-lab` з checkout; встановлений
    пакет володіє `dist`, `openclaw/plugin-sdk` і bundled plugin
    runtime, щоб lane не змішував plugins поточного checkout із пакетом
    під тестом.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - За замовчуванням виводить повторні RTT timing у `qa-evidence.json` з
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Перевизначте
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` або
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, щоб налаштувати RTT run.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` приймає comma-separated list ID перевірок
    Telegram QA для вибірки; коли не встановлено, стандартною RTT-capable check
    є `telegram-mentioned-message-reply`.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret наявні в CI,
    Docker wrapper автоматично вибирає Convex.
  - Wrapper перевіряє env для Telegram або Convex credentials на хості перед
    Docker build/install роботою. Встановлюйте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише коли навмисно налагоджуєте pre-credential setup.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane. Коли вибрано Convex credentials
    і role не встановлено, wrapper використовує `ci` в CI та
    `maintainer` поза CI.
  - GitHub Actions надає цей lane як manual maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    environment `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler зі smoke, package, product, full або custom
  lane profiles. Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
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

`source=trusted-url` читає `.github/package-trusted-sources.json` з trusted workflow ref і не приймає URL credentials або workflow-input private-network bypass. Якщо названа policy оголошує bearer auth, налаштуйте фіксований secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

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
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування
    config.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перший налаштований doctor repair явно встановлює кожен відсутній downloadable
    plugin, а другий restart не запускає прихований dependency
    repair.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor candidate
    очищує legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke across Parallels guests. Кожна
    вибрана платформа спочатку встановлює запитаний baseline package, потім запускає
    встановлену команду `openclaw update` у тому самому guest і перевіряє
    installed version, update status, gateway readiness і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному guest. Використовуйте `--json` для шляху до summary artifact і
    статусу кожного lane.
  - OpenAI lane за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    OpenAI model.
  - Обгортайте довгі локальні запуски в host timeout, щоб Parallels transport stalls не могли
    використати решту testing window:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script записує nested lane logs у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед тим як припускати, що outer wrapper завис.
  - Windows update може витрачати 10-15 хвилин на post-update doctor і package
    update work на cold guest; це все ще штатно, коли nested npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони спільно використовують стан VM і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайний bundled plugin surface, тому що
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам agent
    turn перевіряє лише просту text response.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише для source-checkout - packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог profiles/scenarios, env vars і структура artifacts: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи з використанням токенів бота driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулові leases.
  - Значення за замовчуванням охоплюють canary, mention gating, command addressing, `/status`, згадані bot-to-bot replies і core native command replies. Значення за замовчуванням `mock-openai` також охоплюють детерміновані регресії reply-chain і Telegram final-message streaming. Використовуйте `--list-scenarios` для необов’язкових probes, як-от `session_status`.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли вам потрібні artifacts без коду виходу, що сигналізує про помилку.
  - Потребує двох окремих ботів в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і `qa-evidence.json` у `.artifacts/qa-e2e/...`. Сценарії з replies включають RTT від запиту надсилання driver до спостереженої SUT reply.

`Mantis Telegram Live` — це PR-evidence wrapper навколо цієї lane. Він запускає candidate ref із Telegram обліковими даними, орендованими через Convex, рендерить редагований QA report/evidence bundle у браузері desktop Crabbox, записує MP4 evidence, генерує motion-trimmed GIF, завантажує artifact bundle і публікує inline PR evidence через Mantis GitHub App, коли задано `pr_number`. Maintainers можуть запустити його з Actions UI через `Mantis Scenario` (`scenario_id:
telegram-live`) або напряму з коментаря до pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — це agentic native Telegram Desktop before/after wrapper для візуального доказу PR. Запустіть його з Actions UI з довільними `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) або з коментаря PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читає PR, вирішує, яка Telegram-visible behavior доводить зміну, запускає real-user Crabbox Telegram Desktop proof lane на baseline і candidate refs, ітерує, доки native GIFs не стануть корисними, записує paired `motionPreview` manifest і публікує ту саму 2-column GIF table через Mantis GitHub App, коли задано `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Орендує або повторно використовує desktop Crabbox Linux, встановлює native Telegram Desktop, налаштовує OpenClaw з орендованим Telegram SUT bot token, запускає Gateway і записує screenshot/MP4 evidence з видимого VNC desktop.
  - За замовчуванням використовує `--credential-source convex`, щоб workflows потребували лише Convex broker secret. Використовуйте `--credential-source env` з тими самими змінними `OPENCLAW_QA_TELEGRAM_*`, що й `pnpm openclaw qa telegram`.
  - Telegram Desktop усе ще потребує user login/profile. Bot token налаштовує лише OpenClaw. Використовуйте `--telegram-profile-archive-env <name>` для base64 `.tgz` profile archive або `--keep-lease` і один раз увійдіть вручну через VNC.
  - Записує `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` і `telegram-desktop-builder.mp4` у output directory.

Live transport lanes мають один спільний стандартний контракт, щоб нові transports не розходилися; матриця покриття per-lane міститься в [огляді QA → покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий synthetic suite і не є частиною цієї матриці.

### Спільні Telegram облікові дані через Convex (v1)

Коли для live transport QA увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab отримує ексклюзивну lease з пулу на базі Convex, надсилає Heartbeat для цієї lease, доки lane виконується, і звільняє lease під час shutdown. Назва розділу з’явилася до підтримки Discord, Slack і WhatsApp; контракт lease спільний для всіх kinds.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один secret для вибраної role:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір credential role:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Maintainer admin commands (pool add/remove/list) потребують саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live runs, щоб перевірити Convex site URL, broker secrets, endpoint prefix, HTTP timeout і доступність admin/list без виведення secret values. Використовуйте `--json` для machine-readable output у scripts і CI utilities.

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

Payload shape для Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком Telegram chat id.
- `admin/add` перевіряє цю shape для `kind: "telegram"` і відхиляє malformed payloads.

Payload shape для Telegram real-user kind:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` і `telegramApiId` мають бути numeric strings.
- `tdlibArchiveSha256` і `desktopTdataArchiveSha256` мають бути SHA-256 hex strings.
- `kind: "telegram-user"` зарезервовано для workflow Mantis Telegram Desktop proof. Generic QA Lab lanes не повинні отримувати його.

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes також можуть орендувати з пулу, але валідація Slack payload наразі живе у Slack QA runner, а не в broker. Використовуйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` для Slack rows.

### Додавання каналу до QA

Назви architecture і scenario-helper для нових channel adapters містяться в [огляді QA → додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у Plugin manifest, змонтувати як `openclaw qa <runner>` і написати scenarios у `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте suites як “зростання реалізму” (і зростання нестабільності/вартості):

### Unit / integration (default)

- Command: `pnpm test`
- Config: untargeted runs використовують набір shards `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для parallel scheduling
- Files: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у dedicated shard `unit-ui`
- Scope:
  - Pure unit tests
  - In-process integration tests (Gateway auth, routing, tooling, parsing, config)
  - Детерміновані regressions для відомих bugs
- Expectations:
  - Запускається в CI
  - Не потребує real keys
  - Має бути fast і stable
  - Resolver і public-surface loader tests мають доводити широке fallback behavior `api.js` і `runtime-api.js` з generated tiny plugin fixtures, а не real bundled plugin source APIs. Real plugin API loads належать до plugin-owned contract/integration suites.

Політика native dependencies:

- Default test installs пропускають optional native Discord opus builds. Discord voice використовує bundled `libopus-wasm`, а `@discordjs/opus` залишається disabled в `allowBuilds`, щоб local tests і Testbox lanes не компілювали native addon.
- Порівнюйте performance native opus у benchmark repo `libopus-wasm`, а не в default OpenClaw install/test loops. Не задавайте `@discordjs/opus` як `true` у default `allowBuilds`; це змушує unrelated install/test loops компілювати native code.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілені запускі `pnpm test` запускають дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного велетенського нативного процесу кореневого проєкту. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати непов’язані набори тестів.
    - `pnpm test --watch` і далі використовує нативний кореневий граф проєкту `vitest.config.ts`, бо цикл спостереження з кількома шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної стартової вартості кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення вихідного коду та локальні залежні елементи графа імпортів. Зміни config/setup/package не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний контрольний етап для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового доказу викличте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версій лише в release metadata запускають цільові перевірки версії/config/root-dependency, із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і сухий запуск live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші зміни package-surface і далі використовують ширші guards.
    - Import-light unit tests з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних областей чистих utility спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані вихідні файли helpers у `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих легких lanes, тож зміни helpers уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має окремі buckets для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім хвостом Node.
    - Звичайний PR/main CI навмисно пропускає пакетний sweep extensions і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані discovery для message-tool або runtime
      context compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії helpers для меж чистої маршрутизації та
      нормалізації.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` і
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише для helpers
      не є достатньою заміною цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Стандартні налаштування пулу Vitest та ізоляції">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live configs.
    - Кореневий UI lane зберігає свій setup `jsdom` і optimizer, але також
      працює на спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі стандартні значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.
    - `scripts/run-vitest.mjs` завершує явні не-watch запуски Vitest після
      5 хвилин без виводу stdout або stderr. Встановіть
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, щоб вимкнути watchdog для
      навмисно тихого дослідження.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли
      до staging і не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен розумний локальний контрольний етап.
    - `pnpm test:changed` за замовчуванням спрямовується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Автомасштабування локальних workers навмисно консервативне і зменшує навантаження,
      коли середнє навантаження host уже високе, тому кілька паралельних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб changed-mode повторні запуски залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування cache для прямого profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими від `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях config як ключ; include-pattern CI
      shards додають назву shard, щоб відфільтровані shards можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшу частину часу на startup imports,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      mock-айте цей шов напряму, замість deep-importing runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` з нативним шляхом root-project для цього закоміченого
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного
      dirty tree, спрямовуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      накладних витрат startup і transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, примусово один worker
- Scope:
  - Запускає реальний loopback Gateway з diagnostics, увімкненими за замовчуванням
  - Проганяє синтетичний churn gateway message, memory і large-payload через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers для persistence diagnostic stability bundle
  - Перевіряє, що recorder залишається bounded, синтетичні RSS samples лишаються нижче pressure budget, а глибини per-session queue повертаються до нуля
- Очікування:
  - Безпечно для CI і не потребує keys
  - Вузький lane для follow-up щодо stability-regression, не заміна повного набору Gateway

### E2E (repo aggregate)

- Команда: `pnpm test:e2e`
- Scope:
  - Запускає gateway smoke E2E lane
  - Запускає mocked Control UI browser E2E lane
- Очікування:
  - Безпечно для CI і не потребує keys
  - Потребує встановленого Playwright Chromium

### E2E (gateway smoke)

- Команда: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E tests під `extensions/`
- Runtime defaults:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, local: 1 за замовчуванням).
  - За замовчуванням запускається в silent mode, щоб зменшити накладні витрати console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати worker count (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути verbose console output.
- Scope:
  - Наскрізна поведінка multi-instance gateway
  - WebSocket/HTTP surfaces, node pairing і важча networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні keys не потрібні
  - Більше moving parts, ніж у unit tests (може бути повільніше)

### E2E (Control UI mocked browser)

- Команда: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Файли: `ui/src/**/*.e2e.test.ts`
- Scope:
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
- Scope:
  - Повторно використовує активний локальний OpenShell gateway
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку remote-canonical filesystem через sandbox fs bridge
- Очікування:
  - Лише opt-in; не частина стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Потребує активного локального OpenShell gateway і його config source
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати не-default CLI binary або wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`, щоб відкрити registered gateway config для ізольованого test
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`, щоб перевизначити Docker gateway IP, який використовує host policy fixture

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і реальні тести вбудованих Plugin під `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - "Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?"
  - Виявляти зміни форматів провайдерів, особливості виклику інструментів, проблеми автентифікації та поведінку лімітів частоти
- Очікування:
  - Навмисно не стабільні для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують ліміти частоти
  - Надавайте перевагу запуску звужених піднаборів замість "усього"
- Реальні запуски використовують уже експортовані ключі API та підготовлені профілі автентифікації.
- За замовчуванням реальні запуски все одно ізолюють `HOME` і копіюють конфігурацію/матеріали автентифікації в тимчасовий тестовий домашній каталог, щоб модульні фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви свідомо хочете, щоб реальні тести використовували ваш реальний домашній каталог.
- `pnpm test:live` за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...` і приглушує журнали запуску Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація ключів API (специфічно для провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи перевизначення для окремого реального запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на ліміти частоти.
- Вивід прогресу/Heartbeat:
  - Реальні набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів були помітно активними навіть тоді, коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway одразу транслювалися під час реальних запусків.
  - Налаштовуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/проб через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни мережевої взаємодії Gateway / протоколу WS / спарювання: додайте `pnpm test:e2e`
- Налагодження "мій бот не працює" / збоїв, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Реальні (мережеві) тести

Для матриці реальних моделей, димових перевірок бекенда CLI, димових перевірок ACP, стенда сервера застосунку Codex і всіх реальних тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення, музика, відео, медіастенд) - а також обробки облікових даних для реальних запусків - дивіться
[Тестування реальних наборів](/uk/help/testing-live). Для спеціального контрольного списку оновлень і перевірки Plugin дивіться
[Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

## Docker-ранери (необов'язкові перевірки "працює в Linux")

Ці Docker-ранери поділяються на дві групи:

- Ранери реальних моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний реальний файл профілю-ключа всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтувавши ваш локальний каталог конфігурації, робочий простір і необов'язковий файл env профілю. Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Реальні Docker-ранери за потреби зберігають власні практичні обмеження:
  `test:docker:live-models` за замовчуванням використовує кураторський підтримуваний набір із високим сигналом, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Встановіть `OPENCLAW_LIVE_MAX_MODELS`
  або env-змінні Gateway, коли явно хочете менше обмеження або ширше сканування.
- `test:docker:all` один раз збирає реальний Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише Node/Git-ранером для шляхів встановлення/оновлення/залежностей Plugin; ці шляхи монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для шляхів функціональності зібраного застосунку. Визначення Docker-шляхів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як ресурсні обмеження не дають важким реальним, npm-install і багатосервісним шляхам стартувати всім одночасно. Якщо один шлях важчий за активні обмеження, планувальник усе ще може запустити його, коли пул порожній, а потім тримає його єдиним активним, доки знову не стане доступна місткість. Значення за замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Ранер за замовчуванням виконує Docker-передперевірку, видаляє застарілі OpenClaw E2E-контейнери, друкує стан кожні 30 секунд, зберігає таймінги успішних шляхів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках першими стартували довші шляхи. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест шляхів без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних шляхів, потреб у пакеті/образі та облікових даних.
- `Приймання пакета` - це GitHub-нативний пакетний шлюз для "чи цей встановлюваний tarball працює як продукт?" Він визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-шляхи проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковані за широтою: `smoke`, `package`, `product` і `full`. Дивіться [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins) щодо контракту пакета/оновлення/Plugin, матриці витривалості для опублікованого оновлення, типових значень релізу та тріажу збоїв.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` і завершується з помилкою, якщо запуск до диспетчеризації команди імпортує залежності пакета, як-от Commander, інтерфейс запитів, undici або логування, до диспетчеризації команди; він також утримує вбудований фрагмент запуску Gateway в межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Димова перевірка упакованого CLI також охоплює кореневу довідку, довідку onboard, довідку doctor, status, схему config і команду списку моделей.
- Застаріла сумісність Приймання пакета обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі стенд допускає лише прогалини метаданих у відвантажених пакетах: пропущені приватні записи інвентаря QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, застарілі розташування install-record Plugin, відсутнє збереження install-record маркетплейсу та міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими збоями.
- Контейнерні димові ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` завантажують один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.
- Docker/Bash E2E-шляхи, які встановлюють упакований tarball OpenClaw через `scripts/lib/openclaw-e2e-instance.sh`, обмежують `npm install` через `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (за замовчуванням `600s`; встановіть `0`, щоб вимкнути обгортку для налагодження).

Docker-ранери реальних моделей також bind-монтують лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Димова перевірка ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі суворим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Димова перевірка бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Димова перевірка стенда сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Димові перевірки спостережуваності: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` і `pnpm qa:observability:smoke` - це приватні QA-шляхи checkout вихідного коду. Вони навмисно не входять до пакетних Docker-шляхів релізу, оскільки npm tarball не містить QA Lab.
- Реальна димова перевірка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Димова перевірка онбордингу/каналу/агента з npm tarball: `pnpm test:docker:npm-onboard-channel-agent` встановлює упакований tarball OpenClaw глобально в Docker, конфігурує OpenAI через онбординг із посиланням на env і за замовчуванням Telegram, запускає doctor і виконує один імітований хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Смоук-тест користувацького шляху релізу: `pnpm test:docker:release-user-journey` глобально встановлює запакований tarball OpenClaw у чистому домашньому каталозі Docker, запускає onboarding, налаштовує імітований провайдер OpenAI, виконує хід агента, встановлює/видаляє зовнішні plugins, налаштовує ClickClack на локальну фікстуру, перевіряє вихідні/вхідні повідомлення, перезапускає Gateway і запускає doctor.
- Смоук-тест типізованого onboarding релізу: `pnpm test:docker:release-typed-onboarding` встановлює запакований tarball, проводить `openclaw onboard` через справжній TTY, налаштовує OpenAI як провайдера з посиланням на env, перевіряє, що сирий ключ не зберігається, і запускає імітований хід агента.
- Смоук-тест медіа/пам’яті релізу: `pnpm test:docker:release-media-memory` встановлює запакований tarball, перевіряє розуміння зображення з PNG-вкладення, вихід генерації зображення, сумісний з OpenAI, пригадування з пошуку пам’яті та збереження пригадування після перезапуску Gateway.
- Смоук-тест користувацького шляху оновлення релізу: `pnpm test:docker:release-upgrade-user-journey` за замовчуванням встановлює найновіший опублікований baseline, старіший за tarball кандидата, налаштовує стан provider/plugin/ClickClack на опублікованому пакеті, оновлює до tarball кандидата, а потім повторно запускає основний шлях agent/plugin/channel. Якщо старішого опублікованого baseline немає, він повторно використовує версію кандидата. Перевизначте baseline за допомогою `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Смоук-тест marketplace Plugin релізу: `pnpm test:docker:release-plugin-marketplace` встановлює з локальної fixture marketplace, оновлює встановлений plugin, видаляє його та перевіряє, що CLI plugin зникає разом з очищеними метаданими встановлення.
- Смоук-тест встановлення Skill: `pnpm test:docker:skill-install` глобально встановлює запакований tarball OpenClaw у Docker, вимикає встановлення завантажених архівів у конфігурації, визначає поточний live slug skill ClawHub із пошуку, встановлює його через `openclaw skills install` і перевіряє встановлений skill разом із метаданими походження/lock `.clawhub`.
- Смоук-тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Смоук-тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх брудної fixture старого користувача з агентами, конфігурацією каналу, allowlists Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він запускає package update плюс неінтерактивний doctor без live provider або ключів каналу, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Смоук-тест виживання після опублікованого оновлення: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, валідовує отриману конфігурацію, оновлює це опубліковане встановлення до tarball кандидата, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, startup, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один baseline за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований scheduler розгорнути точні локальні baselines за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, і розгорніть fixtures у формі issues за допомогою `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного відновлення встановлення зовнішнього Plugin OpenClaw. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, розв’язує meta baseline tokens, наприклад `last-stable-4` або `all-since-2026.4.23`, а Full Release Validation розгортає package gate release-soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Смоук-тест runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime context, а також відновлення doctor для зачеплених дубльованих гілок prompt-rewrite.
- Смоук-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому домашньому каталозі та перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використайте попередньо зібраний tarball за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Смоук-тест Docker installer: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache для своїх root, update і direct-npm containers. Смоук-тест update за замовчуванням використовує npm `latest` як stable baseline перед оновленням до tarball кандидата. Перевизначте локально за допомогою `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки installer без root зберігають ізольований npm cache, щоб записи cache, власником яких є root, не приховували поведінку локального встановлення користувача. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm під час локальних повторних запусків.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm за допомогою `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте script локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Смоук-тест CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає root Dockerfile image, засіває двох агентів з одним workspace в ізольованому домашньому каталозі container, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використайте install-smoke image за допомогою `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два containers, WS auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Смоук-тест snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс Chromium layer, запускає Chromium із raw CDP, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URLs links, cursor-promoted clickables, iframe refs і frame metadata.
- Регресійний тест мінімального reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає імітований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє provider schema і перевіряє, що raw detail з’являється в logs Gateway.
- Міст MCP channel (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- MCP tools bundle OpenClaw (справжній stdio MCP server + вбудований smoke allow/deny профілю OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (справжній Gateway + teardown stdio MCP child після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (смоук-тест install/update для local path, `file:`, npm registry з hoisted dependencies, malformed npm package metadata, git moving refs, ClawHub kitchen-sink, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару package/runtime kitchen-sink за допомогою `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture server ClawHub.
- Смоук-тест незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Смоук-тест матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований tarball OpenClaw у порожній container, встановлює npm plugin, перемикає enable/disable, upgrade і downgrade через локальний npm registry, видаляє встановлений code, потім перевіряє, що uninstall все ще видаляє stale state, записуючи RSS/CPU metrics для кожної фази lifecycle.
- Смоук-тест metadata reload config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює смоук-тест install/update для local path, `file:`, npm registry з hoisted dependencies, git moving refs, fixtures ClawHub, marketplace updates і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` охоплює поведінку unchanged update для встановлених plugins. `pnpm test:docker:plugin-lifecycle-matrix` охоплює відстежувані за ресурсами install, enable, disable, upgrade, downgrade і missing-code uninstall npm plugin.

Щоб вручну попередньо зібрати й повторно використовувати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image, специфічні для suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений shared image, scripts завантажують його, якщо він ще не є локальним. QR і installer Docker tests зберігають власні Dockerfiles, бо вони валідовують поведінку package/install, а не спільний runtime зібраної app.

Запускачі Docker для live-моделей також монтують поточний checkout у режимі лише для читання та
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime-образ
компактним, водночас запускаючи Vitest саме на ваших локальних source/config.
Етап розгортання пропускає великі локальні кеші та вихідні файли збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку каталоги `.build` або
вихідні каталоги Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки Gateway не запускали
реальних працівників каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` все ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття Gateway
з цієї Docker-смуги.
`test:docker:openwebui` — це суміснісний smoke-тест вищого рівня: він запускає
контейнер OpenClaw Gateway з увімкненими HTTP-ендпоїнтами, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Задайте `OPENWEBUI_SMOKE_MODE=models` для CI-перевірок release-шляху, які мають зупинятися
після входу в Open WebUI та виявлення моделі, не очікуючи завершення live-моделі.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантажити
образ Open WebUI, а Open WebUI може потребувати завершити власне налаштування cold-start.
Ця смуга очікує придатний ключ live-моделі. Надайте його через середовище процесу,
підготовлені auth-профілі або явний `OPENCLAW_PROFILE_FILE`.
Успішні запуски друкують невелике JSON-навантаження на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення розмов, читання transcript, метадані attachment,
поведінку live-черги подій, маршрутизацію outbound send, а також channel +
permission notifications у стилі Claude через реальний stdio MCP bridge. Перевірка notifications
безпосередньо інспектує сирі stdio MCP frames, тож smoke перевіряє те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:agent-bundle-mcp-tools` детермінований і не потребує live
ключа моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований OpenClaw bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway із реальним stdio MCP probe server, виконує
ізольований cron turn і одноразовий дочірній turn `sessions_spawn`, а потім перевіряє,
що дочірній MCP-процес завершується після кожного запуску.

Ручний ACP smoke-тест thread простою мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для regression/debug workflows. Він може знову знадобитися для перевірки ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтується й підвантажується перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, підвантажених із `OPENCLAW_PROFILE_FILE`, з тимчасовими config/workspace dirs і без зовнішніх CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих CLI installs усередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком tests
  - Default dirs: `.minimax`
  - Default files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider runs монтують лише потрібні dirs/files, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` у повторних запусках, які не потребують rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` для гарантії, що creds надходять зі сховища profiles (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку Gateway показує для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, який використовує Open WebUI smoke
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого Open WebUI image tag

## Санітарна перевірка документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну перевірку anchors Mintlify, коли також потрібні перевірки heading усередині сторінки: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

Це регресії "real pipeline" без реальних providers:

- Gateway tool calling (mock OpenAI, реальний gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, пише config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

У нас уже є кілька CI-safe tests, які поводяться як "agent reliability evals":

- Mock tool-calling через реальний gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які перевіряють session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли skills перелічені в prompt, чи agent обирає правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи agent читає `SKILL.md` перед використанням і виконує required steps/args?
- **Workflow contracts:** multi-turn scenarios, які перевіряють tool order, session history carryover і sandbox boundaries.

Майбутні evals мають насамперед залишатися детермінованими:

- Scenario runner з mock providers для перевірки tool calls + order, читання skill files і session wiring.
- Невеликий suite сценаріїв, сфокусованих на skills (use vs avoid, gating, prompt injection).
- Необов’язкові live evals (opt-in, env-gated) лише після появи CI-safe suite.

## Contract tests (plugin and channel shape)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі виявлені plugins і запускають suite
shape and behavior assertions. Стандартна unit-смуга `pnpm test` навмисно
пропускає ці спільні seam and smoke files; запускайте contract commands явно,
коли торкаєтеся shared channel або provider surfaces.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - базова shape plugin (id, name, capabilities)
- **setup** - contract setup wizard
- **session-binding** - поведінка session binding
- **outbound-payload** - структура message payload
- **inbound** - обробка inbound message
- **actions** - Channel action handlers
- **threading** - обробка Thread ID
- **directory** - Directory/roster API
- **group-policy** - застосування group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - shape plugin registry

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - contract auth flow
- **auth-choice** - auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання або модифікації channel чи provider plugin
- Після refactoring plugin registration або discovery

Contract tests запускаються в CI і не потребують реальних API keys.

## Додавання regressions (guidance)

Коли ви виправляєте provider/model issue, виявлену live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або зафіксуйте точне request-shape transformation)
- Якщо це inherently live-only (rate limits, auth policies), залиште live test вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один sampled target на клас SecretRef із registry metadata (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec ids відхиляються.
  - Якщо ви додаєте нову `includeInPlan` SecretRef target family у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно падає на unclassified target ids, щоб нові classes не могли бути мовчки пропущені.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
