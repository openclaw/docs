---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, перевірки за областю, парасолькові релізні завдання та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-07T15:09:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lane, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для реліз-кандидатів та широкої валідації. Lane Android залишаються opt-in через `include_android`. Покриття Plugin лише для релізів живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                               | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scope, змінені extensions і будує маніфест CI                          | Завжди на non-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                | Завжди на non-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі npm advisories                                        | Завжди на non-draft push і PR      |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                                       | Завжди на non-draft push і PR      |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів                           | Зміни, релевантні Node             |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts                     | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux lane коректності, як-от перевірки bundled/plugin-contract/protocol                           | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate результатом перевірки                          | Зміни, релевантні Node             |
| `checks-node-core-test`          | Shard core Node test, виключно з channel, bundled, contract і extension lane                              | Зміни, релевантні Node             |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke         | Зміни, релевантні Node             |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і gateway watch           | Зміни, релевантні Node             |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                              | Зміни, релевантні Node             |
| `checks`                         | Verifier для built-artifact channel tests                                                                 | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Lane збірки та smoke для сумісності з Node 22                                                             | Ручний CI dispatch для релізів     |
| `check-docs`                     | Перевірки форматування docs, lint і broken-link                                                           | Змінено docs                       |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                                 | Зміни, релевантні Python-skill     |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс shared runtime import specifier regressions                | Зміни, релевантні Windows          |
| `macos-node`                     | Lane TypeScript test для macOS із використанням shared built artifacts                                    | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                            | Зміни, релевантні macOS            |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                                            | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                                         | Успіх Main CI або manual dispatch  |
| `openclaw-performance`           | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і GPT 5.4 live lanes    | Scheduled і manual dispatch        |

## Порядок fail-fast

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань artifact і platform matrix.
3. `build-artifacts` перекривається зі швидкими Linux lane, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lane розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний concurrency key CI versioned (`CI-v7-*`), щоб zombie на боці GitHub у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

Завдання `ci-timings-summary` завантажує компактний artifact `ci-timings-summary` для кожного non-draft CI run. Воно записує wall time, queue time, найповільніші завдання і failed jobs для поточного run, щоб CI health checks не потребували багаторазового scraping повного Actions payload.

## Scope і routing

Логіка scope живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожну scoped area було змінено.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі собою не примушують Windows, Android або macOS native builds; ці platform lane залишаються scoped до змін platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність Node 22, channel contracts, full core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які fast task безпосередньо перевіряє.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted Blacksmith-backed shards зі standard GitHub runner fallback, core unit fast/support lanes запускаються окремо, core runtime infra розділено між state, process/config, cron і shared shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділені між chat/auth/model/http-plugin/runtime/startup lanes замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard list розподілено смугами між чотирма matrix shards, кожен із яких запускає вибрані independent guards concurrently і друкує per-check timings. Дорога перевірка Codex happy-path prompt snapshot drift запускається як окреме additional job лише для manual CI і для prompt-affecting changes, тому звичайні непов’язані Node changes не чекають за cold prompt snapshot generation, а boundary shards залишаються збалансованими, поки prompt drift усе ще прив’язаний до PR, який його спричинив; той самий flag пропускає prompt snapshot Vitest generation всередині built-artifact core support-boundary shard. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge від активності repository OpenClaw до ClawSweeper. Він не checkout і не виконує недовірений pull request code. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch компактні payload `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири lane:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper в issue comments;
- `clawsweeper_commit_review` для commit-level review requests на push до `main`;
- `github_activity` для загальної GitHub activity, яку агент ClawSweeper може inspect.

Lane `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони наявні. Він навмисно уникає пересилання повного webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану event до OpenClaw Gateway hook для агента ClawSweeper.

General activity — це observation, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли event є несподіваним, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають призводити до `NO_REPLY`.

Сприймайте заголовки GitHub, коментарі, тіла, текст рев’ю, назви гілок і повідомлення комітів як недовірені дані на всьому цьому шляху. Вони є вхідними даними для підсумовування й тріажу, а не інструкціями для workflow або runtime агента.

## Ручні dispatch-запуски

