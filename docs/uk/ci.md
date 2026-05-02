---
read_when:
    - Потрібно зрозуміти, чому CI-завдання запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що не проходить
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти обсягу, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T22:39:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d8e929702c21ad52152eb518a6c775613b1858653932a088d701e6014be0de9
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidates та широкої валідації. Android lanes лишаються opt-in через `include_android`. Покриття Plugin лише для релізів розміщене в окремому workflow [`Plugin-попередній випуск`](#plugin-prerelease) і запускається лише з [`Повної валідації релізу`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                           | Коли запускається                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scopes, змінені extensions і будує CI manifest                                     | Завжди для non-draft push і PR          |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                            | Завжди для non-draft push і PR          |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                                         | Завжди для non-draft push і PR          |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                                                      | Завжди для non-draft push і PR          |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                               | Зміни, релевантні Node                  |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts                                  | Зміни, релевантні Node                  |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                                         | Зміни, релевантні Node                  |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                                               | Зміни, релевантні Node                  |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                                              | Зміни, релевантні Node                  |
| `check`                          | Sharded еквівалент основного local gate: prod types, lint, guards, test types і strict smoke                         | Зміни, релевантні Node                  |
| `check-additional`               | Architecture, boundary, prompt snapshot drift, extension-surface guards, package-boundary і gateway-watch shards      | Зміни, релевантні Node                  |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                                          | Зміни, релевантні Node                  |
| `checks`                         | Verifier для built-artifact channel tests                                                                             | Зміни, релевантні Node                  |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                                              | Ручний CI dispatch для релізів          |
| `check-docs`                     | Форматування docs, lint і перевірки broken-link                                                                       | Змінено docs                            |
| `skills-python`                  | Ruff + pytest для Skills, підтримуваних Python                                                                        | Зміни, релевантні Python Skills         |
| `checks-windows`                 | Windows-specific process/path tests плюс regressions для shared runtime import specifier                              | Зміни, релевантні Windows               |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                                                    | Зміни, релевантні macOS                 |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                                               | Зміни, релевантні macOS                 |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                                                        | Зміни, релевантні Android               |
| `test-performance-agent`         | Щоденна оптимізація slow-test у Codex після trusted activity                                                          | Успіх Main CI або manual dispatch       |
| `openclaw-performance`           | Щоденні/on-demand звіти Kova runtime performance з mock-provider, deep-profile і GPT 5.4 live lanes                   | Scheduled і manual dispatch             |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє до того самого PR або ref `main`. Вважайте це CI noise, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють нормальні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Automatic CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Зміни CI workflow** перевіряють Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes лишаються scoped до змін platform source.
- **Зміни лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes лишаються на Linux Node lanes.

Найповільніші родини Node tests розділено або збалансовано так, щоб кожне завдання лишалося малим без надмірного резервування runners: channel contracts виконуються як три weighted shards, малі core unit lanes спарені, auto-reply виконується як чотири balanced workers (з reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards одночасно всередині одного job, включно з `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard виконуються одночасно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, з вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings від Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Переспрямування активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не check out і не виконує untrusted pull request code. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatches компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper в issue comments;
- `clawsweeper_commit_review` для commit-level review requests на push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може inspect.

Lane `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони присутні. Вона навмисно уникає пересилання повного webhook body. Receiving workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який posts normalized event до OpenClaw Gateway hook для агента ClawSweeper.

General activity — це observation, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має post до `#clawsweeper` лише тоді, коли event є surprising, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages untrusted data в усьому цьому path. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні dispatch-запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають усі scoped lane не для Android: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні dispatch-запуски CI виконують лише Android із `include_android=true`; повна release-обгортка вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin, релізний шард `agentic-plugins`, повний пакетний sweep extension і Docker lanes передрелізу Plugin виключено з CI. Передрелізний Docker-набір запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate валідації релізу.

Ручні запуски використовують унікальну concurrency-групу, тому повний набір для release-candidate не скасовується іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає довіреному виклику змогу запустити цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколів/контрактів/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, aggregate verifiers тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди extension, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі на 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він запускається щодня на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із pinned-релізу та Kova з pinned входу `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova для runtime локальної збірки з детермінованою фальшивою OpenAI-compatible автентифікацією.
- `mock-deep-profile`: профілювання CPU/heap/trace для гарячих точок startup, Gateway і agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає source probes, нативні для OpenClaw, після проходу Kova: вимірювання часу запуску Gateway і пам’яті для випадків запуску default, hook і 50-plugin; повторювані mock-OpenAI цикли привітання `channel-chat-baseline`; і команди запуску CLI для завантаженого Gateway. Markdown-зведення source probe розміщується в `source/index.md` у report bundle, а поруч із ним лежить raw JSON.

Кожна lane завантажує артефакти GitHub. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і артефакти source-probe у `openclaw/clawgrit-reports` під `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний покажчик гілки записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` для артефакту `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane для опублікованого npm-пакета.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating workflow релізу. Запускайте його з `release/YYYY.M.D` або `main` після того, як тег релізу існує і після успішного завершення OpenClaw npm preflight. Він перевіряє `pnpm plugins:sync:check`, запускає `Plugin NPM Release` для всіх публіковних пакетів plugin, запускає `Plugin ClawHub Release` для того самого release SHA і лише потім запускає `OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для підтвердження pinned коміту на швидко змінюваній гілці використовуйте helper замість `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Dispatch refs для GitHub workflow мають бути гілками або тегами, а не raw commit SHA. Helper пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA, запускає `Full Release Validation` із цього pinned ref, перевіряє, що `headSha` кожного child workflow збігається з ціллю, і видаляє тимчасову гілку після завершення запуску. Umbrella verifier також завершується помилкою, якщо будь-який child workflow запускався на іншому SHA.

`release_profile` контролює ширину live/provider, передану в release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка advisory provider/media matrix.

- `minimum` залишає найшвидші критичні для релізу lanes OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ідентифікатори запущених child run, а фінальне завдання `Verify full validation` повторно перевіряє поточні conclusions child run і додає таблиці найповільніших завдань для кожного child run. Якщо child workflow перезапущено і він став green, перезапустіть лише parent verifier job, щоб оновити результат umbrella і зведення timing.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього процесу повного CI, `plugin-prerelease` лише для дочірнього процесу попереднього релізу plugin, `release-checks` для кожного дочірнього процесу релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в umbrella. Це утримує повторний запуск невдалого релізного середовища в обмежених межах після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і в Docker workflow для live/E2E релізного шляху, і в shard приймання пакета. Це зберігає байти пакета узгодженими між релізними середовищами й уникає повторного пакування того самого кандидата в кількох дочірніх jobs.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Батьківський монітор скасовує будь-який дочірній workflow, який він
уже dispatch-нув, коли батьківський процес скасовано, тож новіша валідація main
не очікує за застарілим двогодинним запуском release-check. Валідація release branch/tag
і сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live і E2E shards

Дочірній live/E2E процес релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені shards для audio/video медіа та provider-filtered shards для music

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` лишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють наявність binaries перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs не є правильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live release workflow збирає й публікує цей image один раз, після чого Docker live model, provider-sharded Gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні script-level обмеження `timeout`, нижчі за timeout workflow job, щоб завислий container або cleanup path швидко провалювався, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повний source Docker target, релізний запуск налаштований неправильно й марнуватиме час на дубльовані image builds.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI валідує дерево source, тоді як приймання пакета валідує один tarball через той самий Docker E2E harness, який користувачі використовують після встановлення або оновлення.

### Jobs

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 та profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, валідує inventory tarball, за потреби готує package-digest Docker images і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька targeted `docker_lanes`, reusable workflow готує пакет і спільні images один раз, а потім розгортає ці lanes як паралельні targeted Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав один; standalone dispatch Telegram усе ще може встановити опубліковану npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або опційна Telegram lane зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точну release version OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable.
- `source=ref` пакує довірений branch, tag або повний commit SHA `package_ref`. Resolver отримує branches/tags OpenClaw, перевіряє, що вибраний commit досяжний з історії repository branch або release tag, встановлює deps у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений workflow/harness code, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати старіші довірені source commits без запуску старої workflow logic.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб валідація опублікованого пакета не залежала від доступності live ClawHub. Опційна Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm spec лишається для standalone dispatches.

Щодо спеціальної політики тестування оновлень і plugins, включно з локальними командами,
Docker lanes, inputs Package Acceptance, release defaults і triage збоїв,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає proof для міграції пакета, оновлення, cleanup застарілої plugin dependency, repair встановлення configured-plugin, offline plugin, plugin-update і Telegram на тому самому розв’язаному package tarball. Задайте `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму matrix проти доставленого npm package замість артефакту, зібраного з SHA. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; валідацію package/update product слід починати з Package Acceptance. Docker lane `published-upgrade-survivor` валідує один baseline опублікованого пакета за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Задайте `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен stable npm release від `2026.4.23` до `latest`; `release-history` лишається доступним для ручного ширшого sampling зі старішим pre-date anchor. Задайте `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для Feishu config, збережених bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths і застарілих legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується вичерпного cleanup опублікованих оновлень, а не звичайної ширини Full Release CI. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, тримати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікована lane налаштовує baseline за допомогою вбудованого command recipe `openclaw config set`, записує кроки recipe у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений package може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його задано, інакше `openai/gpt-5.4`, тож install і Gateway proof лишаються на test model GPT-5, уникаючи defaults GPT-4.x.

### Вікна legacy compatibility

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити subcase persistence `gateway install --wrapper`, коли package не expose-ить цей flag;
- `update-channel-switch` може prune missing `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати missing persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати missing marketplace install-record persistence;
- `plugin-update` може дозволяти migration config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior лишалися незмінними.

Опублікований package `2026.4.26` також може попереджати про local build metadata stamp files, які вже були доставлені. Пізніші packages мають задовольняти modern contracts; ті самі умови провалюються замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали смуг, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-смуг замість повторного запуску повної валідації релізу.

## Димовий тест встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він розділяє димове покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які змінюють Docker/пакетні поверхні, зміни пакета/маніфесту вбудованого Plugin або поверхні ядра Plugin/каналу/Gateway/Plugin SDK, які перевіряють завдання Docker smoke. Зміни лише у вихідному коді вбудованого Plugin, зміни лише в тестах і зміни лише в документації не резервують Docker-працівників. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає димовий тест CLI для видалення агентів у спільному робочому просторі, запускає контейнерний gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та запускає обмежений Docker-профіль вбудованого Plugin із 240-секундним сукупним таймаутом команди (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** залишає встановлення QR-пакета та Docker/оновлювальне покриття інсталятора для нічних запланованих запусків, ручних dispatch, release checks через workflow-call і pull request, які справді зачіпають поверхні інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-образ димового тесту кореневого Dockerfile для цільового SHA, а потім запускає встановлення QR-пакета, димові тести кореневого Dockerfile/Gateway, димові тести інсталятора/оновлення та швидкий Docker E2E вбудованого Plugin як окремі завдання, щоб робота інсталятора не чекала за димовими тестами кореневого образу.

Push у `main` (включно з merge commit) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний димовий тест Bun global install для image-provider окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і push у `main` цього не роблять. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний Node/Git runner для смуг інсталятора/оновлення/залежностей Plugin;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних смуг.

Визначення Docker-смуг містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної смуги за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає смуги з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типово  | Призначення                                                                                              |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних смуг.                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу, чутливого до провайдерів.                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live-смуг, щоб провайдери не throttling.                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження одночасних смуг встановлення npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних смуг із кількома сервісами.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами смуг, щоб уникнути сплесків створення в Docker daemon; задайте `0`, щоб вимкнути. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожної смуги (120 хвилин); вибрані live/tail смуги використовують жорсткіші межі. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано | `1` друкує план планувальника без запуску смуг.                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано | Розділений комами точний список смуг; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу смугу. |

Смуга, важча за її ефективний ліміт, усе одно може стартувати з порожнього пулу, а потім виконуватиметься сама, доки не звільнить місткість. Локальна сукупна перевірка preflight перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних смуг, зберігає таймінги смуг для впорядкування від найдовших і типово припиняє планувати нові pooled-смуги після першої помилки.

### Багаторазово використовуваний live/E2E workflow

Багаторазово використовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, смуги та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і підсумки. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує bare/functional GHCR Docker E2E образи з тегами digest пакета через кеш Docker-шарів Blacksmith, коли план потребує смуг зі встановленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий потік registry/cache швидко повторився замість того, щоб спожити більшу частину критичного шляху CI.

### Частини релізного шляху

Релізне Docker-покриття запускає менші розбиті на частини завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожна частина завантажувала лише потрібний їй тип образу та виконувала кілька смуг через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Docker-частини релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними псевдонімами plugin/runtime. Псевдонім смуги `install-e2e` залишається сукупним ручним псевдонімом повторного запуску для обох смуг інсталятора провайдера.

OpenWebUI включається в `plugins-runtime-services`, коли повне покриття release-path цього вимагає, і зберігає окрему частину `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Смуги оновлення вбудованих каналів повторюють спробу один раз у разі тимчасових мережевих помилок npm.

Кожна частина завантажує `.artifacts/docker-tests/` із журналами смуг, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Вхід workflow `docker_lanes` запускає вибрані смуги проти підготовлених образів замість завдань частин, що обмежує налагодження невдалої смуги одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker-смугою, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної смуги включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала смуга могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір release-path.

## Попередній реліз Plugin

`Plugin Prerelease` є дорожчим продуктово-пакетним покриттям, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і окремі ручні dispatch CI тримають цей набір вимкненим. Він балансує тести вбудованих Plugin між вісьмома працівниками розширень; ці shard-завдання розширень запускають до двох груп конфігурацій Plugin одночасно з одним працівником Vitest на групу та більшим heap Node, щоб batch із важкими імпортами Plugin не створювали додаткових CI-завдань. Релізний Docker prerelease шлях batch-ить цільові Docker-смуги в малих групах, щоб не резервувати десятки runner для одно-трихвилинних завдань.

## QA Lab

QA Lab має окремі CI-смуги поза основним smart-scoped workflow. Агентна паритетність вкладена в широкі QA- та релізні harness, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли паритетність має виконуватися разом із широкою валідацією.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгортає mock-смугу паритетності, live Matrix-смугу, а також live Telegram і Discord смуги як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають live transport смуги Matrix і Telegram з детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам’яті, бо QA parity окремо покриває поведінку пам’яті; з’єднання з провайдерами покривають окремі набори live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і ручний вхід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає релізно-критичні смуги QA Lab перед затвердженням релізу; його QA parity gate запускає candidate і baseline packs як паралельні завдання смуг, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння паритетності.

Для звичайних PR покладайтеся на scoped CI/check докази замість того, щоб вважати parity обов’язковим статусом.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним скануванням репозиторію. Щоденні, ручні й захисні запуски для pull request без статусу draft сканують код робочих процесів Actions, а також JavaScript/TypeScript-поверхні найвищого ризику за допомогою високодостовірних запитів безпеки, відфільтрованих до високого/критичного `security-severity`.

Захист pull request лишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму високодостовірну матрицю безпеки, що й запланований робочий процес. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron і базовий рівень gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу, а також runtime Plugin каналу, gateway, Plugin SDK, secrets, точки дотику audit             |
| `/codeql-security-high/network-ssrf-boundary`     | Основні SSRF, IP parsing, network guard, web-fetch і поверхні політики SSRF у Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, outbound delivery і шлюзи виконання інструментів агента                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Встановлення Plugin, loader, manifest, registry, встановлення package-manager, source-loading і поверхні довіри контракту пакета Plugin SDK |

### Платформозалежні фрагменти безпеки

- `CodeQL Android Critical Security` — запланований Android-фрагмент безпеки. Вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner, прийнятому перевіркою workflow sanity. Завантажує результати в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS-фрагмент безпеки. Вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в `/codeql-critical-security/macos`. Тримається поза щоденними стандартними запусками, бо збірка macOS домінує в часі виконання навіть коли проходить чисто.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний фрагмент не для безпеки. Він виконує лише JavaScript/TypeScript-запити якості з error-severity і без security над вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: PR без статусу draft запускають лише відповідні фрагменти `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента й dispatch відповіді, коді schema/migration/IO конфігурації, коді auth/secrets/sandbox/security, runtime основного каналу й bundled channel Plugin, protocol/server-method gateway, runtime пам’яті/SDK glue, MCP/process/outbound delivery, runtime provider/model catalog, session diagnostics/delivery queues, loader Plugin, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни конфігурації CodeQL і quality workflow запускають усі дванадцять PR-фрагментів якості.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є хуками для навчання/ітерації, щоб запускати один фрагмент якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron і код межі безпеки gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Schema конфігурації, migration, normalization і IO-контракти                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema протоколу Gateway і контракти server method                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу й bundled channel Plugin                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, dispatch model/provider, auto-reply dispatch і черги, а також ACP runtime-контракти control plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та tool bridges, помічники нагляду за процесами й контракти outbound delivery                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, aliases memory Plugin SDK, glue активації memory runtime і команди memory doctor                                        |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми reply queue, session delivery queues, помічники outbound session binding/delivery, поверхні diagnostic event/log bundle і CLI-контракти session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і помічники session/thread binding              |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація model catalog, auth і discovery provider, runtime registration provider, defaults/catalogs provider і registries web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, local persistence, control flows gateway і runtime-контракти control plane задач                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні web fetch/search, media IO, media understanding, image-generation і runtime-контракти media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface і контракти entrypoint Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане package-side джерело Plugin SDK і помічники контракту пакета Plugin                                                                                  |

Якість залишається окремою від безпеки, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний час виконання й сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації у відповідності з нещодавно landed змінами. Він не має чистого розкладу: успішний CI-запуск push не від bot на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені після останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від bot на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний activity gate. Лінія створює grouped Vitest performance report для full-suite, дозволяє Codex вносити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline кількість passing tests. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде landed, лінія rebases перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

### Duplicate PRs After Merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land очищення дублікатів. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR merged і що кожен дублікат має або спільну referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна changed-lane логіка міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широка платформа CI:

- зміни core production запускають core prod і core test typecheck, а також core lint/guards;
- зміни лише core test запускають лише core test typecheck і core lint;
- зміни extension production запускають extension prod і extension test typecheck, а також extension lint;
- зміни лише extension test запускають extension test typecheck і extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps лишаються явною test work);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальне changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевше за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests, а також Discord і Slack delivery regressions, щоб зміна shared default зазнала failure до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу новому прогрітому боксу для широкої перевірки. Перш ніж витрачати повільний gate на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині боксу.

Sanity-перевірка швидко завершується з помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте новий замість того, щоб налагоджувати збій продуктового тесту. Для навмисних PR з великою кількістю видалень установіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity-перевірки.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий, керований репозиторієм шлях віддаленого боксу для перевірки Linux, коли Blacksmith недоступний або коли краще використати власні хмарні потужності. Прогрійте бокс, гідратуйте його через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` керує типовими значеннями провайдера, синхронізації та гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних maintainer remotes і сховищ об’єктів, а також виключає локальні runtime/build артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` керує checkout, налаштуванням Node/pnpm, отриманням `origin/main` і передаванням несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` використовують як джерело.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
