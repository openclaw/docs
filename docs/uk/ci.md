---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск перевірки релізу
summary: Граф завдань CI, контрольні перевірки за областю, парасолькові релізні процеси та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-01T20:36:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: db8f529b1f373d31aef3dac963d71cff575bc24b808a6ad1fa1c20a1725ad994
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається на кожному push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження scope і розгортають повний граф для release candidates та широкої валідації. Android lanes залишаються opt-in через `include_android`. Release-only покриття plugin міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, змінені scopes, змінені extensions і будує CI manifest              | Завжди для non-draft pushes і PRs         |
| `security-scm-fast`              | Виявлення приватних ключів і audit workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs         |
| `security-dependency-audit`      | Production lockfile audit без встановлення залежностей щодо npm advisories                  | Завжди для non-draft pushes і PRs         |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs         |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів             | Node-релевантні зміни                     |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built artifacts і reusable downstream artifacts        | Node-релевантні зміни                     |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-релевантні зміни                     |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                      | Node-релевантні зміни                     |
| `checks-node-core-test`          | Core Node test shards, без channel, bundled, contract і extension lanes                      | Node-релевантні зміни                     |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke | Node-релевантні зміни                |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-релевантні зміни                     |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-релевантні зміни                     |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-релевантні зміни                     |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для releases           |
| `check-docs`                     | Форматування docs, lint і broken-link checks                                                 | Docs змінено                              |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-релевантні зміни             |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-релевантні зміни                  |
| `macos-node`                     | macOS TypeScript test lane із shared built artifacts                                         | macOS-релевантні зміни                    |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-релевантні зміни                    |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-релевантні зміни                  |
| `test-performance-agent`         | Щоденна оптимізація повільних tests у Codex після trusted activity                           | Успіх Main CI або ручний dispatch         |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не очікуючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно shared build буде готовий.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у queue після того, як увесь workflow уже superseded. Автоматичний CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безкінечно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **CI workflow edits** валідують Node CI graph плюс workflow linting, але самі по собі не форсують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, вибрані cheap core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують fast Node-only manifest path: `preflight`, security і єдине завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші Node test families розділено або збалансовано, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднуються в пари, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно в одному job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи водночас дублювання debug APK packaging job на кожному Android-релевантному push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може resolve статично.

