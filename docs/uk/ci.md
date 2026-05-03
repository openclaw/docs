---
read_when:
    - Вам потрібно з’ясувати, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується помилкою
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, контрольні перевірки за областю дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-03T12:48:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5773c2ba8032ae4e35a5e0c80a9bf1d8365bb616a5156b89670b787eaff7130
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі напрями, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області й розгортають повний граф для release candidates і широкої валідації. Напрями Android залишаються opt-in через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                         | Коли запускається                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені extensions і будує CI manifest                                  | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                          | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                                         | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                                                   | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для невикористаних файлів                                 | Зміни, релевантні Node             |
| `build-artifacts`                | Побудова `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts              | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от перевірки bundled/plugin-contract/protocol                                  | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                                             | Зміни, релевантні Node             |
| `checks-node-core-test`          | Core Node test shards, без напрямів channel, bundled, contract і extension                                          | Зміни, релевантні Node             |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke                   | Зміни, релевантні Node             |
| `check-additional`               | Architecture, boundary, prompt snapshot drift, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні Node             |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                                        | Зміни, релевантні Node             |
| `checks`                         | Verifier для built-artifact channel tests                                                                           | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Напрям сумісності Node 22: build і smoke                                                                            | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken-link                                                                     | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                                              | Зміни, релевантні Python-skill     |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions                                | Зміни, релевантні Windows          |
| `macos-node`                     | Напрям TypeScript tests для macOS із використанням спільних built artifacts                                         | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                                      | Зміни, релевантні macOS            |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                                       | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                                                   | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/on-demand звіти Kova runtime performance з напрямами mock-provider, deep-profile і GPT 5.4 live             | Запланований і ручний dispatch     |

## Порядок fail-fast

1. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються помилкою, не чекаючи важчих jobs матриці artifacts і platform.
3. `build-artifacts` перекривається зі швидкими Linux-напрямами, щоб downstream consumers могли стартувати, щойно спільний build буде готовий.
4. Важчі напрями platform і runtime розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють нормальні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено. Automatic CI concurrency key має версію (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може безстроково блокувати новіші runs main. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують запускати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і єдине завдання `checks-fast-core`. Цей шлях пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей напрям; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділено або збалансовано, щоб кожне завдання залишалося невеликим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes попарно об’єднані, auto-reply запускається як чотири збалансовані workers (з reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої невеликі independent guards паралельно в одному job, включно з `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже побудовані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім будує Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з прапорцями SMS/call-log BuildConfig, водночас уникаючи дублювання debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, з вимкненим minimum release age pnpm для інсталяції `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може resolve статично.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — це target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує untrusted pull request code. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch компактні `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири напрями:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних команд ClawSweeper у issue comments;
- `clawsweeper_commit_review` для commit-level review requests на push до `main`;
- `github_activity` для загальної GitHub activity, яку agent ClawSweeper може inspect.

Напрям `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони є. Він навмисно уникає пересилання повного webhook body. Receiving workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує normalized event до OpenClaw Gateway hook для agent ClawSweeper.

General activity — це observation, а не delivery-by-default. Agent ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія є surprising, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Розглядайте GitHub titles, comments, bodies, review text, branch names і commit messages як untrusted data на всьому цьому шляху. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android lane у межах області: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android з `include_android=true`; повна release-парасолька вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для Plugin, release-only shard `agentic-plugins`, повний пакетний sweep розширень і Docker lanes prerelease для Plugin виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, щоб повний suite release-candidate не скасовувався іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу довіреному виклику запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і агрегати, Node test aggregate verifiers, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші shards розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Локальні відповідники

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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він запускається щодня на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай бенчмаркить workflow ref. Установіть `target_ref`, щоб бенчмаркити release tag або іншу branch з поточною реалізацією workflow. Опубліковані report paths і latest pointers ключуються tested ref, а кожен `index.md` записує tested ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти local-build runtime з deterministic fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для hotspots startup, gateway і agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає native для OpenClaw source probes після проходу Kova: gateway boot timing і memory для default, hook і 50-plugin startup cases; repeated mock-OpenAI `channel-chat-baseline` hello loops; і CLI startup commands проти запущеного gateway. Markdown summary source probe розташований у `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts до `openclaw/clawgrit-reports` у `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний pointer tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація release

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед release». Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` з цією target, запускає `Plugin Prerelease` для release-only plugin/package/static/Docker proof і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повна валідація release](/uk/reference/full-release-validation) для
stage matrix, точних workflow job names, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після створення release tag і після успішного
OpenClaw npm preflight. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA і лише тоді запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для pinned commit proof на fast-moving branch використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs. Цей
helper пушить тимчасову branch `release-ci/<sha>-...` на target SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з target, і видаляє тимчасову branch після
завершення run. Umbrella verifier також падає, якщо будь-який child workflow запускався на
іншому SHA.

