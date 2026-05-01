---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка завершується з помилкою
    - Ви координуєте запуск або повторний запуск перевірки релізу
summary: Граф завдань CI, шлюзи області дії, релізні парасольки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-01T03:00:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає витратні напрямки, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для release candidates і широкої валідації. Напрямки Android залишаються опційними через `include_android`. Покриття Plugin лише для релізу міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує CI manifest   | Завжди для non-draft push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft push і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                 | Завжди для non-draft push і PR    |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                           | Завжди для non-draft push і PR    |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для невикористаних файлів           | Зміни, релевантні Node            |
| `build-artifacts`                | Побудова `dist/`, Control UI, перевірки built artifacts і reusable downstream artifacts       | Зміни, релевантні Node            |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                 | Зміни, релевантні Node            |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                          | Зміни, релевантні Node            |
| `checks-node-core-test`          | Core Node test shards, окрім channel, bundled, contract і extension lanes                     | Зміни, релевантні Node            |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node        |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards     | Зміни, релевантні Node            |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                  | Зміни, релевантні Node            |
| `checks`                         | Verifier для built-artifact channel tests                                                     | Зміни, релевантні Node            |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                      | Ручний CI dispatch для релізів    |
| `check-docs`                     | Форматування документації, lint і перевірки broken links                                      | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні Python Skills   |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions          | Зміни, релевантні Windows         |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                             | Зміни, релевантні macOS           |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                       | Зміни, релевантні macOS           |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                 | Зміни, релевантні Android         |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                   | Успіх Main CI або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які напрямки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не очікуючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати одразу після готовності shared build.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно звітують про звичайні shard failures, але не стають у чергу після того, як весь workflow уже було замінено. Automatic CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Зміни CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують запускати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Зміни лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей напрямок; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, small core unit lanes об’єднуються парами, auto-reply працює як чотири balanced workers (із розділенням reply subtree на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування на built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries з використанням назви CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої невеликі independent guards паралельно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже побудовані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи дублювання debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до latest Knip version, з вимкненим pnpm minimum release age для `dlx` install) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні dispatches

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожен non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тож release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Опційний input `target_ref` дає trusted caller змогу запускати цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання та агрегати безпеки (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди та агрегати `check-additional`, верифікатори агрегатів тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує Ubuntu на GitHub-hosted runners, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди extension, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
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
```

## Повна валідація релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає вручну workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного proof для plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram lanes. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
цільових механізмів повторного запуску.

`release_profile` керує шириною live/provider, що передається у release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку матрицю дорадчих provider/media.

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку дорадчу матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх runs, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх runs і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок часу виконання.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного дочірнього release, або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує повторний запуск невдалого release box у межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в release-path Docker workflow live/E2E, і в shard package acceptance. Це зберігає однакові байти пакета в усіх release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський запуск скасовано, тому новіша валідація main
не чекає за застарілим двогодинним release-check run. Валідація release branch/tag
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені audio/video шарди media і шарди music, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні шарди live media запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирається workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; завдання media лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори на базі Docker на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Live-шарди model/backend на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає та публікує цей образ, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні timeout caps на рівні скрипта нижче timeout завдання workflow, щоб завислий контейнер або cleanup path швидко завершувалися з помилкою, а не споживали весь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, release run налаштовано неправильно, і він марнуватиме wall clock на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Він відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

### Завдання

1. `resolve_package` перевіряє `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 та профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-лінії для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, багаторазовий workflow один раз готує пакет і спільні образи, а потім розгалужує ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; окремий dispatch Telegram усе ще може встановити опубліковану специфікацію npm.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або необов’язкова лінія Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності в detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття плагінів, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої специфікації npm зберігається для окремих dispatch.

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти release-path покривають лінії package/update/plugin, що перетинаються; Package Acceptance зберігає artifact-native bundled-channel compat, офлайн-плагін і доказ Telegram для того самого визначеного package tarball. Cross-OS release checks і далі покривають OS-specific onboarding, installer та поведінку платформи; product-перевірку package/update слід починати з Package Acceptance. Docker-лінія `published-upgrade-survivor` перевіряє один опублікований package baseline за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає опублікований baseline, за замовчуванням `openclaw@latest`; команди повторного запуску невдалих ліній зберігають цей baseline. Локальні запуски можуть установити `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` на точний пакет, як-от `openclaw@2026.4.15`. Опублікована лінія налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, а потім записує кроки рецепта в `summary.json`. Ширше покриття попередніх версій слід шардити через Package Acceptance за точними значеннями `published_upgrade_survivor_baseline`. Windows packaged і installer fresh лінії також перевіряють, що встановлений пакет може імпортувати override browser-control із сирого абсолютного шляху Windows. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його встановлено, інакше `openai/gpt-5.4-mini`, тож доказ install і Gateway лишається швидким і детермінованим.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна сумісності зі спадковими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні записи QA у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- smoke-тести плагінів можуть читати спадкові розташування install-record або приймати відсутність збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata конфігурації, водночас вимагаючи, щоб install record і поведінка без повторного встановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні build metadata stamp files, які вже були випущені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого package profile або точних Docker-ліній замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що змінюють Docker/package surfaces, пакет/маніфест bundled plugin або core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled plugin, зміни лише тестів і зміни лише docs не резервують Docker workers. Швидкий шлях один раз будує root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає bounded bundled-plugin Docker profile під сукупним таймаутом команди 240 секунд (кожен Docker run сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав за root image smokes.

Push у `main` (включно з merge commits) не примушують повний шлях; коли логіка changed-scope запитала б full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за nightly schedule і з workflow release checks, а manual `Install Smoke` dispatches можуть увімкнути його, але pull requests і push у `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо будує один спільний live-test image, один раз пакує OpenClaw як npm tarball і будує два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker-ліній розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                                    |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних ліній.                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-pool, чутливого до provider.                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live lanes, щоб providers не throttled.                                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних npm install lanes.                                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service lanes.                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути Docker daemon create storms; установіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожної лінії (120 хвилин); вибрані live/tail lanes використовують жорсткіші обмеження.  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план scheduler без запуску ліній.                                                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Смуга, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працювати самостійно, доки не звільнить місткість. Локальний агрегат виконує попередні перевірки Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних смуг, зберігає таймінги смуг для впорядкування від найдовших до найкоротших і за замовчуванням припиняє планувати нові смуги з пулу після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й надсилає package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker images повторюються з обмеженим таймаутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти шляху релізу

Покриття Release Docker запускає менші фрагментовані jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, тому кожен фрагмент завантажує лише потрібний йому image kind і виконує кілька смуг через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні фрагменти release Docker: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими аліасами Plugin/runtime. Аліас смуги `install-e2e` залишається агрегованим аліасом ручного повторного запуску для обох смуг installer провайдерів. Фрагмент `bundled-channels` запускає розділені смуги `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну все-в-одному смугу `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття release-path запитує його, і зберігає окремий фрагмент `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Смуги оновлення bundled-channel повторюються один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з логами смуг, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Input workflow `docker_lanes` запускає вибрані смуги на підготовлених images замість jobs фрагментів, що обмежує налагодження збійної смуги одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана смуга є live Docker lane, цільовий job локально збирає live-test image для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної смуги містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених images, коли ці значення існують, тож збійна смуга може повторно використати точні package і images зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний набір Docker release-path.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, pushes у `main` і окремі ручні CI dispatches не запускають цей набір. Він балансує тести вбудованих Plugin між вісьмома workers розширень; ці jobs фрагментів розширень запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy пакети Plugin не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного dispatch; він збирає приватний QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам’яті, бо QA parity окремо покриває поведінку пам’яті; connectivity provider покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Значення CLI за замовчуванням і ручний input workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед затвердженням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у малий report job для фінального порівняння parity.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, config, docs або unit-test вважайте це необов’язковим сигналом і спирайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript поверхні з найвищим ризиком за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять у PR defaults.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти core channel implementation плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                     |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні політики SSRF Plugin SDK                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helpers виконання процесів, outbound delivery і gates agent tool-execution                                                |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading і trust surfaces контракту package Plugin SDK    |

### Платформоспецифічні фрагменти безпеки

- `CodeQL Android Critical Security` — запланований фрагмент безпеки Android. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний фрагмент безпеки macOS. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Утримується поза daily defaults, бо macOS build домінує час виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security фрагментом. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні фрагменти `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і reply dispatch, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти введення-виведення                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація автоматичних відповідей і черги, а також runtime-контракти площини керування ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми SDK пам’яті для Plugin, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і CLI-контракти doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/нарізання на частини/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сесій/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдера, стандартні значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження UI керування, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основного web fetch/search, медіа-введення-виведення, розуміння медіа, генерації зображень і генерації медіа                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане пакетне джерело Plugin SDK і допоміжні засоби контрактів пакетів plugin                                                                                              |

Якість залишається окремою від безпеки, щоб findings щодо якості можна було планувати, вимірювати, вимикати або розширювати без розмивання сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід повертати як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована лінія супроводу Codex для підтримання наявної документації у відповідності до нещодавно внесених змін. Він не має чистого розкладу: успішний CI-запуск від non-bot push на `main` може його запустити, а ручний запуск може виконати його напряму. Виклики workflow-run пропускаються, коли `main` уже зрушив далі або коли інший непропущений запуск Docs Agent був створений протягом останньої години. Під час виконання він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з моменту останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована лінія супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск від non-bot push на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний запуск обходить цей денний gate активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору та відхиляє зміни, що зменшують базову кількість пройдених тестів. Якщо базовий стан має failing tests, Codex може виправляти лише очевидні failures, а after-agent звіт повного набору має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде внесений, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти таку саму безпечну позицію drop-sudo, як docs agent.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злитий і що кожен duplicate має або спільне referenced issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни production-коду core запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core tests запускають тільки core test typecheck плюс core lint;
- зміни production-коду extension запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension tests запускають extension test typecheck плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (розгортки Vitest для extensions залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Спільна конфігурація доставки group-room — один із явних mappings: зміни до group visible-reply config, source reply delivery mode або system prompt message-tool маршрутизуються через core reply tests плюс регресії доставки Discord і Slack, щоб shared default change зафейлився до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію та віддавайте перевагу свіжій прогрітій box для широкого proof. Перед витрачанням повільного gate на box, яку повторно використали, строк дії якої минув або яка щойно повідомила про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root files, такі як `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цю box і прогрійте нову замість debugging product test failure. Для PR із навмисним великим видаленням задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