## Ручні dispatches

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Optional input `target_ref` дає trusted caller змогу запустити цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-хостований Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, менш ресурсомісткі шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker-збірки (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

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

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних доказів Plugin/пакета/статики/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path для Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати постпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
цільових способів повторного запуску.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка консультативна матриця provider/media.

- `minimum` зберігає найшвидші критичні для релізу lanes OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх виконань, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх виконань і додає таблиці найповільніших завдань для кожного дочірнього виконання. Якщо дочірній workflow перезапущено й він стає зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного дочірнього релізного виконання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це утримує повторний запуск невдалого release box у межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і live/E2E release-path Docker workflow, і шарду package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський запуск скасовано, тому новіша валідація main
не чекає за застарілим двогодинним запуском release-check. Валідація release branch/tag
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live і E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені медіашарди audio/video і provider-filtered шарди music

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних live-збоїв provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media шарди працюють у `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, створеному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіазавдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live model/backend шарди використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає й надсилає цей образ, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker шарди мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою замість споживання всього бюджету release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, release run налаштовано неправильно, і він витрачатиме реальний час на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує дерево джерельного коду, тоді як package acceptance валідує один tarball через той самий Docker E2E harness, який користувачі задіюють після інсталяції або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-доріжки для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, багаторазовий workflow один раз готує пакет і спільні образи, а потім розгортає ці доріжки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance визначив його; автономний dispatch Telegram все ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або необов’язкова доріжка Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний commit SHA з `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто вказувати для артефактів, поширених назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового каркаса, який запускає тест. `package_ref` — це вихідний commit, який пакується, коли `source=ref`. Це дає змогу поточному тестовому каркасу перевіряти старіші довірені вихідні commits без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття плагінів, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова доріжка Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для автономних dispatch.

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Docker-фрагменти release-path покривають суміжні доріжки package/update/plugin; Package Acceptance зберігає офлайн-докази для plugin, update і Telegram щодо того самого визначеного tarball пакета. Cross-OS release checks все ще покривають OS-специфічні onboarding, installer і platform behavior; перевірку package/update product слід починати з Package Acceptance. Docker-доріжка `published-upgrade-survivor` перевіряє один опублікований базовий пакет за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опубліковану baseline, типово `openclaw@latest`; команди повторного запуску невдалих доріжок зберігають цю baseline. Задайте `published_upgrade_survivor_baselines=release-history`, щоб розгорнути доріжку в deduped history matrix: шість останніх stable-релізів, `2026.4.23` і останній stable-реліз перед `2026-03-15`. Задайте `published_upgrade_survivor_scenarios=reported-issues`, щоб розгорнути ті самі baselines на issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona файлів, шляхів логів з tilde і застарілих коренів залежностей legacy plugin. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну доріжку з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована доріжка налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows. Cross-OS agent-turn smoke для OpenAI типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його задано, інакше `openai/gpt-5.4-mini`, щоб install і gateway proof залишалися швидкими та детермінованими.

### Вікна сумісності з legacy

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей flag;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` з fake git fixture, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію config metadata, водночас все ще вимагаючи, щоб install record і поведінка no-reinstall залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були поставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови спричиняють помилку замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи доріжок, timings фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого package profile або точних Docker-доріжок, а не повторному запуску всієї release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що зачіпають Docker/package surfaces, зміни package/manifest bundled plugin або core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, test-only edits і docs-only edits не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений bundled-plugin Docker profile з 240-секундним aggregate command timeout (Docker run кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install та installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекала після root image smokes.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли changed-scope logic запросила б full coverage на push, workflow залишає fast Docker smoke, а full install smoke лишає для nightly або release validation.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за nightly schedule і з release checks workflow, а manual `Install Smoke` dispatches можуть увімкнути його, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для доріжок installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker-доріжок розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної доріжки через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типове значення | Призначення                                                                                                   |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних смуг.                                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів хвостового пулу, чутливого до провайдерів.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Ліміт одночасних live-смуг, щоб провайдери не застосовували throttling.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Ліміт одночасних смуг установлення npm.                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Ліміт одночасних багатосервісних смуг.                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами смуг, щоб уникнути штормів створення в демоні Docker; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут для кожної смуги (120 хвилин); вибрані live/хвостові смуги використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано       | `1` друкує план планувальника без запуску смуг.                                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано       | Розділений комами точний список смуг; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу смугу. |

Смуга, важча за свій ефективний ліміт, усе одно може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить місткість. Локальний агрегат попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних смуг, зберігає час виконання смуг для впорядкування від найдовших до найкоротших і типово припиняє планувати нові pooled-смуги після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, смуги та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та надсилає bare/functional Docker E2E-образи GHCR із тегом digest пакета через кеш шарів Docker від Blacksmith, коли план потребує смуг з установленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти release-path

Покриття Release Docker запускає менші фрагментовані jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька смуг через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні фрагменти Release Docker: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними псевдонімами Plugin/runtime. Псевдонім смуги `install-e2e` залишається агрегатним псевдонімом ручного повторного запуску для обох смуг установника провайдера.

OpenWebUI включається в `plugins-runtime-services`, коли це запитує повне покриття release-path, і зберігає окремий фрагмент `openwebui` лише для dispatch лише OpenWebUI. Смуги оновлення bundled-channel один раз повторюються в разі тимчасових мережевих збоїв npm.

Кожен фрагмент вивантажує `.artifacts/docker-tests/` з журналами смуг, часом виконання, `summary.json`, `failures.json`, часом фаз, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Вхід workflow `docker_lanes` запускає вибрані смуги проти підготовлених образів замість jobs фрагментів, що обмежує налагодження невдалої смуги одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker-смугою, цільовий job локально збирає образ live-test для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної смуги містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала смуга могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний набір Docker release-path.

## Prerelease Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push у `main` і окремі ручні CI dispatches не запускають цей набір. Він балансує bundled Plugin tests між вісьмома extension workers; ці shard jobs extensions запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу й більшим heap Node, щоб import-heavy пакети Plugin не створювали додаткові CI jobs. Release-only шлях Docker prerelease групує цільові Docker-смуги в невеликі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI-смуги поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгортає mock parity gate, live Matrix-смугу та live Telegram і Discord смуги як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-Plugin. Live transport Gateway вимикає пошук памʼяті, оскільки QA parity окремо покриває поведінку памʼяті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI та вхід ручного workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical смуги QA Lab перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невеликий report job для остаточного порівняння parity.

Не ставте шлях landing PR за `Parity gate`, якщо зміна насправді не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit tests вважайте це необовʼязковим сигналом і спирайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують код Actions workflow і поверхні JavaScript/TypeScript з найвищим ризиком, використовуючи high-confidence security queries, відфільтровані до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до типових PR-перевірок.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс runtime channel Plugin, gateway, Plugin SDK, secrets, audit touchpoints                       |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні core SSRF, розбору IP, network guard, web-fetch і політики SSRF Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і gates виконання agent tools                                               |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, package-manager install, source-loading і package contract Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і вивантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими запускми, бо macOS build домінує в часі виконання навіть за чистого стану.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за запланований profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді agent command/model/tool execution і reply dispatch, config schema/migration/IO, auth/secrets/sandbox/security, core channel і runtime bundled channel Plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, Plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни конфігурації CodeQL і quality workflow запускають усі дванадцять PR quality shards.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є навчальними/ітераційними hooks для запуску одного quality shard ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`          | Код межі безпеки автентифікації, секретів, sandbox, cron і Gateway                                                                                                                  |
| `/codeql-critical-quality/config-boundary`            | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`   | Схеми протоколу Gateway і контракти серверних методів                                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`   | Контракти ядра каналів і реалізації вбудованих каналів Plugin                                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`     | Контракти виконання команд, диспетчеризації моделей/провайдерів, диспетчеризації та черг автовідповідей, а також runtime-контракти control plane ACP                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`    | SDK хоста пам’яті, фасади runtime пам’яті, псевдоніми SDK пам’яті Plugin, зв’язувальний код активації runtime пам’яті та команди doctor пам’яті                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`   | Диспетчеризація вхідних відповідей SDK Plugin, допоміжні засоби payload/розбиття на фрагменти/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сесії/треду |
| `/codeql-critical-quality/provider-runtime-boundary`  | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, типові значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`           | Початкове завантаження Control UI, локальне збереження, потоки керування Gateway і runtime-контракти control plane задач                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary` | Контракти runtime для core web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                                       |
| `/codeql-critical-quality/plugin-boundary`            | Контракти завантажувача, реєстру, публічної поверхні та точок входу SDK Plugin                                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опублікований package-side вихідний код SDK Plugin і допоміжні засоби контрактів пакетів Plugin                                                                                     |

Якість залишається окремою від безпеки, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без приховування сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Docs Agent

Робочий процес `Docs Agent` — це керована подіями смуга супроводу Codex для підтримання наявної документації у відповідності з нещодавно landed змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший non-skipped запуск Docs Agent було створено за останню годину. Під час запуску він переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це керована подіями смуга супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується в цей UTC-день. Manual dispatch обходить цей щоденний activity gate. Смуга будує звіт продуктивності Vitest для full-suite grouped, дозволяє Codex робити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline кількість passing tests. Якщо baseline має failing tests, Codex може виправити лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push потрапить у репозиторій, смуга rebases validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action могла зберігати ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR merged і що кожен дублікат має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI:

- зміни production у core запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core tests запускають лише core test typecheck плюс core lint;
- зміни production в extension запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension tests запускають extension test typecheck плюс extension lint;
- зміни публічного SDK Plugin або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються explicit test work);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі root/config changes fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі редагування тестів запускають самі себе, редагування source віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що cheap mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію і для broad proof віддавайте перевагу свіжому warmed box. Перед тим як витрачати повільний gate на box, який було reused, expired або який щойно повідомив про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і warm a fresh one замість debugging product test failure. Для навмисних large-deletion PR установіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у sync phase понад п’ять хвилин без post-sync output. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

Crabbox — це repo-owned другий remote-box path для Linux proof, коли Blacksmith недоступний або коли owned cloud capacity є кращою. Warm a box, hydrate його через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` містить defaults для provider, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає local runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` містить checkout, налаштування Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