Ручні CI dispatch-запуски виконують той самий граф job, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки docs, Python skills, Windows, macOS і Control UI i18n. Окремі ручні CI dispatch-запуски виконують лише Android із `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки Plugin prerelease, release-only shard `agentic-plugins`, повний batch sweep розширень і Docker lanes для Plugin prerelease виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch-запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, щоб повний suite release-candidate не скасовувався іншим push або PR-запуском на тому самому ref. Опціональний input `target_ref` дає змогу довіреному виклику виконати цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, sharded перевірки channel contract, `check` shards окрім lint, агрегати `check-additional`, aggregate verifiers для Node tests, перевірки docs, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші shards розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled Plugin test shards, `check-additional` shards, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували); Docker builds для install-smoke (час очікування черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

CI канонічного репозиторію залишає Blacksmith стандартним шляхом runner. Під час `preflight` `scripts/ci-runner-labels.mjs` перевіряє нещодавні queued і in-progress Actions runs на queued jobs Blacksmith. Якщо конкретна мітка Blacksmith уже має queued jobs, downstream jobs, які використовували б саме цю мітку, повертаються до відповідного GitHub-hosted runner (`ubuntu-24.04`, `windows-2025` або `macos-latest`) лише для цього запуску. Інші розміри Blacksmith у тій самій OS family залишаються на своїх основних мітках. Якщо API probe не вдається, fallback не застосовується.

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

## OpenClaw Performance

`OpenClaw Performance` — це workflow продуктивності product/runtime. Він запускається щодня на `main` і може бути dispatch-запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай benchmark-ить workflow ref. Установіть `target_ref`, щоб benchmark-ити release tag або іншу гілку з поточною реалізацією workflow. Опубліковані шляхи звітів і latest pointers ключуються за протестованим ref, а кожен `index.md` записує протестовані ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти local-build runtime з детермінованою fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, gateway і agent-turn hotspots.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: gateway boot timing і memory для default, hook і 50-plugin startup cases; повторювані mock-OpenAI hello loops `channel-chat-baseline`; і CLI startup commands проти запущеного gateway. Markdown-підсумок source probe міститься в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane вивантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний tested-ref pointer записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` — це ручний umbrella workflow для “запустити все перед release.” Він приймає гілку, тег або повний SHA коміту, dispatch-запускає ручний workflow `CI` з цим target, dispatch-запускає `Plugin Prerelease` для release-only plugin/package/static/Docker proof і dispatch-запускає `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default runs тримають exhaustive live/E2E і Docker release-path coverage за `run_release_soak=true`; `release_profile=full` примусово вмикає це soak coverage, щоб широка advisory validation залишалася широкою. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повна release validation](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей profile, artifacts і
handles для focused rerun.

`OpenClaw Release Publish` — це ручний mutating release workflow. Dispatch-запускайте його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
dispatch-запускає `Plugin NPM Release` для всіх publishable Plugin packages, dispatch-запускає
`Plugin ClawHub Release` для того самого release SHA, і лише потім dispatch-запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для доказу закріпленого коміту на швидкозмінній гілці використовуйте допоміжний засіб замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Посилання dispatch у workflow GitHub мають бути гілками або тегами, а не сирими SHA комітів.
Допоміжний засіб надсилає тимчасову гілку `release-ci/<sha>-...` на цільовий SHA,
запускає `Full Release Validation` із цього закріпленого посилання, перевіряє, що кожен дочірній
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку після завершення
запуску. Загальний верифікатор також завершується помилкою, якщо будь-який дочірній workflow виконувався на
іншому SHA.

`release_profile` керує широтою live/provider, яку передають у перевірки релізу. Ручні
релізні workflow за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку консультативну матрицю provider/media. `run_release_soak`
керує тим, чи стабільні/типові перевірки релізу запускають вичерпний live/E2E та
Docker soak для релізного шляху; `full` примусово вмикає soak.

- `minimum` зберігає найшвидші критичні для релізу лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Загальний workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише батьківське завдання верифікатора, щоб оновити загальний результат і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного дочірнього релізного запуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у загальному workflow. Це обмежує перезапуск невдалого релізного середовища після цільового виправлення. Для однієї невдалої cross-OS лінії поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а підсумки packaged-upgrade містять часи для кожної фази. Лінії QA release-check є консультативними, тому помилки лише QA попереджають, але не блокують верифікатор release-check.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт у cross-OS перевірки та Package Acceptance, а також у Docker workflow live/E2E релізного шляху, коли запускається soak-покриття. Це зберігає байти пакета узгодженими між релізними середовищами й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший загальний workflow. Батьківський монітор скасовує будь-який дочірній workflow, який він
уже запустив, коли батьківський запуск скасовано, тому новіша валідація main
не чекає за застарілим двогодинним запуском release-check. Валідація гілок/тегів
релізу та цільові групи перезапуску зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній live/E2E релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені shards audio/video media та shards music, відфільтровані за provider

Це зберігає те саме покриття файлів, водночас спрощуючи перезапуск і діагностику повільних збоїв live provider. Агреговані назви shard `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Залишайте Docker-backed live suites на звичайних runner Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й надсилає цей образ один раз, а потім Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні обмеження `timeout` на рівні скрипта нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не споживав увесь бюджет release-check. Якщо ці shards самостійно перебудовують повну source Docker target, релізний запуск налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Завдання

