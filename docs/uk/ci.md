---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти області дії, парасольки релізів і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-06T08:38:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд конвеєра

| Завдання                         | Призначення                                                                                               | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені scopes, змінені extensions і будує CI manifest                 | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі npm advisories                                        | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                          | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для невикористаних файлів                       | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і перевикористовувані downstream artifacts           | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от перевірки bundled/plugin-contract/protocol                          | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним агрегованим результатом перевірки                        | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes                           | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke         | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і gateway watch           | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                              | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                                 | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke lane                                                                  | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                   | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс спільні регресії runtime import specifier                  | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane з використанням спільних built artifacts                                       | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                            | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                                            | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна Codex оптимізація повільних тестів після trusted activity                                         | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/on-demand звіти Kova runtime performance з mock-provider, deep-profile і GPT 5.4 live lanes       | Scheduled і manual dispatch        |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони й далі звітують про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Автоматичний concurrency key CI версійований (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують runs, що вже виконуються.

## Scope і маршрутизація

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** перевіряють Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixtures і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, Plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runners: channel contracts запускаються як три weighted shards, core unit fast/support lanes запускаються окремо, core runtime infra розділена між state і process/config shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділені між chat/auth/model/http-plugin/runtime/startup lanes замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують власні спеціалізовані Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; список boundary guard розподілений на чотири matrix shards, кожен з яких запускає вибрані незалежні guards паралельно й друкує per-check timings, зокрема `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, з вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic Plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw у ClawSweeper. Він не виконує checkout і не запускає недовірений код pull request. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних запитів review для issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit у pushes до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може інспектувати.

Lane `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони наявні. Він навмисно уникає пересилання повного webhook body. Приймальний workflow у `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, який публікує нормалізовану подію до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність — це спостереження, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія є несподіваною, actionable, ризикованою або операційно корисною. Рутинні opens, edits, bot churn, duplicate webhook noise і звичайний review traffic мають давати `NO_REPLY`.

Розглядайте GitHub titles, comments, bodies, review text, branch names і commit messages як недовірені дані на всьому цьому шляху. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatches

Ручні dispatch-и CI запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane не для Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і i18n Control UI. Окремі ручні dispatch-и CI запускають лише Android із `include_android=true`; повна release-umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для plugin, release-only shard `agentic-plugins`, повний batch sweep extensions і Docker lanes prerelease для plugin вилучені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch-ить окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, щоб повний suite release-candidate не було скасовано іншим push або PR-запуском на тому самому ref. Необов’язковий input `target_ref` дає довіреному caller змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, sharded channel contract checks, shards `check`, крім lint, aggregates `check-additional`, Node test aggregate verifiers, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `check-additional` shards, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він запускається щодня на `main` і може бути dispatch-нутий вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай benchmark-ить workflow ref. Установіть `target_ref`, щоб benchmark-ити release tag або іншу branch з поточною реалізацією workflow. Опубліковані report paths і latest pointers keyed за tested ref, а кожен `index.md` записує tested ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: diagnostic scenarios Kova для runtime локальної збірки з детермінованою фальшивою OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, Gateway і agent-turn hotspots.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: gateway boot timing і memory для default, hook і 50-plugin startup cases; повторні mock-OpenAI hello loops `channel-chat-baseline`; і CLI startup commands для завантаженого gateway. Markdown summary source probe розміщено в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також commit-ить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts до `openclaw/clawgrit-reports` у `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний pointer tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для "запустити все перед релізом". Він приймає branch, tag або повний commit SHA, dispatch-ить ручний workflow `CI` з цією target, dispatch-ить `Plugin Prerelease` для release-only plugin/package/static/Docker proof і dispatch-ить `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default runs тримають вичерпне live/E2E і Docker release-path coverage за `run_release_soak=true`; `release_profile=full` примусово вмикає це soak coverage, щоб broad advisory validation залишалась broad. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` для artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane для опублікованого npm package.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow job, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Dispatch-іть його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
dispatch-ить `Plugin NPM Release` для всіх publishable plugin packages, dispatch-ить
`Plugin ClawHub Release` для того самого release SHA і лише після цього dispatch-ить
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для pinned commit proof на branch, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs.
Helper push-ить тимчасову branch `release-ci/<sha>-...` на target SHA,
dispatch-ить `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` відповідає target, і видаляє тимчасову branch, коли run
завершується. Umbrella verifier також завершується з помилкою, якщо будь-який child workflow виконувався на
іншому SHA.

`release_profile` керує широтою live/провайдерів, що передається в release checks. Ручні release workflow за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка advisory-матриця провайдерів/медіа. `run_release_soak` керує тим, чи stable/default release checks запускають вичерпний live/E2E і Docker release-path soak; `full` примусово вмикає soak.

- `minimum` зберігає найшвидші release-critical лінії OpenAI/core.
- `stable` додає стабільний набір провайдерів/backend.
- `full` запускає широку advisory-матрицю провайдерів/медіа.

Umbrella записує ідентифікатори запущених дочірніх run, а фінальна job `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших job для кожного дочірнього run. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківську verifier job, щоб оновити результат umbrella і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного повного дочірнього CI, `plugin-prerelease` лише для дочірнього prerelease plugin, `release-checks` для кожного дочірнього release, або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на umbrella. Це тримає перезапуск невдалого release box обмеженим після сфокусованого виправлення. Для однієї невдалої cross-OS lane поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки heartbeat, а підсумки packaged-upgrade містять таймінги по фазах. QA release-check lanes є advisory, тому збої лише в QA дають попередження, але не блокують release-check verifier.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт у cross-OS checks і Package Acceptance, а також у live/E2E release-path Docker workflow, коли виконується soak coverage. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх job.

Дублікати run `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Батьківський monitor скасовує будь-який дочірній workflow, який він уже запустив, коли батьківський workflow скасовано, тож новіша валідація main не стоятиме в черзі за застарілим двогодинним release-check run. Валідація release branch/tag і сфокусовані групи перезапуску зберігають `cancel-in-progress: false`.

## Live і E2E shards

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість однієї послідовної job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` з фільтрацією за провайдером
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені audio/video media shards і music shards з фільтрацією за провайдером

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live-провайдерів. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Native live media shards працюють у `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед setup. Docker-backed live suites тримайте на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live release workflow збирає і пушить цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні script-level обмеження `timeout` нижчі за workflow job timeout, щоб завислий container або шлях cleanup швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повну source Docker target, release run налаштовано неправильно і він марнуватиме wall clock на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Jobs

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного package candidate, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє inventory tarball, готує package-digest Docker images за потреби й запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав його; автономний Telegram dispatch усе ще може встановити опубліковану npm spec.
4. `summary` завершує workflow з помилкою, якщо package resolution, Docker acceptance або опційна Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну release version OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable.
- `source=ref` пакує довірений `package_ref` branch, tag або повний commit SHA. Resolver fetch-ить branches/tags OpenClaw, перевіряє, що вибраний commit досяжний з історії repository branch або release tag, встановлює deps у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає поточному test harness змогу перевіряти старіші довірені source commits без запуску старої workflow logic.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker release-path chunks з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язковий, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб валідація опублікованого пакета не залежала від live-доступності ClawHub. Опційна Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm spec збережено для автономних dispatches.

Для спеціальної політики тестування оновлень і plugins, зокрема локальних команд,
Docker lanes, inputs Package Acceptance, release defaults і failure triage,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це зберігає proof для package migration, update, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update і Telegram на тому самому розв’язаному tarball пакета. Установіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму matrix проти вже випущеного npm package замість SHA-built artifact. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за run у blocking release path. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди перезапуску failed-lane зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` установлює `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири найновіші stable npm releases плюс зафіксовані plugin-compatibility boundary releases і issue-shaped fixtures для Feishu config, збережених bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths і stale legacy plugin dependency roots. Multi-baseline published-upgrade survivor selections шардуються за baseline в окремі targeted Docker runner jobs. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується вичерпного published update cleanup, а не звичайної широти Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline із вбудованим recipe команди `openclaw config set`, записує recipe steps у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його встановлено, інакше `openai/gpt-5.4`, тож proof встановлення і Gateway лишається на GPT-5 test model, уникаючи defaults GPT-4.x.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити subcase persistence `gateway install --wrapper`, коли пакет не expose-ить цей flag;
- `update-channel-switch` може prune missing `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати missing persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати missing marketplace install-record persistence;
- `plugin-update` може дозволяти config metadata migration, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампів метаданих збірки, які вже були поставлені. Пізніші пакети мають відповідати сучасним контрактам; за тих самих умов вони завершуються помилкою, а не попереджають чи пропускають.

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

Під час налагодження невдалого запуску перевірки прийнятності пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної перевірки релізу.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що зачіпають Docker/пакетні поверхні, зміни пакета/маніфесту вбудованих plugin, або поверхні core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованих plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg вбудованого extension і запускає обмежений Docker-профіль bundled-plugin із загальним тайм-аутом команди 240 секунд (кожен Docker run сценарію обмежений окремо).
- **Повний шлях** зберігає QR package install і Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker поверхні. У повному режимі install-smoke готує або повторно використовує один GHCR root Dockerfile smoke image для цільового SHA, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі jobs, щоб робота інсталятора не чекала за root image smokes.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow залишає швидкий Docker smoke, а повний install smoke лишає для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з release checks workflow, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull requests і пуші в `main` не запускають його. QR і installer Docker tests мають власні Dockerfiles, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lanes.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                         |
| ------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-пулу, чутливого до провайдерів.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Обмеження паралельних live lanes, щоб провайдери не застосовували throttling.                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Обмеження паралельних npm install lanes.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Обмеження паралельних multi-service lanes.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Інтервал між стартами lanes, щоб уникнути create storms Docker daemon; встановіть `0`, щоб вимкнути інтервал. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут на lane (120 хвилин); вибрані live/tail lanes використовують суворіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset           | `1` друкує план планувальника без запуску lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset           | Розділений комами точний список lanes; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу lane. |

Lane, що важча за свій ефективний ліміт, усе одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальні агреговані preflights перевіряють Docker, видаляють застарілі OpenClaw E2E containers, виводять статус активних lanes, зберігають таймінги lanes для впорядкування від найдовших і за замовчуванням припиняють планування нових pooled lanes після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує bare/functional GHCR Docker E2E images із тегом package digest через Docker layer cache Blacksmith, коли плану потрібні package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker images повторюються з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий registry/cache stream швидко повторювався, а не займав більшість критичного шляху CI.

### Фрагменти release path

Release Docker coverage запускає менші jobs, розбиті на chunks, з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу й виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім lane `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох provider installer lanes.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path покриття запитує його, і зберігає окремий chunk `openwebui` лише для dispatches, що стосуються тільки OpenWebUI. Bundled-channel update lanes повторюються один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` із журналами lanes, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями slow-lane і командами повторного запуску для кожної lane. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує налагодження failed-lane одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, цільовий job локально збирає live-test image для цього повторного запуску. Згенеровані GitHub rerun commands для кожної lane містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точний package та images із невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` — дорожче product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, пуші в `main` і самостійні ручні CI dispatches не запускають цей suite. Він балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Шлях Docker prerelease лише для релізу групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для jobs тривалістю одну-три хвилини.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладено в широкі QA і release harnesses, а не в окремий PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, бо QA parity покриває memory behavior окремо; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI підтримує це. CLI default і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у малий report job для фінального parity comparison.

Для звичайних PR дотримуйтеся доказів scoped CI/check, а не вважайте parity обов’язковим статусом.

## CodeQL

Workflow `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним оглядом репозиторію. Щоденні, ручні та захисні запуски pull request не в стані draft сканують код Actions workflow плюс JavaScript/TypeScript-поверхні найвищого ризику з високодостовірними запитами безпеки, відфільтрованими до високої/критичної `security-severity`.

Захист pull request лишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму високодостовірну матрицю безпеки, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron і базова лінія Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс runtime Plugin каналу, Gateway, Plugin SDK, secrets, точки дотику аудиту              |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні політики SSRF, парсингу IP, network guard, web-fetch і SSRF у Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, helpers виконання процесів, outbound delivery і gates виконання інструментів агентом                                |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри Plugin install, loader, manifest, registry, package-manager install, source-loading і контракту пакета Plugin SDK |

### Платформоспецифічні шарди безпеки

- `CodeQL Android Critical Security` — запланований шард безпеки Android. Збирає застосунок Android вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний шард безпеки macOS. Збирає застосунок macOS вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Утримується поза щоденними стандартними запусками, бо збірка macOS домінує runtime навіть коли проходить чисто.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний шард безпеки без security. Він запускає лише JavaScript/TypeScript-запити якості з error-severity, non-security над вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: PR не в стані draft запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агентом і диспетчеризації відповідей, коді схеми/міграції/IO конфігурації, коді auth/secrets/sandbox/security, runtime основного каналу й bundled channel Plugin, протоколі Gateway/server-method, runtime пам’яті/SDK glue, MCP/process/outbound delivery, runtime провайдера/каталозі моделей, diagnostics сесій/чергах доставки, Plugin loader, Plugin SDK/контракті пакета або runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і quality workflow запускають усі дванадцять PR-шардів якості.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є навчальними/ітераційними hooks для запуску одного шарда якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`           | Код межі безпеки auth, secrets, sandbox, Cron і Gateway                                                                                                    |
| `/codeql-critical-quality/config-boundary`             | Контракти схеми конфігурації, міграції, нормалізації та IO                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Схеми протоколу Gateway і контракти server method                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`    | Контракти реалізації основного каналу та bundled channel Plugin                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`      | Контракти runtime виконання команд, диспетчеризації model/provider, диспетчеризації auto-reply і черг, а також ACP control-plane                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери й tool bridges, helpers нагляду за процесами та контракти outbound delivery                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`     | Memory host SDK, фасади memory runtime, aliases memory Plugin SDK, glue активації memory runtime і команди memory doctor                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми reply queue, черги доставки сесій, helpers прив’язки/доставки outbound session, поверхні diagnostic event/log bundle і контракти CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Диспетчеризація inbound reply Plugin SDK, helpers reply payload/chunking/runtime, параметри channel reply, черги доставки й helpers прив’язки session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`   | Нормалізація каталогу моделей, auth і discovery провайдера, реєстрація runtime провайдера, defaults/catalogs провайдера та registries web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`            | Bootstrap Control UI, локальна persistence, control flows Gateway і runtime contracts task control-plane                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Контракти runtime основного web fetch/search, media IO, media understanding, image-generation і media-generation                                           |
| `/codeql-critical-quality/plugin-boundary`             | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опублікований source Plugin SDK на боці пакета та helpers контракту пакета Plugin                                                                          |

Якість лишається окремою від безпеки, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати, не затемнюючи сигнал безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Workflow обслуговування

### Docs Agent

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримання наявної документації у відповідності з нещодавно landed змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` просунувся далі або коли інший non-skipped запуск Docs Agent було створено за останню годину. Коли він запускається, він переглядає діапазон commit від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC-дня. Manual dispatch обходить цей daily activity gate. Lane будує grouped Vitest performance report для full-suite, дозволяє Codex робити лише невеликі test performance fixes зі збереженням coverage замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline test count, який проходить. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push landed, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберегти ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після merge

Workflow `Duplicate PRs After Merge` — це ручний workflow maintainer для cleanup дублікатів після land. За замовчуванням він dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR merged і що кожен дублікат має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий scope платформи CI:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps лишаються явною test work);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі правки тестів запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним з explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt маршрутизуються через core reply tests плюс Discord і Slack delivery regressions, щоб зміна shared default впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що cheap mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію та віддавайте перевагу свіжому прогрітому боксу для широкого підтвердження. Перед тим як витрачати повільну перевірку на бокс, який повторно використали, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині бокса.

