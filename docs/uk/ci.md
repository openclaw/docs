---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, гейти за областю дії, парасолькові релізні перевірки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-01T23:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3aeba9260d2eb6b65f1775d457f3dd7c5470ba628e9234409e3a8483a453b48
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається на кожному push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає витратні lanes, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття Plugin лише для релізу розміщене в окремому workflow [`Plugin передвипуск`](#plugin-prerelease) і запускається лише з [`Повна валідація релізу`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені extensions і будує CI manifest           | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Production-аудит lockfile без dependencies за npm advisories                                 | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий агрегат для швидких security jobs                                               | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production-прохід Knip лише для dependencies плюс guard allowlist невикористаних файлів      | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built artifacts і reusable downstream artifacts        | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                      | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                     | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node     |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke tests зібраного CLI і startup-memory smoke                                             | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke lane                                                     | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken links                                             | Змінено docs                       |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows process/path tests плюс спільні regressions runtime import specifier  | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane із використанням спільних built artifacts                         | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                            | Успішний main CI або ручний dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безкінечно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують runs, що вже виконуються.

## Область і routing

Логіка області розміщена в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** валідують граф Node CI плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються прив’язаними до змін platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixtures і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність із Node 22, channel contracts, повні core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** обмежені специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і поверхнями CI workflow, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднані парами, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з прапорцями SMS/call-log BuildConfig, водночас уникаючи дублювання debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для dependencies, закріплений на найновішій версії Knip, із вимкненим мінімальним віком release для pnpm під час `dlx` install) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може розв’язати статично.

## Ручні dispatches

Ручні CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Окремі ручні CI dispatches запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` із увімкненим release-validation gate.

Ручні runs використовують унікальну concurrency group, щоб release-candidate full suite не було скасовано іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу trusted caller запустити цей граф для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контракту/вбудованих компонентів, сегментовані перевірки контрактів каналів, сегменти `check`, крім lint, сегменти й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші сегменти Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, сегменти тестів Linux Node, сегменти тестів вбудованих plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32 vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                         |

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

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних доказів plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram-ліній. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти артефакту `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму лінію пакета Telegram проти опублікованого npm-пакета.

Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
точкових ідентифікаторів повторного запуску.

`release_profile` керує шириною live/provider, переданою в release checks. Ручні release workflows типово використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка advisory-матриця provider/media.

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory-матрицю provider/media.

Парасольковий workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапустили й він став зеленим, перезапустіть лише батьківське завдання-верифікатор, щоб оновити результат парасолькового workflow і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного release child або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольковому workflow. Це утримує повторний запуск невдалого release box у межах після точкового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E release-path Docker workflow, і в сегмент package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий workflow. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський скасовано, тому новіша перевірка main
не стоїть за застарілим двогодинним запуском release-check. Перевірка гілки/тега релізу
і точкові групи повторного запуску залишають `cancel-in-progress: false`.

