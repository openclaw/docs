---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, шлюзи області дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-11T20:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для release candidate і широкої валідації. Лінії Android залишаються opt-in через `include_android`. Покриття plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                       | Коли запускається                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і формує CI manifest                       | Завжди для non-draft pushes і PR          |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                        | Завжди для non-draft pushes і PR          |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                                     | Завжди для non-draft pushes і PR          |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                                                  | Завжди для non-draft pushes і PR          |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для невикористаних файлів                               | Зміни, релевантні Node                    |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки built-artifact і багаторазові downstream artifacts                        | Зміни, релевантні Node                    |
| `checks-fast-core`               | Швидкі Linux correctness lanes, зокрема перевірки bundled/plugin-contract/protocol                                | Зміни, релевантні Node                    |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                                           | Зміни, релевантні Node                    |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes                                   | Зміни, релевантні Node                    |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke                 | Зміни, релевантні Node                    |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і gateway watch                   | Зміни, релевантні Node                    |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                                      | Зміни, релевантні Node                    |
| `checks`                         | Verifier для built-artifact channel tests                                                                         | Зміни, релевантні Node                    |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                                          | Ручний CI dispatch для релізів            |
| `check-docs`                     | Форматування документації, lint і перевірки broken links                                                          | Змінено документацію                      |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                                         | Зміни, релевантні Python skills           |
| `checks-windows`                 | Windows-specific process/path tests плюс regressions shared runtime import specifier                              | Зміни, релевантні Windows                 |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                                                 | Зміни, релевантні macOS                   |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                                           | Зміни, релевантні macOS                   |
| `android`                        | Android unit tests для обох flavors плюс одне debug APK build                                                     | Зміни, релевантні Android                 |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                                                 | Успіх Main CI або manual dispatch         |
| `openclaw-performance`           | Щоденні/on-demand Kova runtime performance reports з mock-provider, deep-profile і GPT 5.4 live lanes             | Scheduled і manual dispatch               |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати одразу після готовності shared build.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як весь workflow уже було витіснено. Автоматичний CI concurrency key має версію (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

Завдання `ci-timings-summary` завантажує компактний artifact `ci-timings-summary` для кожного non-draft CI run. Воно записує wall time, queue time, найповільніші завдання та failed jobs для поточного run, тому CI health checks не потрібно багаторазово сканувати повний Actions payload.

## Область і routing

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** перевіряють Node CI graph плюс workflow linting, але самі по собі не змушують запускати Windows, Android або macOS native builds; ці platform lanes залишаються обмеженими змінами platform source.
- **Редагування лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані так, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted Blacksmith-backed shards зі стандартним GitHub runner fallback, core unit fast/support lanes запускаються окремо, core runtime infra розділено між state, process/config, cron і shared shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділено на chat/auth/model/http-plugin/runtime/startup lanes замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard list розподілений по чотирьох matrix shards, кожен із яких запускає вибрані independent guards одночасно й друкує per-check timings. Дорога Codex happy-path prompt snapshot drift check запускається як окреме additional job для manual CI і лише для prompt-affecting changes, тому звичайні непов’язані Node changes не чекають за cold prompt snapshot generation, а boundary shards залишаються збалансованими, поки prompt drift усе ще прив’язаний до PR, який його спричинив; той самий flag пропускає prompt snapshot Vitest generation усередині built-artifact core support-boundary shard. Gateway watch, channel tests і core support-boundary shard запускаються одночасно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на latest Knip version, з вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings від Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Передавання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує ненадійний pull request code. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch компактні `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів на review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів commit-level review на push у `main`;
- `github_activity` для загальної GitHub activity, яку агент ClawSweeper може inspect.

Лінія `github_activity` передає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони присутні. Вона навмисно уникає передавання повного webhook body. Receiving workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає нормалізовану подію до OpenClaw Gateway hook для агента ClawSweeper.

General activity — це observation, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має писати в `#clawsweeper` лише тоді, коли подія є surprising, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Вважайте заголовки, коментарі, тіла, текст рев’ю, назви гілок і повідомлення комітів GitHub недовіреними даними на всьому цьому шляху. Це вхідні дані для підсумовування та тріажу, а не інструкції для робочого процесу чи середовища виконання агента.

## Ручні запуски

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android scoped lane: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android із `include_android=true`; повна парасолька релізу вмикає Android, передаючи `include_android=true`. Статичні перевірки попереднього релізу Plugin, shard лише для релізу `agentic-plugins`, повний пакетний sweep розширень і Docker lanes попереднього релізу Plugin виключено з CI. Набір Docker prerelease запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну групу concurrency, щоб повний набір release-candidate не було скасовано іншим push або PR запуском на тому самому ref. Необов’язковий вхід `target_ref` дає довіреному виклику змогу запускати цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколів/контрактів/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, шарди `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (достатньо чутливий до CPU, що 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |

CI канонічного репозиторію зберігає Blacksmith як стандартний шлях раннера. Під час `preflight` `scripts/ci-runner-labels.mjs` перевіряє нещодавні queued та in-progress запуски Actions на наявність queued завдань Blacksmith. Якщо для певної мітки Blacksmith уже є queued завдання, downstream-завдання, які використовували б саме цю мітку, повертаються до відповідного GitHub-hosted раннера (`ubuntu-24.04`, `windows-2025` або `macos-latest`) лише для цього запуску. Інші розміри Blacksmith у тій самій родині ОС залишаються на своїх основних мітках. Якщо API probe зазнає невдачі, fallback не застосовується.

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

`OpenClaw Performance` — це workflow продуктивності продукту/середовища виконання. Він щоденно запускається на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай benchmark-ить ref workflow. Установіть `target_ref`, щоб benchmark-ити тег релізу або іншу гілку з поточною реалізацією workflow. Опубліковані шляхи звітів і latest-покажчики прив’язані до протестованого ref, а кожен `index.md` записує протестований ref/SHA, workflow ref/SHA, Kova ref, profile, режим auth lane, модель, кількість повторів і фільтри сценаріїв.

Workflow встановлює OCM із зафіксованого релізу та Kova з `openclaw/Kova` на зафіксованому input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти середовища виконання локальної збірки з детермінованою фейковою OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace профілювання для startup, gateway і hotspots agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає source probes, нативні для OpenClaw, після проходу Kova: timing і memory завантаження Gateway для випадків startup за замовчуванням, з hook і з 50-plugin; повторювані mock-OpenAI цикли hello `channel-chat-baseline`; і команди запуску CLI проти завантаженого Gateway. Markdown-підсумок source probe міститься в `source/index.md` у наборі звіту, поруч із ним розташований raw JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і artifacts source-probe в `openclaw/clawgrit-reports` за шляхом `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний покажчик tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для release-only доказів plugin/package/static/Docker, і запускає `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default запуски тримають exhaustive live/E2E і Docker release-path coverage за `run_release_soak=true`; `release_profile=full` примусово вмикає це soak coverage, щоб широка advisory validation залишалася широкою. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` із release checks. Після публікації передайте `release_package_spec`, щоб повторно використати випущений npm-пакет у release checks, Package Acceptance, Docker, cross-OS і Telegram без повторної збірки. Використовуйте `npm_telegram_package_spec` лише тоді, коли Telegram має довести інший пакет.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей profile, artifacts і
handles для сфокусованих повторних запусків.

`OpenClaw Release Publish` — це ручний mutating workflow релізу. Запускайте його
з `release/YYYY.M.D` або `main` після того, як тег релізу існує, і після того, як
OpenClaw npm preflight завершився успішно. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA, і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для підтвердження закріпленого коміту в гілці, що швидко змінюється, використовуйте допоміжний засіб замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Посилання для запуску GitHub workflow мають бути гілками або тегами, а не необробленими SHA комітів. Допоміжний засіб надсилає тимчасову гілку `release-ci/<sha>-...` на цільовому SHA, запускає `Full Release Validation` з цього закріпленого посилання, перевіряє, що `headSha` кожного дочірнього workflow збігається з цільовим, і видаляє тимчасову гілку після завершення запуску. Парасольковий верифікатор також завершується невдачею, якщо будь-який дочірній workflow виконувався на іншому SHA.

`release_profile` керує широтою live/provider, що передається в перевірки релізу. Ручні релізні workflow типово використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку консультативну матрицю провайдерів/медіа. `run_release_soak` керує тим, чи стабільні/типові перевірки релізу запускають вичерпний live/E2E та Docker soak для релізного шляху; `full` примусово вмикає soak.

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/ядра.
- `stable` додає стабільний набір провайдерів/бекендів.
- `full` запускає широку консультативну матрицю провайдерів/медіа.

Парасольковий workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише батьківське завдання верифікатора, щоб оновити результат парасолькового workflow і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього попереднього релізу Plugin, `release-checks` для кожного дочірнього релізного запуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольковому workflow. Це утримує перезапуск невдалого релізного блока обмеженим після сфокусованого виправлення. Для однієї невдалої cross-OS лінії поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а підсумки packaged-upgrade містять часи за окремими фазами. Лінії QA release-check є консультативними, тому збої лише в QA попереджають, але не блокують верифікатор release-check.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт у cross-OS перевірки та Package Acceptance, а також у Docker workflow live/E2E релізного шляху, коли виконується soak-покриття. Це зберігає байти пакета узгодженими між релізними блоками та уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий workflow. Батьківський монітор скасовує будь-який дочірній workflow, який він уже запустив, коли скасовується батьківський, тому новіша валідація main не стоїть за застарілим двогодинним запуском release-check. Валідація релізних гілок/тегів і сфокусовані групи перезапуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній live/E2E для релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- завдання `native-live-src-gateway-profiles`, відфільтровані за провайдером
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені шарди медіа для аудіо/відео та шарди музики, відфільтровані за провайдером

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв живих провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні живі медіашарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіазавдання лише перевіряють наявність бінарних файлів перед налаштуванням. Тримайте живі набори тестів на базі Docker на звичайних раннерах Blacksmith — контейнерні завдання є неправильним місцем для запуску вкладених Docker-тестів.

Живі шарди моделей/бекендів на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow живого релізу збирає й публікує цей образ один раз, після чого живі Docker-шарди моделей, Gateway із шардуванням за провайдерами, CLI-бекенд, ACP bind і шарди Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів, нижчі за таймаут завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не витрачав увесь бюджет перевірки релізу. Якщо ці шарди самостійно перебудовують повну Docker-ціль джерельного коду, запуск релізу налаштований неправильно й марнуватиме фактичний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево джерельного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі використовують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` із `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи з дайджестом пакета й запускає вибрані Docker-лінії проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли приймання пакета визначило один; автономний dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow помилкою, якщо визначення пакета, Docker-приймання або опційна лінія Telegram зазнали збою.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну релізну версію OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих попередніх/стабільних релізів.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його варто надати для артефактів, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старіші довірені коміти джерельного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти релізного шляху Docker з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugin, щоб перевірка опублікованого пакета не залежала від доступності живого ClawHub. Опційна лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних dispatch.

Щодо спеціальної політики тестування оновлень і plugin, включно з локальними командами,
Docker-лініями, вхідними даними приймання пакета, стандартними параметрами релізу й triage збоїв,
див. [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Перевірки релізу викликають Package Acceptance із `source=artifact`, підготовленим артефактом пакета релізу, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це тримає міграцію пакета, оновлення, живе встановлення skill ClawHub, очищення залежностей застарілого Plugin, відновлення встановлення налаштованого Plugin, offline plugin, plugin-update і доказ Telegram на тому самому розв’язаному tarball пакета. Установіть `release_package_spec` у Full Release Validation або OpenClaw Release Checks після публікації beta, щоб запустити ту саму матрицю для доставленого npm-пакета без повторного збирання; установлюйте `package_acceptance_package_spec` лише тоді, коли Package Acceptance потребує іншого пакета, ніж решта валідації релізу. Крос-ОС перевірки релізу й далі покривають ОС-специфічне onboarding, installer і поведінку платформи; продуктову валідацію package/update слід починати з Package Acceptance. Docker-лінія `published-upgrade-survivor` перевіряє один опублікований базовий пакет за запуск у блокувальному шляху релізу. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` задає `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити покриття на чотири найновіші stable npm-релізи плюс закріплені релізи межі сумісності Plugin і issue-подібні фікстури для конфігурації Feishu, збережених файлів bootstrap/persona, встановлень налаштованого OpenClaw Plugin, шляхів журналів із tilde та застарілих коренів залежностей legacy Plugin. Вибірки multi-baseline published-upgrade survivor шардуються за baseline в окремі цільові завдання Docker runner. Окремий workflow `Update Migration` використовує Docker-лінію `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній ширині Full Release CI. Локальні aggregate-запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну лінію з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована лінія налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Windows packaged і installer fresh лінії також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control з сирого абсолютного шляху Windows. Cross-OS agent-turn smoke OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його задано, інакше `openai/gpt-5.4`, тож доказ install і gateway лишається на тестовій моделі GPT-5, уникаючи стандартних значень GPT-4.x.

### Вікна сумісності legacy

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі private QA записи в `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні pnpm `patchedDependencies` із fake git fixture, похідної від tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy розташування install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка no-reinstall лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли stamp metadata збірки, які вже були доставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, phase timings і команди повторного запуску. Віддавайте перевагу повторному запуску failed package profile або точних Docker lanes замість повторного запуску повної валідації релізу.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що зачіпають поверхні Docker/package, зміни пакета/manifest вбудованого Plugin або поверхні core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише source у вбудованому Plugin, edits лише тестів і docs-only edits не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg вбудованого extension і запускає обмежений Docker profile вбудованого Plugin під 240-секундним aggregate command timeout (Docker run кожного сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для nightly scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав за root image smokes.

Пуші в `main` (зокрема merge commits) не примушують full path; коли changed-scope logic запитувала б full coverage на push, workflow лишає fast Docker smoke, а full install smoke залишає nightly або release validation.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за nightly schedule і з release checks workflow, а manual dispatches `Install Smoke` можуть увімкнути його, але pull requests і пуші в `main` не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker lane розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає image для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштовувані параметри

| Змінна                                | За замовчуванням | Призначення                                                                                   |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних lanes.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів provider-sensitive tail-pool.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live lane, щоб providers не throttled.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних npm install lane.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service lane.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lane, щоб уникнути Docker daemon create storms; задайте `0`, щоб вимкнути. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Fallback timeout для кожної lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує scheduler plan без запуску lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Список exact lane через кому; пропускає cleanup smoke, щоб agents могли відтворити одну failed lane. |

Lane, важча за свій effective cap, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Локальний aggregate попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E containers, виводить статус active-lane, зберігає lane timings для longest-first ordering і за замовчуванням припиняє планувати нові pooled lanes після першого failure.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credential потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє tarball inventory; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторного збирання. Пули Docker image повторюються з обмеженим 180-секундним timeout на спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшу частину критичного шляху CI.

### Чанки release-path

Release Docker coverage виконує менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами Plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох ліній інсталятора провайдера.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття release-path цього вимагає, і зберігає окремий фрагмент `openwebui` лише для диспетчеризацій, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід `docker_lanes` workflow запускає вибрані лінії проти підготовлених образів замість завдань фрагментів, що обмежує налагодження збійної лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб збійна лінія могла повторно використати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір release-path.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який диспетчеризується `Full Release Validation` або явним оператором. Звичайні pull request, push до `main` і самостійні ручні диспетчеризації CI не вмикають цей набір. Він балансує тести bundled plugin між вісьмома extension-воркерами; ці завдання extension shard запускають до двох груп конфігурації plugin одночасно з одним Vitest-воркером на групу і більшим Node heap, щоб import-heavy пакети plugin не створювали додаткових CI-завдань. Docker-шлях передрелізу лише для релізу групує цільові Docker-лінії невеликими групами, щоб не резервувати десятки раннерів для завдань тривалістю від однієї до трьох хвилин. Workflow також завантажує інформаційний артефакт `plugin-inspector-advisory` з `@openclaw/plugin-inspector`; висновки інспектора є вхідними даними для triage і не змінюють блокувальний gate Plugin Prerelease.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow. Агентна parity вкладена в широкі QA та release harnesses, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким validation-запуском.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручної диспетчеризації; він розгортає mock parity-лінію, live Matrix-лінію та live Telegram і Discord-лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Релізні перевірки запускають live transport-лінії Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук у пам’яті, тому що QA parity покриває поведінку пам’яті окремо; connectivity провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Стандарт CLI і вхід ручного workflow залишаються `all`; ручна диспетчеризація `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу лінії QA Lab перед схваленням релізу; його QA parity gate запускає candidate і baseline pack як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов’язковим статусом.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та non-draft pull request guard-запуски сканують код Actions workflow плюс найбільш ризикові JavaScript/TypeScript-поверхні з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базова поверхня auth, secrets, sandbox, cron і Gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс runtime channel plugin, Gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні SSRF policy Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, process execution helpers, outbound delivery і agent tool-execution gates                                               |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust-поверхні контракту пакета Plugin SDK    |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, фільтрує результати dependency build з uploaded SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза щоденними defaults, тому що macOS build домінує runtime навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за запланований profile: non-draft PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді agent command/model/tool execution і reply dispatch, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, Gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`          | Код межі безпеки автентифікації, секретів, пісочниці, cron і gateway                                                                                                                 |
| `/codeql-critical-quality/config-boundary`            | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`   | Схеми протоколу Gateway і контракти методів сервера                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`   | Контракти реалізації основного каналу та вбудованого плагіна каналу                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`     | Виконання команд, диспетчеризація моделі/провайдера, диспетчеризація та черги автовідповідей, а також runtime-контракти керувальної площини ACP                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`    | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми SDK плагіна пам’яті, зв’язувальний код активації runtime пам’яті та команди memory doctor                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня реалізація черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні подій діагностики/пакетів журналів і CLI-контракти session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`   | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сеансів/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`  | Нормалізація каталогу моделей, автентифікація та виявлення провайдера, реєстрація runtime провайдера, стандартні значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`           | Початкове завантаження UI керування, локальна персистентність, потоки керування gateway і runtime-контракти керувальної площини завдань                                             |
| `/codeql-critical-quality/web-media-runtime-boundary` | Runtime-контракти основних web fetch/search, media IO, розуміння медіа, генерування зображень і генерування медіа                                                                    |
| `/codeql-critical-quality/plugin-boundary`            | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опублікований вихідний код Plugin SDK на боці пакета та допоміжні засоби контрактів пакетів плагінів                                                                                 |

Якість лишається відокремленою від безпеки, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих плагінів слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Агент документації

Робочий процес `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання відповідності наявної документації нещодавно змердженим змінам. Він не має чистого розкладу: успішний CI-запуск push небота на `main` може його запускати, а ручний dispatch може запускати його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push небота на `main` може його запускати, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується в цей UTC-день. Ручний dispatch обходить цей щоденний gate активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість тестів, які проходять. Якщо базова лінія має failing тести, Codex може виправляти лише очевидні failures, а звіт повного набору після агента має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде landed, лінія ребейзить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберегти таку саму drop-sudo safety posture, як агент документації.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land очищення дублікатів. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR змерджений і що кожен duplicate має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна changed-lane логіка міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI:

- production-зміни core запускають typecheck core prod і core test, а також core lint/guards;
- test-only зміни core запускають лише typecheck core test плюс core lint;
- production-зміни extensions запускають typecheck extension prod і extension test плюс extension lint;
- test-only зміни extensions запускають typecheck extension test плюс extension lint;
- публічні зміни Plugin SDK або plugin-contract розширюються до typecheck extensions, бо extensions залежать від цих core-контрактів (Vitest extension sweeps лишаються явною тестовою роботою);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі root/config зміни fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі редагування тестів запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests та import-graph dependents. Shared group-room delivery config — одна з explicit mappings: зміни до group visible-reply config, source reply delivery mode або system prompt message-tool проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Crabbox — це repo-owned remote-box wrapper для maintainer Linux proof. Використовуйте його
з кореня репозиторію, коли check надто широкий для локального edit loop, коли важлива
CI parity або коли proof потребує secrets, Docker, package lanes,
reusable boxes чи remote logs. Звичайний backend OpenClaw —
`blacksmith-testbox`; owned AWS/Hetzner capacity є fallback для Blacksmith
outages, quota issues або явного owned-capacity testing.

Crabbox-backed Blacksmith runs виконують warm, claim, sync, run, report і clean up
one-shot Testboxes. Вбудований sync sanity check швидко падає, коли обов’язкові
root files, як-от `pnpm-lock.yaml`, зникають або коли `git status --short`
показує щонайменше 200 tracked deletions. Для навмисних PR з великими deletions задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для remote command.

Crabbox також завершує локальний виклик Blacksmith CLI, який залишається у
sync phase понад п’ять хвилин без post-sync output. Задайте
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diffs.

Перед першим запуском перевірте wrapper з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo wrapper відмовляється від застарілого Crabbox binary, який не рекламує `blacksmith-testbox`. Передавайте provider явно, навіть попри те, що `.crabbox.yaml` має owned-cloud defaults.

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

Focused test rerun:

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

Full suite:

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

Читайте фінальний JSON summary. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. One-shot Blacksmith-backed Crabbox runs мають автоматично зупиняти Testbox; якщо запуск перервано або cleanup неясний, перегляньте live boxes і зупиніть лише boxes, які ви створили:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте reuse лише тоді, коли навмисно потрібні кілька команд на тій самій hydrated box:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо Crabbox є broken layer, але сам Blacksmith працює, використовуйте direct
Blacksmith лише для діагностики, як-от `list`, `status` і cleanup. Виправте
Crabbox path, перш ніж вважати direct Blacksmith run maintainer proof.

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmups залишаються `queued` без IP або Actions run URL за кілька хвилин,
розглядайте це як provider, queue, billing або org-limit pressure Blacksmith. Зупиніть
queued ids, які ви створили, уникайте запуску додаткових Testboxes і перенесіть proof на
owned Crabbox capacity path нижче, поки хтось перевіряє Blacksmith dashboard,
billing і org limits.

Ескалуйте до owned Crabbox capacity лише тоді, коли Blacksmith не працює, обмежений quota, не має потрібного середовища або owned capacity явно є метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Під навантаженням AWS уникайте `class=beast`, якщо завданню справді не потрібен CPU класу 48xlarge. Запит `beast` починається зі 192 vCPU і є найпростішим способом упертися в регіональну квоту EC2 Spot або On-Demand Standard. Належний репозиторію `.crabbox.yaml` за замовчуванням використовує `standard`, кілька регіонів місткості та `capacity.hints: true`, щоб оренди AWS через брокер виводили вибрані регіон/ринок, тиск на квоту, резервний перехід на Spot і попередження про класи з високим тиском. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast виявляться недостатніми, а `beast` лише для виняткових CPU-залежних ліній, таких як повні набори тестів або Docker-матриці для всіх Plugin, явна валідація релізу/блокера чи профілювання продуктивності з великою кількістю ядер. Не використовуйте `beast` для `pnpm check:changed`, сфокусованих тестів, роботи лише з документацією, звичайного lint/typecheck, невеликих E2E-відтворень або тріажу збою Blacksmith. Використовуйте `--market on-demand` для діагностики місткості, щоб коливання ринку Spot не змішувалося із сигналом.

`.crabbox.yaml` визначає стандартні значення для provider, sync і hydration GitHub Actions для ліній owned-cloud. Він виключає локальний `.git`, щоб checkout у hydrated Actions зберігав власні віддалені метадані Git замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища для команд owned-cloud `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