`release_profile` керує шириною live/provider, що передається до перевірок релізу. Ручні релізні workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку матрицю advisory provider/media.

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку матрицю advisory provider/media.

Umbrella записує ідентифікатори запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат umbrella і підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата в реліз, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного релізного дочірнього прогону або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це обмежує перезапуск невдалого релізного box після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до live/E2E Docker workflow релізного шляху, і до package acceptance shard. Це зберігає однакові байти пакета між релізними box і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати прогонів `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Батьківський monitor скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський прогін скасовано, тож новіша валідація main
не стоїть за застарілим двогодинним прогоном release-check. Валідація релізних branch/tag
і сфокусовані групи перезапуску зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній релізний live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs`, а не як одне послідовне завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- завдання `native-live-src-gateway-profiles`, відфільтровані за provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені media shards для audio/video і music shards, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск і діагностику повільних live-збоїв provider. Агреговані імена shard `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються дійсними для ручних одноразових перезапусків.

Нативні live media shards виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, створеному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед setup. Тримайте live-набори з Docker на звичайних Blacksmith runners — container jobs не підходять для запуску вкладених Docker tests.

Live model/backend shards на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live release workflow один раз збирає й публікує цей образ, після чого Docker live model, provider-sharded Gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні script-level обмеження `timeout`, нижчі за timeout завдання workflow, щоб завислий container або шлях cleanup швидко падав, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повний source Docker target, релізний прогін налаштовано неправильно, і він марнуватиме wall clock на дублікати image builds.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Завдання

1. `resolve_package` робить checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє inventory tarball, за потреби готує Docker images package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow один раз готує package і shared images, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав його; standalone Telegram dispatch усе ще може встановлювати опублікований npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або optional Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованого prerelease/stable.
- `source=ref` пакує довірені branch, tag або повний commit SHA з `package_ref`. Resolver fetches OpenClaw branches/tags, перевіряє, що вибраний commit досяжний з історії branch репозиторію або release tag, встановлює deps у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає поточному test harness змогу перевіряти старіші довірені source commits без запуску старої workflow logic.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Profile `package` використовує offline-покриття plugin, щоб валідація опублікованого пакета не залежала від live-доступності ClawHub. Optional Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованого npm spec зберігається для standalone dispatches.

Для спеціальної політики тестування updates і plugins, включно з local commands,
Docker lanes, inputs Package Acceptance, release defaults і failure triage,
див. [Testing updates and plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає proof для package migration, update, cleanup stale-plugin-dependency, repair встановлення configured-plugin, offline plugin, plugin-update і Telegram на тому самому розв’язаному package tarball. Встановіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму matrix проти shipped npm package замість артефакта, зібраного за SHA. Cross-OS release checks і далі покривають OS-specific onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один опублікований package baseline за прогін. У Package Acceptance розв’язаний tarball `package-under-test` завжди є candidate, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди перезапуску failed-lane зберігають цей baseline. Встановіть `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен stable npm release від `2026.4.23` до `latest`; `release-history` залишається доступним для ручного ширшого sampling зі старішим pre-date anchor. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для Feishu config, збережених bootstrap/persona files, встановлень configured OpenClaw plugin, tilde log paths і stale legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає в exhaustive published update cleanup, а не у звичайній ширині Full Release CI. Local aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою baked recipe команди `openclaw config set`, записує recipe steps у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після запуску Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений package може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4`, тож install і gateway proof залишаються на тестовій моделі GPT-5, уникаючи defaults GPT-4.x.

### Вікна legacy compatibility

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені tarball;
- `doctor-switch` може пропускати subcase persistence `gateway install --wrapper`, коли package не expose цей flag;
- `update-channel-switch` може prune відсутні `pnpm.patchedDependencies` із fake git fixture, derived from tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти config metadata migration, водночас і далі вимагаючи, щоб install record і no-reinstall behavior лишалися unchanged.

Опублікований package `2026.4.26` також може попереджати про local build metadata stamp files, які вже були shipped. Пізніші packages мають відповідати modern contracts; ті самі conditions fail замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної валідації релізу.

## Димова перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє димове покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/пакетів, змін пакета/маніфесту вбудованого Plugin або поверхонь core Plugin/каналу/Gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді вбудованого Plugin, редагування лише тестів і редагування лише документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого extension і запускає обмежений Docker-профіль вбудованого Plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR-пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, release-перевірок через workflow-call і pull request, які справді торкаються поверхонь інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR smoke-образ кореневого Dockerfile, а потім запускає встановлення QR-пакета, root Dockerfile/Gateway smokes, installer/update smokes і швидкий Docker E2E вбудованого Plugin як окремі завдання, щоб робота інсталятора не чекала за root image smokes.

Пуші в `main` (включно з merge commit) не примушують повний шлях; коли логіка changed-scope запитувала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release validation.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` - ні. Docker-тести QR та інсталятора зберігають власні Dockerfile, сфокусовані на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типово  | Призначення                                                                                   |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live-ліній, щоб провайдери не обмежували швидкість.                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних ліній встановлення npm.                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних багатосервісних ліній.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникати сплесків створення в Docker daemon; встановіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail-лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску ліній.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить місткість. Локальні сукупні preflight перевіряють Docker, видаляють застарілі OpenClaw E2E-контейнери, виводять статус активних ліній, зберігають таймінги ліній для впорядкування longest-first і типово припиняють планування нових pooled-ліній після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, який пакет, вид образу, live-образ, лінія та покриття облікових даних потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та пушить package-digest-tagged bare/functional GHCR Docker E2E образи через кеш Docker-шарів Blacksmith, коли план потребує ліній із установленим пакетом; і повторно використовує надані input `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Pull Docker-образів повторюється з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторювався замість споживання більшої частини критичного шляху CI.

### Фрагменти release-path

Release Docker-покриття запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний йому вид образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime alias. Alias лінії `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI входить до `plugins-runtime-services`, коли повне release-path-покриття запитує його, і зберігає окремий chunk `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Bundled-channel update lanes повторюють спробу один раз для тимчасових мережевих збоїв npm.

Кожен chunk вивантажує `.artifacts/docker-tests/` із журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує налагодження невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker lane, цільове завдання локально збирає live-test image для цього rerun. Згенеровані для кожної лінії GitHub rerun-команди містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, тож невдала лінія може повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим product/package-покриттям, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і окремі ручні CI dispatch не вмикають цей suite. Він балансує тести вбудованих Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у малі групи, щоб не резервувати десятки runners для завдань тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладено в широкі QA та release harnesses, а не в окремий PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну через dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного запуску provider-plugin. Live transport gateway вимикає memory search, оскільки QA parity окремо покриває memory behavior; provider connectivity покривають окремі live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI підтримує це. CLI default і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для остаточного parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов'язковим status.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та guard-запуски для нечернеткових pull request сканують код Actions workflow, а також поверхні JavaScript/TypeScript із найвищим ризиком за допомогою security queries з високою достовірністю, відфільтрованих до high/critical `security-severity`.

Guard для pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму матрицю безпеки з високою достовірністю, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`        | Auth, secrets, sandbox, cron і базовий рівень gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary` | Контракти реалізації основних каналів, а також runtime channel plugin, gateway, Plugin SDK, secrets і точки дотику audit           |
| `/codeql-security-high/network-ssrf-boundary`    | Основні поверхні SSRF, IP parsing, network guard, web-fetch і політики SSRF у Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helpers для process execution, outbound delivery і gates для tool-execution агентів                                    |
| `/codeql-security-high/plugin-trust-boundary`    | Поверхні довіри для Plugin install, loader, manifest, registry, package-manager install, source-loading і package contract у Plugin SDK |

### Платформозалежні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза щоденними стандартними запускми, бо macOS build домінує за runtime навіть коли чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний не-security shard. Він виконує лише error-severity, non-security JavaScript/TypeScript quality queries для вузьких цінних поверхонь на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: нечернеткові PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і reply dispatch, коді config schema/migration/IO, коді auth/secrets/sandbox/security, runtime основного channel і bundled channel plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`           | Код межі безпеки для auth, secrets, sandbox, cron і gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`             | Контракти config schema, migration, normalization і IO                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Gateway protocol schemas і контракти server method                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`    | Контракти реалізації основного channel і bundled channel plugin                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`      | Command execution, model/provider dispatch, auto-reply dispatch і queues, а також runtime contracts ACP control-plane                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers і tool bridges, helpers для process supervision, а також контракти outbound delivery                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`     | Memory host SDK, memory runtime facades, aliases memory Plugin SDK, glue для активації memory runtime і команди memory doctor                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, helpers для outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Inbound reply dispatch у Plugin SDK, helpers для reply payload/chunking/runtime, channel reply options, delivery queues і helpers для session/thread binding       |
| `/codeql-critical-quality/provider-runtime-boundary`   | Model catalog normalization, provider auth і discovery, provider runtime registration, provider defaults/catalogs і registries web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`            | Bootstrap Control UI, local persistence, gateway control flows і runtime contracts task control-plane                                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Основні runtime contracts для web fetch/search, media IO, media understanding, image-generation і media-generation                                                 |
| `/codeql-critical-quality/plugin-boundary`             | Контракти loader, registry, public-surface і entrypoint у Plugin SDK                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опубліковане package-side джерело Plugin SDK і helpers для plugin package contract                                                                                 |

Quality залишається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід повертати як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

## Workflow для обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації в узгодженому стані з нещодавно злитими змінами. Вона не має чистого розкладу: успішний non-bot push CI run на `main` може її запускати, а manual dispatch може запускати її напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run був створений за останню годину. Коли вона запускається, вона переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Вона не має чистого розкладу: успішний non-bot push CI run на `main` може її запускати, але вона пропускається, якщо інший workflow-run invocation уже запускався або виконується в цей UTC день. Manual dispatch обходить цей daily activity gate. Лінія створює full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі test performance fixes зі збереженням coverage замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline test count, що проходить. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде закомічено. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія rebase validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після злиття

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злитий і що кожен duplicate має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і routing змін

Локальна changed-lane logic міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий scope платформи CI:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- невідомі root/config changes fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі редагування тестів запускають самі себе, зміни source віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб зміна shared default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу свіжо прогрітому середовищу для широкого підтвердження. Перш ніж витрачати повільну перевірку на середовище, яке було повторно використане, протерміноване або щойно повідомило про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині цього середовища.

Sanity-перевірка швидко завершується з помилкою, коли зникли потрібні кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленого sync не є надійною копією PR; зупиніть це середовище й прогрійте свіже замість того, щоб налагоджувати збій продуктового тесту. Для навмисних PR із великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без виводу після sync. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей запобіжник, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий, належний репозиторію шлях віддаленого середовища для Linux-підтвердження, коли Blacksmith недоступний або коли бажано використати власну хмарну місткість. Прогрійте середовище, гідратуйте його через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` відповідає за типові значення provider, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені Git-метадані замість sync maintainer-локальних remotes та object stores, а також виключає локальні runtime/build артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` відповідає за checkout, налаштування Node/pnpm, fetch `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` використовують як source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
