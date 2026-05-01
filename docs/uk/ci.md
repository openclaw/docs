---
read_when:
    - Потрібно з’ясувати, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, гейти області дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-01T02:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2ee36f96ccf86d4adb739f5f7efb82c05f733e7693571ce391269d2538fec7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidates та широкої валідації. Android-лінії залишаються opt-in через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scopes, змінені extensions і будує CI manifest            | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей проти npm advisories                               | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для unused-file                    | Node-релевантні зміни              |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і багаторазові downstream artifacts     | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-релевантні зміни              |
| `checks-node-core-test`          | Core Node test shards, окрім channel, bundled, contract і extension lanes                    | Node-релевантні зміни              |
| `check`                          | Sharded еквівалент main local gate: prod types, lint, guards, test types і strict smoke      | Node-релевантні зміни              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-релевантні зміни              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-релевантні зміни              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken-link                                              | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Python-skill-релевантні зміни      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс один debug APK build                                | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не очікуючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати одразу після готовності shared build.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Автоматичний CI concurrency key версійований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безкінечно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідовують Node CI graph плюс workflow linting, але самі по собі не форсують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, вибрані cheap core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, small core unit lanes paired, auto-reply запускається як four balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із CI shard name, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої small independent guards конкурентно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, водночас уникаючи duplicate debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на latest Knip version, із вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює Knip production unused-file findings із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Manual dispatches

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; повний release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не був скасований іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу запустити цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/пакетних компонентів, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує Ubuntu, розміщений у GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди plugins, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів пакетних plugins, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

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

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження plugin/package/static/Docker, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path для Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram lanes. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
цільових засобів повторного запуску.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні релізні workflows типово використовують `stable`; використовуйте `full` лише тоді, коли ви свідомо хочете широку advisory-матрицю provider/media.