1. `resolve_package` отримує `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` із `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє інвентар tarball, готує Docker-образи з digest пакета за потреби й запускає вибрані Docker-лінії проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав один; автономний Telegram dispatch усе ще може встановити опубліковану специфікацію npm.
4. `summary` завершує workflow помилкою, якщо розв’язання пакета, Docker acceptance або опційна Telegram-лінія зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих prerelease/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності у відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його слід надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає поточному test harness змогу перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugin, щоб валідація опублікованого пакета не залежала від live доступності ClawHub. Опційна Telegram-лінія повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої специфікації npm збережено для автономних dispatch.

Окрему політику тестування оновлень і plugin, включно з локальними командами,
Docker-лініями, входами Package Acceptance, типовими значеннями релізу й triage помилок,
див. у [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Release checks викликає Package Acceptance із `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це зберігає доказ міграції пакета, оновлення, очищення застарілої залежності plugin, відновлення встановлення налаштованого plugin, офлайн plugin, plugin-update і Telegram на тому самому розв’язаному tarball пакета. Задайте `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти випущеного пакета npm замість артефакта, зібраного за SHA. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і поведінку платформи; валідацію продукту package/update слід починати з Package Acceptance. Docker-лінія `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за запуск у блокувальному релізному шляху. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, за замовчуванням `openclaw@latest`; команди перезапуску невдалих ліній зберігають цей baseline. Full Release Validation із `run_release_soak=true` або `release_profile=full` задає `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири найновіші стабільні npm-релізи плюс закріплені boundary-релізи сумісності plugin і issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona файлів, налаштованих встановлень plugin OpenClaw, шляхів журналів із тильдою та застарілих коренів залежностей legacy plugin. Вибори published-upgrade survivor із кількома baseline поділяються за baseline на окремі цільові Docker runner jobs. Окремий workflow `Update Migration` використовує Docker-лінію `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній широті Full Release CI. Локальні агреговані запуски можуть передавати точні специфікації пакета через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну лінію з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована лінія налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz` плюс статус RPC після старту Gateway. Свіжі packaged та installer лінії Windows також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із сирого абсолютного шляху Windows. Cross-OS OpenAI agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його задано, інакше `openai/gpt-5.4`, тож доказ встановлення й gateway залишається на тестовій моделі GPT-5, уникаючи типових значень GPT-4.x.

### Вікна сумісності legacy

Package Acceptance має обмежені вікна сумісності зі старими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні записи QA в `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` із фальшивого git fixture, отриманого з tarball, і може логувати відсутній збережений `update.channel`;
- димові перевірки плагінів можуть читати застарілі розташування записів установлення або приймати відсутність збереження запису встановлення marketplace;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб запис установлення й поведінка без повторного встановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампа метаданих збірки, які вже були випущені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови спричиняють помилку, а не попередження чи пропуск.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane, часові показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної валідації релізу.

## Димова перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє димове покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/пакетних поверхонь, змін пакета/manifest bundled plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним тайм-аутом команди 240 секунд (кожен Docker run сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і Docker/update покриття інсталятора для нічних запланованих запусків, ручних dispatches, release checks через workflow-call і pull requests, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR образ димової перевірки кореневого Dockerfile, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб робота інсталятора не чекала за root image smokes.

Пуші в `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття під час push, workflow зберігає fast Docker smoke і залишає full install smoke для нічної або релізної валідації.

