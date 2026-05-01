---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося чи не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка завершується невдачею
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, межі області дії, парасольки випусків і локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-01T20:49:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7bd0c3eca0730b9121cb7971f46924451b0377515fd326352f72499c37103bd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише неповʼязані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для release candidate і широкої валідації. Android-лінії лишаються opt-in через `include_android`. Покриття плагінів лише для релізу міститься в окремому workflow [`Передреліз Plugin`](#plugin-prerelease) і запускається лише з [`Повної релізної валідації`](#full-release-validation) або через явний ручний dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені розширення та будує CI manifest          | Завжди на non-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди на non-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди на non-draft push і PR      |
| `security-fast`                  | Обовʼязковий aggregate для швидких security-завдань                                          | Завжди на non-draft push і PR      |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів              | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і багаторазові downstream artifacts     | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки контрактів каналів зі стабільним aggregate check result                    | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, окрім channel, bundled, contract і extension ліній                   | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node     |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести built-CLI і smoke startup-memory                                                 | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-лінія                                                    | Ручний CI dispatch для релізів     |
| `check-docs`                     | Перевірки форматування docs, lint і broken-link                                              | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Зміни, релевантні для Python skills |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс спільні регресії runtime import specifier     | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія macOS TypeScript тестів із використанням спільних built artifacts                      | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                            | Успіх Main CI або manual dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream consumers могли стартувати щойно спільна збірка готова.
4. Після цього розгортаються важчі platform і runtime лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Сприймайте це як шум CI, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Automatic CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** валідовують Node CI graph плюс workflow linting, але самі собою не примушують Windows, Android або macOS native builds; ці platform lanes лишаються scoped до змін platform source.
- **Редагування лише маршрутизації CI, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю лінію; неповʼязані source, plugin, install-smoke і test-only changes лишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані так, щоб кожне завдання лишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes обʼєднані парами, auto-reply запускається як чотири збалансовані workers (з reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, водночас уникаючи дублювання debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим minimum release age pnpm для `dlx` install) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або лишає stale allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розвʼязати.

## Ручні dispatches

Manual CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Необовʼязковий input `target_ref` дає trusted caller змогу запускати цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/пакетних компонентів, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів пакетних plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

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
```

## Повна валідація релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати після публікації workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

Див. [повну валідацію релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
точкових дескрипторів повторного запуску.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні
release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку advisory-матрицю provider/media.

- `minimum` зберігає найшвидші критичні для релізу OpenAI/core lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory-матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного дочірнього release або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує повторний запуск невдалого release box у межах після точкового виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в Docker workflow release-path live/E2E, і в shard package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дубльовані run `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський скасовано, тому новіша валідація main
не стоїть за застарілим двогодинним release-check run. Валідація release branch/tag
і точкові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- відфільтровані за provider завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені шарди media audio/video та відфільтровані за provider музичні шарди

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних live-збоїв provider. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні шарди live media запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори з Docker на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей image один раз, після чого Docker live model, provider-sharded Gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні обмеження `timeout` на рівні script нижче за timeout workflow job, щоб завислий container або cleanup path швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, release run неправильно налаштований і марнуватиме wall clock на дубльовані збірки image.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує source tree, тоді як package acceptance валідує один tarball через той самий Docker E2E harness, який користувачі виконують після встановлення або оновлення.

### Завдання

1. `resolve_package` перевіряє `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у зведенні кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи з дайджестом пакета й запускає вибрані Docker-доріжки для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгортає ці доріжки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; окремий Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо не вдалося визначити пакет, пройти Docker acceptance або необов’язкову Telegram-доріжку.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для перевірки опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний commit SHA з `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або тега релізу, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто вказувати для артефактів, що поширюються зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового harness, який запускає тест. `package_ref` — це коміт джерела, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старі довірені коміти джерела без запуску старої логіки workflow.

### Профілі набору

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує покриття офлайн-Plugin, щоб перевірка опублікованого пакета не залежала від доступності живого ClawHub. Необов’язкова Telegram-доріжка повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих dispatch.

Перевірки релізу викликають Package Acceptance із `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Docker-фрагменти release-path покривають перехресні доріжки package/update/plugin; Package Acceptance зберігає офлайн-докази для Plugin, update і Telegram на тому самому визначеному package tarball. Cross-OS перевірки релізу все ще покривають специфічну для ОС поведінку onboarding, installer і platform; перевірку продукту package/update слід починати з Package Acceptance. Docker-доріжка `published-upgrade-survivor` перевіряє одну опубліковану базову лінію пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опубліковану базову лінію, за замовчуванням `openclaw@latest`; команди повторного запуску невдалих доріжок зберігають цю базову лінію. Встановіть `published_upgrade_survivor_baselines=release-history`, щоб розширити доріжку до дедуплікованої матриці історії: шість останніх стабільних релізів, `2026.4.23` і останній стабільний реліз до `2026-03-15`. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі базові лінії на issue-подібні fixture для конфігурації Feishu, збережених bootstrap/persona-файлів, шляхів журналів із тильдою та застарілих коренів залежностей legacy Plugin. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну доріжку з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована доріжка налаштовує базову лінію за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Свіжі доріжки Windows packaged та installer також перевіряють, що встановлений пакет може імпортувати browser-control override із raw абсолютного шляху Windows. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його встановлено, інакше `openai/gpt-5.5`, тож докази install і gateway лишаються на бажаній тестовій моделі GPT-5.

### Вікна сумісності з legacy

Package Acceptance має обмежені вікна сумісності з legacy для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з tarball-похідного фальшивого git fixture і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy-розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без перевстановлення лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли штампів метаданих локальної збірки, які вже були випущені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови призводять до помилки, а не попередження чи пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали доріжок, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-доріжок замість повторного запуску повної перевірки релізу.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що торкаються Docker/package-поверхонь, змін package/manifest для bundled Plugin або core plugin/channel/gateway/Plugin SDK-поверхонь, які перевіряють Docker smoke jobs. Зміни лише в джерелі bundled Plugin, тестові правки та правки лише документації не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin під 240-секундним загальним таймаутом команди (кожен Docker-запуск сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR package та installer Docker/update-покриття для нічних запланованих запусків, ручних dispatch, workflow-call перевірок релізу й pull request, які справді торкаються installer/package/Docker-поверхонь. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота installer не чекала за root image smokes.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли логіка changed-scope запитувала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `Install Smoke` можуть його ввімкнути, але pull request і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfile.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для доріжок installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних доріжок.

Визначення Docker-доріжок містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної доріжки за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | За замовчуванням | Призначення                                                                                                          |
| -------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10               | Кількість слотів основного пулу для звичайних ліній.                                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10               | Кількість слотів хвостового пулу, чутливого до провайдера.                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10               | Обмеження одночасних ліній встановлення npm.                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                | Обмеження одночасних багатосервісних ліній.                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000             | Затримка між стартами ліній, щоб уникнути хвиль створення в Docker daemon; встановіть `0`, щоб вимкнути затримку.    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000          | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/хвостові лінії використовують жорсткіші обмеження.   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не встановлено   | `1` друкує план планувальника без запуску ліній.                                                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | не встановлено   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію.      |

Лінія, важча за своє ефективне обмеження, все одно може стартувати з порожнього пулу, а потім виконуватися самостійно, доки не звільнить місткість. Локальний aggregate виконує попередні перевірки Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших до найкоротших і за замовчуванням припиняє планувати нові pooled-лінії після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, типу image, live image, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт package з поточного запуску, або завантажує артефакт package з `package_artifact_run_id`; перевіряє inventory tarball; збирає та публікує tagged за package-digest bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні лінії з установленим package; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker image повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип image і виконував кілька ліній через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate aliases Plugin/runtime. Псевдонім лінії `install-e2e` залишається aggregate manual rerun alias для обох ліній встановлювачів провайдерів.

OpenWebUI включається в `plugins-runtime-services`, коли це запитує повне release-path coverage, і зберігає окремий chunk `openwebui` лише для dispatches, що стосуються тільки OpenWebUI. Bundled-channel update lanes повторюють спробу один раз у разі тимчасових мережевих помилок npm.

Кожен chunk завантажує `.artifacts/docker-tests/` з logs ліній, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених images замість chunk jobs, що утримує налагодження невдалої лінії в межах одного targeted Docker job і готує, завантажує або повторно використовує артефакт package для цього запуску; якщо вибрана лінія є live Docker lane, targeted job локально збирає live-test image для цього повторного запуску. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб невдала лінія могла повторно використати точний package та images з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker artifacts і надрукувати combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # summaries slow-lane і phase critical-path
```

Scheduled live/E2E workflow щодня запускає повний release-path Docker suite.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, pushes у `main` і standalone manual CI dispatches тримають цей suite вимкненим. Він балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy plugin batches не створювали додаткових CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у малі групи, щоб не резервувати десятки runners для завдань на одну-три хвилини.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних PR changes і manual dispatch; він збирає private QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як parallel jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає memory search, оскільки QA parity окремо покриває поведінку memory; provider connectivity покривається окремими suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Значення CLI за замовчуванням і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди ділить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для release лінії QA Lab перед release approval; його QA parity gate запускає candidate і baseline packs як parallel lane jobs, а потім завантажує обидва артефакти в малий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна справді не торкається QA runtime, model-pack parity або surface, якою володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test розглядайте це як optional signal і натомість дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним repository sweep. Daily, manual і non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript surfaces з найвищим ризиком за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                  |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і Plugin SDK SSRF policy surfaces                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і Plugin SDK package contract trust surfaces    |

### Platform-specific security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Утримується поза daily defaults, оскільки macOS build домінує над часом виконання навіть за чистого стану.

### Critical Quality categories

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для agent command/model/tool execution і reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime changes. CodeQL config і quality workflow changes запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`          | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                             |
| `/codeql-critical-quality/config-boundary`            | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`   | Схеми протоколу Gateway і контракти серверних методів                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`   | Контракти реалізації основного каналу та вбудованого channel plugin                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`     | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація автовідповідей і черги, а також runtime-контракти контрольної площини ACP                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`    | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми SDK пам’яті Plugin, зв’язувальний код активації runtime пам’яті та команди doctor пам’яті                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня реалізація черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів логів і контракти CLI doctor сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`   | Вхідна диспетчеризація відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`  | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, реєстрація runtime провайдерів, типові налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`           | Bootstrap Control UI, локальна персистентність, потоки керування Gateway та runtime-контракти контрольної площини завдань                                        |
| `/codeql-critical-quality/web-media-runtime-boundary` | Runtime-контракти основного web fetch/search, media IO, розуміння медіа, image-generation і media-generation                                                     |
| `/codeql-critical-quality/plugin-boundary`            | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опублікований package-side вихідний код Plugin SDK і допоміжні засоби контрактів пакетів plugin                                                                  |

Якість лишається окремою від безпеки, щоб висновки щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід повертати лише як scoped або sharded подальшу роботу після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована lane обслуговування Codex для підтримання наявної документації узгодженою з нещодавно landed змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший non-skipped запуск Docs Agent було створено протягом останньої години. Коли він запускається, то переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована lane обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний activity gate. Lane будує full-suite grouped звіт продуктивності Vitest, дозволяє Codex робити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite звіт і відхиляє зміни, які зменшують базову кількість passing тестів. Якщо baseline має failing тести, Codex може виправляти лише очевидні failures, а after-agent full-suite звіт має пройти перед тим, як щось буде закомічено. Коли `main` просувається до того, як bot push буде landed, lane перебазовує validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex міг зберігати таку саму drop-sudo safety posture, як docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це manual maintainer workflow для cleanup дублікатів після landing. Типово він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільну referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка platform scope CI:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають тільки core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються explicit test work);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі root/config зміни fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу explicit mappings, потім sibling tests та import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default зафейлилася до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня repo й віддавайте перевагу свіжій warmed box для broad proof. Перед тим як витрачати повільний gate на box, що була reused, expired або щойно повідомила про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко fails, коли required root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є trustworthy copy PR; зупиніть цю box і warm свіжу замість debugging product test failure. Для intentional large-deletion PR встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний invocation Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

Crabbox — це repo-owned другий remote-box path для Linux proof, коли Blacksmith недоступний або коли owned cloud capacity краща. Warm box, hydrate її через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` володіє provider, sync і GitHub Actions hydration defaults. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає local runtime/build artifacts, які ніколи не мають передаватися. `.github/workflows/crabbox-hydrate.yml` володіє checkout, Node/pnpm setup, `origin/main` fetch і non-secret environment handoff, який подальші команди `crabbox run --id <cbx_id>` source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