- `minimum` залишає найшвидші критичні для релізу lanes OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory-матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх runs, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх runs і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки й підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease plugin, `release-checks` для кожного дочірнього release, або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це утримує повторний запуск failed release box в обмежених межах після цільового виправлення.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E release-path Docker workflow, і в shard package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати runs `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський monitor скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський run скасовано, тому новіша main validation
не чекає за застарілим двогодинним release-check run. Валідація release branch/tag
і цільові rerun groups залишають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке native-покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs`, а не як одне послідовне завдання:

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
- розділені шарди media audio/video та provider-filtered music shards

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних live provider failures. Агреговані назви шардiв `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Native live media shards виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед налаштуванням. Тримайте live suites на базі Docker на звичайних Blacksmith runners — container jobs не підходять для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає та публікує цей образ, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні script-level обмеження `timeout`, нижчі за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці шарди самостійно перебудовують повну source Docker target, release run налаштовано неправильно, і він марнуватиме wall clock на дублікати image builds.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей installable package OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після install або update.

### Завдання

1. `resolve_package` перевіряє `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-лінії для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance визначив його; окремий запуск Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker Acceptance або необов’язкова Telegram-лінія завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт доступний з історії гілок репозиторію або релізного тегу, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/обв’язки, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточній тестовій обв’язці перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні частини Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова Telegram-лінія повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для окремих запусків.

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Частини Docker release-path покривають перехресні лінії package/update/plugin; Package Acceptance зберігає artifact-native доказ bundled-channel compat, offline plugin і Telegram для того самого визначеного tarball пакета. Cross-OS release checks і далі покривають специфічні для ОС onboarding, installer і поведінку платформи; перевірка продукту package/update має починатися з Package Acceptance. Windows-лінії packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із необробленого абсолютного шляху Windows. Cross-OS OpenAI agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4-mini`, щоб доказ встановлення й Gateway залишався швидким і детермінованим.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна сумісності зі спадковими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` з fake git fixture, похідного від tarball, і може журналювати відсутній збережений `update.channel`;
- plugin smokes можуть читати спадкові розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас вимагаючи, щоб install record і поведінка без повторного встановлення лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли stamp локальних build-метаданих, які вже були поставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт scope через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що торкаються Docker/package surfaces, змін пакета/маніфесту вбудованих Plugin або core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді вбудованого Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого extension і запускає обмежений bundled-plugin Docker profile у межах 240-секундного агрегованого таймауту команди (кожен Docker-запуск сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull request, що справді торкаються installer/package/Docker surfaces. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб installer work не чекав позаду root image smokes.

Пуші в `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope просила б повне покриття на push, workflow залишає швидкий Docker smoke і лишає повний install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з release checks workflow, а ручні запускі `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типове значення | Призначення                                                                                   |
| ------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів main-pool для звичайних ліній.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-pool, чутливого до provider.                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Ліміт паралельних live-ліній, щоб providers не throttled.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Ліміт паралельних ліній npm install.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Ліміт паралельних multi-service ліній.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами ліній, щоб уникати Docker daemon create storms; встановіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний таймаут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset           | `1` друкує план scheduler без запуску ліній.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset           | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Локальні агреговані preflights перевіряють Docker, видаляють застарілі OpenClaw E2E containers, виводять статус активних ліній, зберігають таймінги ліній для впорядкування longest-first і за замовчуванням припиняють планування нових pooled ліній після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, типу image, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє інвентар tarball; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker image повторюються з обмеженим 180-секундним timeout на кожну спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, тож кожен chunk завантажує лише потрібний йому тип image і виконує кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Сукупний chunk `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними alias для plugin/runtime. Alias lane `install-e2e` залишається сукупним alias ручного повторного запуску для обох provider installer lanes. Chunk `bundled-channels` запускає розділені lanes `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну lane all-in-one `bundled-channel-deps`.

OpenWebUI включено до `plugins-runtime-services`, коли повне покриття release-path цього вимагає, і зберігає окремий chunk `openwebui` лише для dispatches, призначених тільки для OpenWebUI. Bundled-channel update lanes повторюються один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, targeted job збирає live-test image локально для цього повторного запуску. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, тож failed lane може повторно використати точні package і images із failed run.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Попередній випуск

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним operator. Звичайні pull requests, пуші в `main` і standalone manual CI dispatches не вмикають цей suite. Він балансує тести bundled plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у малі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має окремі CI lanes поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і manual dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і на manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку memory; provider connectivity покривається окремими suites для live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. CLI default і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди шардить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у малий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test вважайте це optional signal і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним repository sweep. Daily, manual і non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript поверхні з найвищим ризиком за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                    |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і Plugin SDK SSRF policy surfaces                                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading і Plugin SDK package contract trust surfaces    |

### Platform-specific security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза daily defaults, бо macOS build домінує за runtime навіть коли clean.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для agent command/model/tool execution і reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або змін Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel plugin                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, маршрутизація моделей/провайдерів, маршрутизація та черги автоматичних відповідей, а також runtime-контракти control plane ACP                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади runtime пам’яті, псевдоніми пам’яті Plugin SDK, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/наборів логів і CLI-контракти doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Маршрутизація вхідних відповідей Plugin SDK, допоміжні засоби payload/поділу на фрагменти/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, типові значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальна персистентність, потоки керування Gateway і runtime-контракти control plane задач                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основних web fetch/search, медійного IO, розуміння медіа, генерації зображень і генерації медіа                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код Plugin SDK на боці пакета та допоміжні засоби контракту пакета plugin                                                                      |

Якість лишається окремою від безпеки, щоб результати перевірок якості можна було планувати, вимірювати, вимикати або розширювати, не затіняючи сигнал безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Агент документації

Робочий процес `Docs Agent` — це подієво-керований канал супроводу Codex для підтримання наявної документації відповідно до нещодавно landed змін. Він не має чистого розкладу: успішний CI-запуск non-bot push на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже зрушив далі або коли інший non-skipped запуск Docs Agent було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво-керований канал супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск non-bot push на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний activity gate. Канал формує grouped Vitest-звіт продуктивності повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість passing тестів. Якщо в базовому стані є failing тести, Codex може виправляти лише очевидні збої, а after-agent звіт повного набору має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push потрапить у репозиторій, канал перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex міг зберігати ту саму drop-sudo safety posture, що й агент документації.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR об’єднано, і що кожен duplicate має або спільну referenced issue, або перекривні changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI:

- зміни production-коду core запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core tests запускають тільки core test typecheck плюс core lint;
- зміни production-коду extension запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension tests запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core-контрактів (Vitest extension sweeps лишаються явною тестовою роботою);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу явним mappings, потім sibling tests та import-graph dependents. Спільна group-room delivery config є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна спільного default впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із root репозиторію та віддавайте перевагу свіжій прогрітій box для широкого proof. Перш ніж витрачати повільний gate на box, який було повторно використано, який expired або щойно повідомив про несподівано велику sync, спочатку запустіть `pnpm testbox:sanity` усередині box.

Sanity check швидко падає, коли потрібні root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цю box і прогрійте свіжу замість налагодження product test failure. Для навмисних PR із великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається у фазі sync понад п’ять хвилин без post-sync output. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