Повільна Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Вона запускається за нічним розкладом і з workflow release checks, а ручні dispatches `Install Smoke` можуть увімкнути її, але pull requests і пуші в `main` не запускають її. QR і installer Docker tests зберігають власні Dockerfiles, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який установлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                   |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних lanes.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-pool, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live lanes, щоб провайдери не throttling.                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних npm install lanes.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service lanes.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lanes, щоб уникнути бур створення Docker daemon; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут на lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` виводить план scheduler без запуску lanes.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список lanes; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, усе ще може стартувати з порожнього pool, а потім працює самостійно, доки не звільнить capacity. Локальні сукупні preflights перевіряють Docker, видаляють застарілі OpenClaw E2E containers, виводять статус active-lane, зберігають timings lanes для longest-first ordering і за замовчуванням припиняють планувати нові pooled lanes після першої помилки.

### Перевикористовуваний live/E2E workflow

Перевикористовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує artifact пакета з поточного run, або завантажує artifact пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає та пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує lanes із установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість перебудови. Завантаження Docker image повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу й виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI входить до `plugins-runtime-services`, коли його запитує повне покриття release-path, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Bundled-channel update lanes повторюють спробу один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` із логами lanes, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує налагодження failed-lane одним targeted Docker job і готує, завантажує або повторно використовує artifact пакета для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точний пакет і образи з failed run.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним operator. Звичайні pull requests, пуші в `main` і standalone manual CI dispatches не запускають цей suite. Він балансує тести bundled plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у малі groups, щоб не резервувати десятки runners для jobs на одну-три хвилини.

## QA Lab