Перевірка справності швидко завершується з помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте свіжий, замість налагоджувати помилку тесту продукту. Для PR з навмисними масовими видаленнями задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це репозиторна обгортка віддаленого бокса для Linux-підтвердження мейнтейнерів. Використовуйте її, коли перевірка надто широка для локального циклу редагування, коли важливий паритет CI або коли підтвердження потребує секретів, Docker, пакетних ліній, багаторазових боксів чи віддалених логів. Звичайний бекенд OpenClaw — `blacksmith-testbox`; власні потужності AWS/Hetzner є запасним варіантом для збоїв Blacksmith, проблем із квотами або явного тестування на власних потужностях.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Репозиторна обгортка відхиляє застарілий бінарний файл Crabbox, який не оголошує `blacksmith-testbox`. Передавайте провайдера явно, навіть попри те, що `.crabbox.yaml` має типові налаштування власної хмари.

Перевірка змін:

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

Прочитайте підсумковий JSON-звіт. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Одноразові запуски Crabbox на базі Blacksmith мають автоматично зупиняти Testbox; якщо запуск перервано або очищення незрозуміле, перегляньте активні бокси й зупиняйте лише ті бокси, які створили ви:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли вам навмисно потрібно виконати кілька команд на тому самому гідратованому боксі:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо зламаним шаром є Crabbox, але сам Blacksmith працює, використовуйте прямий Blacksmith як вузький запасний варіант:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Переходьте до власних потужностей Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власні потужності є явною метою:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` визначає типові налаштування провайдера, синхронізації та гідратації GitHub Actions для власних хмарних ліній. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних для мейнтейнера remotes і сховищ об’єктів, а також виключає локальні артефакти виконання/збірки, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища для команд власної хмари `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