## Live та E2E-сегменти

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані сегменти через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені сегменти media audio/video і provider-filtered music segments

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних live-збоїв provider. Агреговані назви сегментів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media segments працюють у `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає та пушить цей образ, а потім сегменти Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці сегменти незалежно перебудовують повну source Docker target, release run налаштовано неправильно, і він марнуватиме час на дубльовані збірки образів.

## Прийняття пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, ref workflow, ref пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи з дайджестом пакета й запускає вибрані Docker-лінії проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance визначив його; автономний запуск Telegram все ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або опціональна лінія Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний commit SHA. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або release tag, встановлює залежності в від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опціональний, але його варто вказувати для артефактів, якими діляться зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старі довірені source commits без запуску старої логіки workflow.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти release path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття Plugin, щоб перевірка опублікованого пакета не залежала від live-доступності ClawHub. Опціональна лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації лишається для автономних запусків.

Щодо спеціальної політики тестування оновлень і Plugin, включно з локальними командами,
Docker-лініями, входами Package Acceptance, типовими параметрами релізу та triage помилок,
див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає перевірки міграції пакета, оновлення, очищення застарілих Plugin-залежностей, offline Plugin, plugin-update і Telegram на тому самому визначеному tarball пакета. Cross-OS release checks все ще покривають OS-специфічні onboarding, installer і поведінку платформи; product-перевірку package/update слід починати з Package Acceptance. Docker-лінія `published-upgrade-survivor` перевіряє одну опубліковану базову версію пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опубліковану базову версію, типово `openclaw@latest`; команди повторного запуску failed lane зберігають цю базову версію. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розгорнути лінію по deduped матриці історії: останні шість stable releases, `2026.4.23` і останній stable release перед `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розгорнути ті самі базові версії по issue-подібних fixtures для конфігурації Feishu, збережених bootstrap/persona файлів, tilde шляхів логів і застарілих legacy коренів Plugin-залежностей. Окремий workflow `Update Migration` використовує Docker-лінію `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній ширині Full Release CI. Локальні aggregate-запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну лінію з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована лінія налаштовує базову версію за допомогою baked recipe команди `openclaw config set`, записує кроки recipe у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh лінії також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. Cross-OS agent-turn smoke для OpenAI типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його задано, інакше `openai/gpt-5.5`, тому proof встановлення й Gateway лишається на бажаній тестовій моделі GPT-5.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей flag;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній persist `update.channel`;
- plugin smokes можуть читати legacy locations install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволити міграцію config metadata, водночас все ще вимагаючи, щоб install record і поведінка no-reinstall лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні stamp files build metadata, які вже були shipped. Пізніші пакети мають задовольняти сучасні contracts; ті самі умови завершуються failure, а не warn або skip.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, phase timings і команди повторного запуску. Надавайте перевагу повторному запуску failed package profile або точних Docker-ліній замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package surfaces, змін bundled plugin package/manifest або core plugin/channel/gateway/Plugin SDK surfaces, які виконують Docker smoke jobs. Зміни лише source у bundled plugin, test-only edits і docs-only edits не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає bounded bundled-plugin Docker profile у межах aggregate command timeout 240 секунд (Docker-запуск кожного сценарію обмежений окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекала за root image smokes.

`main` pushes (зокрема merge commits) не примушують full path; коли changed-scope logic запитала б full coverage на push, workflow залишає fast Docker smoke, а full install smoke лишає нічній або release validation.

Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`. Він запускається за nightly schedule і з release checks workflow, а manual dispatches `Install Smoke` можуть увімкнути його, але pull requests і `main` pushes — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker-ліній розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної лінії через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типово  | Призначення                                                                                              |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу, чутливого до провайдерів.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження одночасних ліній встановлення npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних багатосервісних ліній.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути сплесків створення в Docker daemon; задайте `0`, щоб вимкнути. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожної лінії (120 хвилин); вибрані live/tail-лінії використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску ліній.                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Точний список ліній через кому; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальний агрегатор попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E-контейнери, виводить статус активних ліній, зберігає тривалості ліній для впорядкування від найдовших до найкоротших і типово припиняє планувати нові pooled-лінії після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і підсумки. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує GHCR Docker E2E-образи bare/functional із тегами за digest пакета через кеш Docker-шарів Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи за digest пакета замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшість критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох ліній installer провайдерів.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage цього потребує, і зберігає окремий chunk `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз для тимчасових мережевих помилок npm.

Кожен chunk завантажує `.artifacts/docker-tests/` з журналами ліній, тривалостями, `summary.json`, `failures.json`, тривалостями фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує налагодження невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker lane, цільовий job локально збирає live-test image для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної лінії включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли такі значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти й надрукувати combined/per-lane цільові команди повторного запуску
pnpm test:docker:timings <summary>   # підсумки повільних ліній і критичного шляху фаз
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається через `Full Release Validation` або явним оператором. Звичайні pull requests, push у `main` і окремі manual CI dispatches не запускають цей suite. Він балансує тести bundled plugin між вісьмома extension workers; ці jobs шард extension запускають до двох груп конфігурації plugin одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy пакети plugin не створювали додаткових CI jobs. Release-only Docker prerelease path групує цільові Docker lanes невеликими наборами, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має dedicated CI lanes поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і manual dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від latency live model і звичайного startup provider-plugin. Live transport gateway вимикає memory search, тому що QA parity окремо покриває поведінку пам’яті; provider connectivity покривається окремими suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і manual workflow input залишаються `all`; manual `matrix_profile=all` dispatch завжди шардує повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, потім завантажує обидва артефакти в невеликий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, model-pack parity або surface, яким володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-test розглядайте це як optional signal і натомість спирайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним repository sweep. Daily, manual і non-draft pull request guard runs сканують код Actions workflow плюс найризикованіші JavaScript/TypeScript surfaces з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard лишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять у PR defaults.

### Категорії безпеки

| Категорія                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і baseline gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і surfaces політики SSRF Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і gates agent tool-execution                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust surfaces контракту пакета Plugin SDK    |

### Platform-specific security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза daily defaults, тому що macOS build домінує runtime навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді agent command/model/tool execution і reply dispatch, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є teaching/iteration hooks для запуску одного quality shard в ізоляції.

| Категорія                                             | Поверхня                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`          | Auth, секрети, sandbox, Cron і код межі безпеки Gateway                                                                                                              |
| `/codeql-critical-quality/config-boundary`            | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`   | Схеми протоколу Gateway і контракти серверних методів                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`   | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`     | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автовідповідей, а також runtime-контракти площини керування ACP                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`    | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми Plugin SDK для пам’яті, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`   | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/фрагментації/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`  | Нормалізація каталогу моделей, auth і виявлення провайдерів, реєстрація runtime провайдерів, стандартні налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`           | Початкове завантаження Control UI, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                    |
| `/codeql-critical-quality/web-media-runtime-boundary` | Контракти runtime для основних web fetch/search, медіа IO, розуміння медіа, генерації зображень і генерації медіа                                                    |
| `/codeql-critical-quality/plugin-boundary`            | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опубліковане вихідне дерево Plugin SDK з боку пакета та допоміжні засоби контрактів пакетів Plugin                                                                  |

Якість залишається окремо від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати, не затіняючи сигнал безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як scoped або shard подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієва смуга обслуговування Codex для підтримання наявної документації у відповідності до нещодавно приземлених змін. Він не має чистого розкладу: успішний CI-запуск після небот-пушу в `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики від workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тому один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієва смуга обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск після небот-пушу в `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний шлюз активності. Смуга створює згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість прохідних тестів. Якщо базова лінія має тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед комітом будь-чого. Коли `main` просувається до приземлення bot push, смуга робить rebase перевіреного патча, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб action Codex міг зберігати таку саму безпечну позицію drop-sudo, як і docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після приземлення. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що приземлений PR змержено і що кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Логіка локальних changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають тільки core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі root/config changes fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі редагування тестів запускають самі себе, редагування source віддають перевагу явним mappings, потім sibling tests і dependents import-graph. Конфігурація доставки shared group-room є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default падала ще до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу свіжому warmed box для широкого proof. Перш ніж витрачати повільний gate на box, який було повторно використано, термін дії якого минув або який щойно повідомив про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли зникають обов’язкові root files на кшталт `pnpm-lock.yaml` або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження product test failure. Для PR з навмисними large-deletion встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

Crabbox — це другий remote-box шлях, що належить репозиторію, для Linux proof, коли Blacksmith недоступний або коли бажано використати власну cloud capacity. Прогрійте box, hydrate його через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` містить стандартні налаштування provider, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` відповідає за checkout, налаштування Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` використовують як source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