QA Lab має dedicated CI lanes поза основним smart-scoped workflow. Agentic parity вкладено в broad QA і release harnesses, а не в standalone PR workflow. Використовуйте `Full Release Validation` із `rerun_group=qa-parity`, коли parity має виконуватися разом із broad validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як parallel jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Перевірки релізу запускають live-лінії транспорту Matrix і Telegram з детермінованим mock-провайдером і моделями, кваліфікованими як mock (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделей і звичайного запуску provider-plugin. Live transport gateway вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривають окремі набори live model, native provider і Docker provider.

Matrix використовує `--profile fast` для планових і релізних gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і manual workflow input лишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критично важливі для релізу лінії QA Lab перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов’язковим статусом.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep усього репозиторію. Щоденні, ручні й guard-запуски для non-draft pull request сканують код Actions workflow плюс найризикованіші поверхні JavaScript/TypeScript із high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard лишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні Core SSRF, IP parsing, network guard, web-fetch і політики Plugin SDK SSRF                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для Plugin install, loader, manifest, registry, package-manager install, source-loading і контракту пакета Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — плановий Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими запусками, бо macOS build домінує за runtime навіть коли чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і reply dispatch, config schema/migration/IO, auth/secrets/sandbox/security, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron і код gateway security boundary                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization і IO contracts                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas і server method contracts                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації core channel і bundled channel plugin                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution, model/provider dispatch, auto-reply dispatch and queues, і ACP control-plane runtime contracts                                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers and tool bridges, process supervision helpers і outbound delivery contracts                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers                |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries      |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface і Plugin SDK entrypoint contracts                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Published package-side Plugin SDK source і plugin package contract helpers                                                                                       |

Quality тримається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі profiles матимуть стабільний runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації в узгодженому стані з нещодавно landed changes. У нього немає pure schedule: успішний non-bot push CI run на `main` може його тригерити, а manual dispatch може запускати його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли за останню годину було створено інший non-skipped Docs Agent run. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може охопити всі main changes, накопичені з моменту останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних тестів. У нього немає pure schedule: успішний non-bot push CI run на `main` може його тригерити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується того UTC day. Manual dispatch обходить цей daily activity gate. Лінія будує grouped Vitest performance report для full-suite, дозволяє Codex робити лише невеликі test performance fixes, що зберігають coverage, замість broad refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як будь-що буде committed. Коли `main` просувається до того, як bot push lands, лінія rebases validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action могла зберігати ту саму drop-sudo safety posture, що й docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це manual maintainer workflow для post-land duplicate cleanup. Він типово запускається як dry-run і закриває лише явно перелічені PRs, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR merged і що кожен duplicate має або shared referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates and changed routing

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий CI platform scope:

- зміни основного продакшн-коду запускають перевірку типів core prod і core test, а також core lint/guards;
- зміни лише в основних тестах запускають тільки перевірку типів core test і core lint;
- продакшн-зміни розширень запускають перевірку типів extension prod і extension test, а також extension lint;
- зміни лише в тестах розширень запускають перевірку типів extension test і extension lint;
- зміни публічного Plugin SDK або контракту Plugin розширюються до перевірки типів розширень, бо розширення залежать від цих основних контрактів (прогони розширень Vitest залишаються явно тестовою роботою);
- підняття версій лише в метаданих релізу запускає цільові перевірки версій/конфігурації/root-залежностей;
- невідомі зміни в корені/конфігурації для безпеки переходять на всі check-лінії.

Локальна маршрутизація змінених тестів живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел віддають перевагу явним мапінгам, потім сусіднім тестам і залежним за графом імпортів. Спільна конфігурація доставки group-room є одним із явних мапінгів: зміни до конфігурації видимої відповіді групи, режиму доставки відповіді джерела або системного prompt інструмента повідомлень проходять через основні тести відповідей плюс регресії доставки Discord і Slack, щоб спільна зміна стандартного значення падала до першого push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка для harness, що дешевий зіставлений набір не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й надавайте перевагу свіжо прогрітому box для широкого доказу. Перш ніж витрачати повільний gate на box, який повторно використали, термін дії якого сплив або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity-перевірка швидко падає, коли потрібні кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що віддалений стан синхронізації не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження збою продуктового тесту. Для навмисних PR із великим видаленням установіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це wrapper віддаленого box, яким володіє репозиторій, для maintainer Linux proof. Використовуйте його, коли перевірка занадто широка для локального циклу редагування, коли важлива паритетність із CI або коли доказ потребує secret, Docker, package lanes, повторно використовуваних box чи віддалених logs. Звичайний backend OpenClaw — `blacksmith-testbox`; власна потужність AWS/Hetzner є fallback для збоїв Blacksmith, проблем із quota або явного тестування owned-capacity.

Перед першим запуском перевірте wrapper з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo wrapper відмовляється працювати із застарілим binary Crabbox, який не оголошує `blacksmith-testbox`. Передавайте provider явно, навіть попри те, що `.crabbox.yaml` має стандартні значення owned-cloud.

Changed gate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Повторний запуск цільового тесту:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Повний набір:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Читайте фінальний JSON summary. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Одноразові запуски Crabbox з підтримкою Blacksmith мають автоматично зупиняти Testbox; якщо запуск перервано або cleanup незрозумілий, перегляньте live boxes і зупиніть лише ті box, які ви створили:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте reuse лише тоді, коли вам навмисно потрібно кілька команд на тому самому hydrated box:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо зламаним шаром є Crabbox, але сам Blacksmith працює, використайте прямий Blacksmith як вузький fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmups сидять у `queued` без IP або Actions run URL через кілька хвилин,
вважайте це навантаженням на provider Blacksmith, queue, billing або org-limit. Зупиніть
queued ids, які ви створили, не запускайте більше Testboxes і перенесіть доказ на
шлях owned Crabbox capacity нижче, поки хтось перевіряє dashboard Blacksmith,
billing і org limits.

Переходьте на owned Crabbox capacity лише тоді, коли Blacksmith недоступний, обмежений quota, не має потрібного середовища або owned capacity явно є метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Під тиском AWS уникайте `class=beast`, якщо завданню справді не потрібен CPU класу 48xlarge. Запит `beast` стартує зі 192 vCPU і є найпростішим способом упертися в регіональну quota EC2 Spot або On-Demand Standard. Repo-owned `.crabbox.yaml` за замовчуванням використовує `standard`, кілька capacity regions і `capacity.hints: true`, щоб brokered AWS leases друкували вибрані region/market, quota pressure, Spot fallback і high-pressure class warnings. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast недостатньо, і `beast` лише для виняткових CPU-bound lanes, як-от full-suite або all-plugin Docker matrices, явна release/blocker validation або high-core performance profiling. Не використовуйте `beast` для `pnpm check:changed`, цільових тестів, docs-only роботи, звичайного lint/typecheck, малих E2E repro або triage збою Blacksmith. Використовуйте `--market on-demand` для діагностики capacity, щоб коливання Spot market не змішувалося із сигналом.

`.crabbox.yaml` володіє стандартними значеннями provider, sync і GitHub Actions hydration для owned-cloud lanes. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні віддалені Git metadata замість синхронізації maintainer-local remotes і object stores, і виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і передачею non-secret environment для owned-cloud команд `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
