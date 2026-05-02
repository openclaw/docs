---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти області дії, парасольки релізів і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-02T17:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ad5c8b39c21bf3fe6124c64938768efe4b77ef640e8207ef672a80c10291137
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає витратні лінії, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження області й розгортають повний граф для кандидатів на випуск і широкої валідації. Лінії Android залишаються опціональними через `include_android`. Покриття Plugin лише для випусків міститься в окремому workflow [`Попередній випуск Plugin`](#plugin-prerelease) і запускається лише з [`Повної валідації випуску`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                      | Коли запускається                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і створює CI-маніфест                    | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                       | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                                    | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язкова агрегація для швидких завдань безпеки                                                                | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production-перевірка Knip лише для залежностей плюс guard allowlist невикористаних файлів                       | Зміни, релевантні для Node         |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream-артефакти                 | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі лінії коректності Linux, як-от bundled/plugin-contract/protocol перевірки                                | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                            | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Shard-и core Node тестів, окрім ліній channel, bundled, contract і extension                                     | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: production-типи, lint, guards, test-типи та strict smoke          | Зміни, релевантні для Node         |
| `check-additional`               | Shard-и архітектури, меж, guards поверхні extension, package-boundary і gateway-watch                           | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke запуску з пам’яттю                                                             | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для channel-тестів зібраних артефактів                                                               | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збирання сумісності Node 22 і smoke                                                                        | Ручний CI dispatch для випусків    |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                       | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для skills на базі Python                                                                          | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс regressions спільних runtime import specifier                 | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія macOS TypeScript тестів із використанням спільних зібраних артефактів                                      | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збирання і тести для macOS app                                                                       | Зміни, релевантні для macOS        |
| `android`                        | Android unit-тести для обох flavors плюс одне збирання debug APK                                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                            | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/на вимогу звіти продуктивності runtime Kova з mock-provider, deep-profile і live-лініями GPT 5.4        | Запланований і ручний dispatch     |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream consumers могли стартувати щойно спільне збирання буде готове.
4. Важчі лінії платформ і runtime розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє до того самого PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shard-ів використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже замінено. Автоматичний ключ конкурентності CI версійований (`CI-v7-*`), тому zombie на стороні GitHub у старій queue group не може нескінченно блокувати новіші main-запуски. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає виявлення changed-scope і змушує preflight-маніфест поводитися так, ніби змінилася кожна scoped-ділянка.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі собою не примушують запускати Windows, Android або macOS native builds; ці платформні лінії залишаються обмеженими змінами platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only шлях маніфесту: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання перевіряє напряму.
- **Windows Node checks** обмежені специфічними для Windows wrappers процесів/шляхів, npm/pnpm/UI runner helpers, package manager config і поверхнями CI workflow, що виконують цю лінію; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node lanes.

Найповільніші сімейства Node тестів розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднано попарно, auto-reply запускається як чотири збалансовані workers (із розбиттям reply subtree на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої виділені Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із CI shard name, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий config від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards конкурентно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із BuildConfig flags для SMS/call-log, водночас уникаючи дубльованого debug APK packaging job під час кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-перевірку Knip лише для залежностей, pinned до найновішої версії Knip, з вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Guard невикористаних файлів падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist, зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може розв’язати статично.

## Передавання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — це target-side міст від активності репозиторію OpenClaw до ClawSweeper. Він не checkout-ить і не виконує недовірений код pull request. Workflow створює token GitHub App із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає compact payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів на review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для commit-level review requests на push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може інспектувати.

Лінія `github_activity` передає лише нормалізовані метадані: event type, action, actor, repository, item number, URL, title, state і короткі уривки для comments або reviews, коли вони присутні. Вона навмисно уникає передавання повного webhook body. Receiving workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану подію до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не доставленням за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія є несподіваною, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають давати результат `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages недовіреними даними на всьому цьому шляху. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android scoped lane: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і i18n Control UI. Окремі ручні запуски CI виконують лише Android із `include_android=true`; повна релізна парасолька вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin, релізний лише шард `agentic-plugins`, повний пакетний sweep розширень і Docker lanes передрелізу Plugin виключено з CI. Передрелізний набір Docker запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate перевірки релізу.

Ручні запуски використовують унікальну concurrency group, тому повний набір release-candidate не скасовується іншим push або запуском PR на тому самому ref. Необов'язковий ввід `target_ref` дає довіреному викликачеві змогу запускати цей граф для гілки, тега або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколів/контрактів/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, перевіряльники агрегатів тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо CPU-чутливий, що 8 vCPU коштували більше, ніж заощаджували); Docker builds install-smoke (час черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

## Локальні еквіваленти

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Продуктивність OpenClaw

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він щодня запускається на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із закріпленого релізу та Kova із закріпленого вводу `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фіктивною OpenAI-сумісною автентифікацією.
- `mock-deep-profile`: CPU/heap/trace профілювання для гарячих точок startup, gateway і agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає нативні source probes OpenClaw після проходу Kova: час запуску Gateway і пам'ять у випадках default, hook і запуску з 50-plugin; повторювані цикли hello mock-OpenAI `channel-chat-baseline`; і команди запуску CLI проти запущеного Gateway. Markdown-зведення source probe міститься в `source/index.md` у report bundle, поруч із сирим JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і artifacts source-probe в `openclaw/clawgrit-reports` під `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий workflow для "запустити все перед релізом". Він приймає гілку, тег або повний commit SHA, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного лише proof plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, parity QA Lab, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму package lane Telegram проти опублікованого npm package.

Див. [повну перевірку релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, artifacts і
цільових дескрипторів повторного запуску.

`OpenClaw Release Publish` — це ручний мутувальний релізний workflow. Запускайте його
з `release/YYYY.M.D` або `main` після того, як існує release tag, і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публіковних plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для pinned commit proof на швидкозмінній гілці використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Dispatch refs workflow GitHub мають бути гілками або тегами, а не сирими commit SHA.
Helper пушить тимчасову гілку `release-ci/<sha>-...` на target SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що `headSha` кожного дочірнього
workflow збігається з target, і видаляє тимчасову гілку, коли
run завершується. Парасольковий verifier також завершується з помилкою, якщо будь-який дочірній workflow виконувався на
іншому SHA.

`release_profile` керує шириною live/provider, переданою в release checks. Ручні
релізні workflows типово використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку advisory provider/media matrix.

- `minimum` залишає найшвидші критичні для релізу lanes OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory provider/media matrix.

Парасолька записує IDs запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow повторно запущено і він став green, повторно запустіть лише батьківське verifier job, щоб оновити результат парасольки й зведення timings.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного дочірнього релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує повторний запуск невдалого release box у межах після цільового виправлення.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до live/E2E Docker workflow release path, і до package acceptance shard. Це зберігає package bytes узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх jobs.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Parent monitor скасовує будь-який дочірній workflow,
який він уже dispatch, коли parent скасовано, тож новіша валідація main
не чекає позаду застарілого двогодинного запуску release-check. Валідація release branch/tag
і цільові rerun groups зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered jobs `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені media audio/video shards і provider-filtered music shards

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Native live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий shared image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live release workflow один раз збирає й публікує цей image, а потім Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні script-level обмеження `timeout` нижче за timeout workflow job, щоб завислий container або cleanup path швидко падав, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повний source Docker target, release run налаштовано неправильно, і він марнуватиме wall clock на дубльовані image builds.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей installable package OpenClaw як продукт?» Він відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі виконують після install або update.

### Jobs

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного package candidate, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як artifact `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей artifact, перевіряє tarball inventory, готує package-digest Docker images за потреби та запускає вибрані Docker lanes проти цього package замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow один раз готує package і shared images, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий artifact `package-under-test`, коли Package Acceptance розв’язав package; окремий Telegram dispatch усе ще може встановити опублікований npm spec.
4. `summary` завершує workflow з помилкою, якщо package resolution, Docker acceptance або опційний Telegram lane завершився невдало.

### Candidate sources

- `source=npm` приймає лише `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованого prerelease/stable.
- `source=ref` пакує trusted branch, tag або повний commit SHA з `package_ref`. Resolver fetch OpenClaw branches/tags, перевіряє, що вибраний commit reachable з repository branch history або release tag, встановлює deps у detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його слід надати для externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted workflow/harness code, який запускає test. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші trusted source commits без запуску старої workflow logic.

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker release-path chunks з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Profile `package` використовує offline plugin coverage, щоб валідація published-package не залежала від live доступності ClawHub. Опційний Telegram lane повторно використовує artifact `package-under-test` у `NPM Telegram Beta E2E`, а шлях published npm spec збережено для окремих dispatches.

Щодо спеціальної політики update і plugin testing, включно з локальними commands,
Docker lanes, inputs Package Acceptance, release defaults і failure triage,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим release package artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає package migration, update, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update і Telegram proof на тому самому розв’язаному package tarball. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один published package baseline за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є candidate, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, типово `openclaw@latest`; команди failed-lane rerun зберігають цей baseline. Встановіть `published_upgrade_survivor_baselines=release-history`, щоб розширити lane на deduped history matrix: останні шість stable releases, `2026.4.23` і останній stable release перед `2026-03-15`. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для Feishu config, збережених bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths і stale legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному published update cleanup, а не у звичайній широті Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати один lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою вбудованого command recipe `openclaw config set`, записує recipe steps у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений package може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4`, тож install і gateway proof залишаються на test model GPT-5, уникаючи GPT-4.x defaults.

### Legacy compatibility windows

Package Acceptance має обмежені legacy-compatibility windows для вже опублікованих packages. Packages до `2026.4.25` включно, включно з `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, omit у tarball;
- `doctor-switch` може пропустити subcase persistence `gateway install --wrapper`, коли package не expose цей flag;
- `update-channel-switch` може prune відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може log відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутній marketplace install-record persistence;
- `plugin-update` може дозволяти config metadata migration, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований package `2026.4.26` також може попереджати про local build metadata stamp files, які вже були shipped. Пізніші packages мають відповідати сучасним contracts; ті самі умови fail замість warn або skip.

### Приклади

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної release validation.

## Інсталяційний smoke-тест

Окремий workflow `Install Smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які зачіпають Docker/package surfaces, зміни пакета/маніфесту вбудованого Plugin або surfaces ядра plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді вбудованого Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення та запускає обмежений Docker-профіль вбудованого Plugin із сукупним timeout команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull request, які справді зачіпають installer/package/Docker surfaces. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий Docker E2E для вбудованого Plugin як окремі завдання, щоб installer-робота не чекала за root image smokes.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли changed-scope logic запитала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічного запуску або release validation.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch для `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` цього не роблять. QR і installer Docker tests зберігають власні Dockerfiles, сфокусовані на інсталяції.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                       |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10              | Кількість слотів основного пулу для звичайних lanes.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Кількість слотів tail-пулу, чутливого до провайдерів.                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9               | Ліміт одночасних live lanes, щоб провайдери не застосовували throttling.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10              | Ліміт одночасних npm install lanes.                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7               | Ліміт одночасних multi-service lanes.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Затримка між стартами lanes, щоб уникати сплесків створення в Docker daemon; установіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000         | Резервний timeout для кожної lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset           | `1` друкує план scheduler без запуску lanes.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset           | Точний список lanes, розділений комами; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить capacity. Локальні сукупні preflights перевіряють Docker, видаляють застарілі OpenClaw E2E containers, виводять статус активних lanes, зберігають таймінги lanes для впорядкування longest-first і за замовчуванням припиняють планування нових pooled lanes після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact із `package_artifact_run_id`; перевіряє tarball inventory; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Pull Docker images повторюється з обмеженим 180-секундним timeout на спробу, щоб завислий registry/cache stream швидко повторювався замість споживання більшої частини критичного шляху CI.

### Chunks release path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk підтягував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними псевдонімами plugin/runtime. Псевдонім lane `install-e2e` залишається сукупним ручним rerun alias для обох provider installer lanes.

OpenWebUI включається в `plugins-runtime-services`, коли повне покриття release-path цього вимагає, і зберігає окремий chunk `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Bundled-channel update lanes повторюються один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` із журналами lanes, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану scheduler, таблицями slow-lane і командами rerun для кожної lane. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує налагодження failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані GitHub rerun commands для кожної lane включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точний package і images з failed run.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти та надрукувати combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # summaries slow-lane і phase critical-path
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і окремі ручні CI dispatch не вмикають цей suite. Він балансує тести вбудованого Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у невеликі групи, щоб не резервувати десятки runners для одно-трихвилинних завдань.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і ручному dispatch; він збирає private QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгалужує mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, тому що QA parity окремо покриває memory behavior; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. CLI default і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна насправді не зачіпає QA runtime, model-pack parity або surface, яким володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test вважайте це додатковим сигналом і покладайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep усього repository. Щоденні, ручні та non-draft pull request guard runs сканують Actions workflow code плюс найризикованіші JavaScript/TypeScript surfaces з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять у PR defaults.

### Категорії безпеки

| Категорія                                       | Поверхня                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базовий рівень автентифікації, секретів, пісочниці, cron і gateway                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс середовище виконання канального plugin, gateway, Plugin SDK, секрети, точки аудиту       |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політики SSRF для core SSRF, розбору IP, мережевого захисту, web-fetch і Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агента                          |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, завантажувача, маніфесту, реєстру, встановлення менеджером пакетів, завантаження джерел і контракту пакета Plugin SDK |

### Специфічні для платформ security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Вручну збирає Android-застосунок для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із вивантаженого SARIF і вивантажує в `/codeql-critical-security/macos`. Залишено поза щоденними стандартними запусканнями, бо збірка macOS домінує за часом виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний несек'юріті shard. Він запускає лише запити якості JavaScript/TypeScript із severity error і без security над вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Його запобіжник для pull request навмисно менший за запланований профіль: не-draft PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та диспетчеризації відповідей, коді схем/міграцій/IO конфігурації, коді auth/secrets/sandbox/security, основному каналі та середовищі виконання вбудованого канального plugin, протоколі Gateway/методі сервера, склейці memory runtime/SDK, MCP/process/outbound delivery, середовищі виконання провайдера/каталозі моделей, діагностиці сесій/чергах доставки, завантажувачі plugin, Plugin SDK/контракті пакета або середовищі виконання відповідей Plugin SDK. Зміни конфігурації CodeQL і quality workflow запускають усі дванадцять PR quality shards.

Ручний запуск приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це хуки для навчання/ітерацій, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код security boundary для автентифікації, секретів, пісочниці, cron і gateway                                                                                     |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти основного каналу та реалізації вбудованого канального plugin                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Контракти виконання команд, диспетчеризації model/provider, диспетчеризації й черг auto-reply та середовища виконання ACP control-plane                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасади memory runtime, псевдоніми memory Plugin SDK, склейка активації memory runtime і команди memory doctor                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні частини черги відповідей, черги доставки сесій, допоміжні засоби прив'язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime для відповідей, параметри відповіді каналу, черги доставки та допоміжні засоби прив'язування session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдера, реєстрація середовища виконання провайдера, defaults/catalogs провайдера та реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Завантаження Control UI, локальна персистентність, потоки керування gateway і runtime-контракти task control-plane                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти core web fetch/search, media IO, media understanding, image-generation і media-generation runtime                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точки входу Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side вихідний код Plugin SDK і допоміжні засоби контракту пакета plugin                                                                     |

Quality залишається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затінення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільні runtime і signal.

## Робочі процеси обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована maintenance lane Codex для підтримання наявної документації узгодженою з нещодавно злитими змінами. Вона не має чистого розкладу: успішний non-bot push CI run на `main` може її запустити, а manual dispatch може запустити її напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли вона запускається, то переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу docs.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована maintenance lane Codex для повільних тестів. Вона не має чистого розкладу: успішний non-bot push CI run на `main` може її запустити, але вона пропускається, якщо інший workflow-run invocation уже запускався або виконується в цей UTC-день. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline test count, який проходить. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається вперед до того, як bot push потрапить у репозиторій, lane робить rebase перевіреного patch, повторно запускає `pnpm check:changed` і повторює push; stale patches із конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action могла зберігати ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після злиття

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land очищення дублікатів. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злитий і що кожен duplicate має або спільну referenced issue, або перекривні changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий CI platform scope:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- release metadata-only version bumps запускають цільові version/config/root-dependency checks;
- невідомі root/config changes fail safe до всіх check lanes.

Local changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі test edits запускають самі себе, source edits надають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change зазнала failure до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня репозиторію та надавайте перевагу свіжому warmed box для broad proof. Перед тим як витрачати повільний gate на box, який reused, expired або щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` усередині box.

Sanity check швидко завершується failure, коли required root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і warmed fresh one замість налагодження product test failure. Для intentional large-deletion PR встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних змін.

Crabbox — це другий належний репозиторію шлях до віддаленого бокса для перевірки в Linux, коли Blacksmith недоступний або коли бажано використати власну хмарну потужність. Підігрійте бокс, гідратуйте його через workflow проєкту, а потім виконуйте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає типові параметри провайдера, синхронізації та гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних для мейнтейнера remotes і сховищ об’єктів, а також виключає локальні runtime/build артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища, яке згодом використовують команди `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
