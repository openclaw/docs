---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск перевірки релізу
summary: Граф завдань CI, перевірки за обсягом, релізні парасолькові перевірки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-01T22:37:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6d284871bfc5f8c4740bd729563070baf396c60a2769f49c521c44dd709addf
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі напрямки, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне звуження області та розгортають увесь граф для кандидатів на реліз і широкої перевірки. Напрямки Android залишаються opt-in через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або через явний ручний dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені extensions і створює CI manifest         | Завжди для не-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для не-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                  | Завжди для не-draft push і PR      |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                          | Завжди для не-draft push і PR      |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для невикористаних файлів          | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts          | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-напрямки коректності, як-от перевірки bundled/plugin-contract/protocol          | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки контрактів каналів зі стабільним aggregate check result                    | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди Core Node test, крім напрямків channel, bundled, contract і extension                  | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node    |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke-тести і startup-memory smoke                                                 | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-напрямок                                                 | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken-link                                              | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс спільні регресії runtime import specifier     | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane зі спільними built artifacts                                      | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                            | Успіх main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які напрямки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-напрямками, щоб downstream consumers могли стартувати щойно спільна збірка готова.
4. Важчі platform і runtime напрямки розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний CI concurrency key версіонований (`CI-v7-*`), щоб zombie на боці GitHub у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Зміни CI workflow** перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують запускати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Зміни лише маршрутизації CI, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node test розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднано в пари, auto-reply запускається як чотири збалансовані workers (з reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно в одному job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, водночас уникаючи duplicate debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, з вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні dispatch

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожен non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу запускати цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого пакета, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke також використовує Ubuntu, розміщену на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugins, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32 vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
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

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного доказу Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і ліній Telegram. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
цільових ідентифікаторів повторного запуску.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка рекомендаційна матриця provider/media.

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку рекомендаційну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow повторно запущено і він стає зеленим, повторно запустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожної дочірньої релізної перевірки або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує повторний запуск невдалої release box у межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E Docker workflow release-path, і в shard package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
витісняють старішу парасольку. Батьківський monitor скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський запуск скасовано, тож новіша валідація main
не очікує за застарілим двогодинним запуском release-check. Валідація release branch/tag
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке покриття нативного `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені audio/video media shards і music shards, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед setup. Тримайте live suites на базі Docker на звичайних runners Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker tests.

Live model/backend shards на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає та публікує цей образ, а потім Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб завислий контейнер або шлях cleanup швидко завершувався помилкою, а не споживав увесь бюджет release-check. Якщо ці shards самостійно перебудовують повну ціль source Docker, release run налаштовано неправильно, і він марнуватиме wall clock на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей інстальований пакет OpenClaw як продукт?» Він відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі виконують після install або update.

### Завдання

1. `resolve_package` вивіряє `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, ref workflow, ref пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-гілки для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, багаторазовий workflow готує пакет і спільні образи один раз, а потім розгортає ці гілки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance визначив його; автономний dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або необов’язкова Telegram-гілка завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, поширених назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового каркаса, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає поточному тестовому каркасу змогу перевіряти старі довірені вихідні коміти без запуску старої логіки workflow.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова Telegram-гілка повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних dispatch.

Окрему політику тестування оновлень і Plugin, зокрема локальні команди,
Docker-гілки, вхідні параметри Package Acceptance, типові налаштування релізів і triage збоїв,
див. у [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Релізні перевірки викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це утримує перевірки міграції пакета, оновлення, очищення застарілих залежностей Plugin, офлайн Plugin, plugin-update і Telegram на тому самому визначеному tarball пакета. Cross-OS релізні перевірки й далі покривають специфічні для ОС onboarding, installer і поведінку платформи; перевірку продукту package/update слід починати з Package Acceptance. Docker-гілка `published-upgrade-survivor` перевіряє один базовий опублікований пакет за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опубліковану базову версію, за замовчуванням `openclaw@latest`; команди повторного запуску збійних гілок зберігають цю базову версію. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розгорнути гілку в матрицю дедуплікованої історії: шість останніх stable-релізів, `2026.4.23` і останній stable-реліз до `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розгорнути ті самі базові версії за issue-подібними fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, шляхів журналів з tilde і застарілих коренів залежностей legacy Plugin. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, лишати одну гілку з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована гілка налаштовує базову версію за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC-статус після запуску Gateway. Windows-гілки packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override з сирого абсолютного Windows-шляху. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.5`, щоб докази встановлення й Gateway лишалися на бажаній GPT-5 тестовій моделі.

### Вікна сумісності з legacy

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може прибрати відсутні `pnpm.patchedDependencies` із fake git fixture, отриманого з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy-розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка no-reinstall лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампів build metadata, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію і SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали гілок, timings фаз і команди повторного запуску. Надавайте перевагу повторному запуску збійного профілю пакета або точних Docker-гілок замість повторного запуску повної релізної перевірки.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що зачіпають Docker/package surfaces, зміни package/manifest bundled Plugin або surfaces core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду bundled Plugin, правки лише тестів і правки лише документації не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі завдання, щоб робота installer не чекала за root image smokes.

Push у `main` (зокрема merge commits) не примушує повний шлях; коли логіка changed-scope запитувала б повне покриття на push, workflow зберігає швидкий Docker smoke і лишає повний install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow релізних перевірок, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull requests і push у `main` не роблять цього. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для гілок installer/update/plugin-dependency;
- functional image, який встановлює той самий tarball у `/app` для гілок звичайної функціональності.

Визначення Docker-гілок містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає image для кожної гілки через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає гілки з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                 | За замовчуванням | Призначення                                                                                                           |
| -------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10               | Кількість слотів основного пулу для звичайних смуг.                                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10               | Кількість слотів хвостового пулу, чутливого до провайдерів.                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                | Обмеження одночасних live-смуг, щоб провайдери не застосовували throttling.                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10               | Обмеження одночасних смуг встановлення npm.                                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                | Обмеження одночасних багатосервісних смуг.                                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000             | Затримка між стартами смуг, щоб уникнути штормів створення в Docker daemon; установіть `0`, щоб вимкнути затримку.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000          | Резервний тайм-аут для кожної смуги (120 хвилин); вибрані live/хвостові смуги використовують жорсткіші обмеження.     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не встановлено   | `1` друкує план планувальника без запуску смуг.                                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | не встановлено   | Розділений комами точний список смуг; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу смугу.        |

Смуга, важча за свій ефективний ліміт, усе одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальний агрегатор виконує попередні перевірки Docker, видаляє застарілі OpenClaw E2E-контейнери, виводить статус активних смуг, зберігає тривалості смуг для впорядкування від найдовших до найкоротших і за замовчуванням припиняє планувати нові pooled-смуги після першого збою.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, смуги та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує позначені digest пакета bare/functional GHCR Docker E2E-образи через Docker layer cache Blacksmith, коли план потребує смуг із установленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька смуг через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім смуги `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох смуг встановлювачів провайдерів.

OpenWebUI включається до `plugins-runtime-services`, коли цього вимагає повне release-path coverage, і зберігає окремий фрагмент `openwebui` лише для dispatch, що стосується тільки OpenWebUI. Смуги оновлення bundled-channel один раз повторюють запуск у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` із журналами смуг, тривалостями, `summary.json`, `failures.json`, тривалостями фаз, JSON-планом планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Вхід workflow `docker_lanes` запускає вибрані смуги проти підготовлених образів замість chunk jobs, що обмежує налагодження невдалої смуги одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker-смугою, цільовий job локально збирає live-test образ для цього повторного запуску. Згенеровані для кожної смуги команди повторного запуску GitHub містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала смуга могла повторно використати саме той пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти й надрукувати об’єднані/посмугові цільові команди повторного запуску
pnpm test:docker:timings <summary>   # зведення повільних смуг і критичного шляху фаз
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` — дорожче покриття продукту/пакета, тому це окремий workflow, який запускає `Full Release Validation` або явний оператор. Звичайні pull requests, пуші в `main` і автономні ручні CI dispatches не запускають цей suite. Він балансує тести bundled plugin між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації plugin одночасно з одним Vitest worker на групу й більшим Node heap, щоб насичені імпортами batches plugin не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker-смуги в невеликі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI-смуги поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного dispatch; він збирає приватний QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгортає mock parity gate, live Matrix-смугу, а також live Telegram і Discord-смуги як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного старту provider-plugin. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку пам’яті; підключення провайдера покривають окремі suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. CLI default і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невеликий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit tests вважайте це необов’язковим сигналом і спирайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким первинним security scanner, а не повним repository sweep. Щоденні, ручні й non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript-поверхні найвищого ризику з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти core channel implementation плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                  |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні Plugin SDK SSRF policy                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust-поверхні Plugin SDK package contract    |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує в `/codeql-critical-security/macos`. Залишається поза daily defaults, бо macOS build домінує runtime навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді agent command/model/tool execution і reply dispatch, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles — це навчальні/ітераційні hooks для запуску одного quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого канального plugin                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделі/провайдера, диспетчеризація автовідповідей і черги, а також runtime-контракти площини керування ACP                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста памʼяті, runtime-фасади памʼяті, псевдоніми SDK памʼяті для Plugin, звʼязувальний код активації runtime памʼяті та команди doctor для памʼяті                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні компоненти черги відповідей, черги доставки сесій, допоміжні засоби привʼязування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей SDK Plugin, допоміжні засоби payload/поділу на фрагменти/runtime для відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби привʼязування сесій/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, реєстрація runtime провайдерів, стандартні значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження UI керування, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основного web fetch/search, media IO, розуміння медіа, генерування зображень і генерування медіа                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу SDK Plugin                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код SDK Plugin на боці пакета та допоміжні засоби контракту пакета plugin                                                                         |

Якість залишається окремою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затінення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід додавати назад як обмежену за областю або шардовану подальшу роботу лише після того, як вузькі профілі матимуть стабільні runtime і сигнал.

## Робочі процеси супроводу

### Агент документації

Робочий процес `Docs Agent` — це подієво-керована лінія супроводу Codex для підтримання наявної документації у відповідності з нещодавно внесеними змінами. Вона не має чистого розкладу: успішний CI-запуск після push не від бота на `main` може її запустити, а ручний dispatch може запустити її напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший не пропущений запуск Docs Agent був створений протягом останньої години. Під час виконання вона переглядає діапазон комітів від попереднього не пропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво-керована лінія супроводу Codex для повільних тестів. Вона не має чистого розкладу: успішний CI-запуск після push не від бота на `main` може її запустити, але вона пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього дня UTC. Ручний dispatch обходить це денне обмеження активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість тестів, які проходять. Якщо базовий стан має тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти до коміту будь-чого. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму drop-sudo позицію безпеки, що й агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес супроводжувача для очищення дублікатів після land. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злитий і що кожен дублікат має або спільне згадане issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check-gates і маршрутизація змін

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область CI-платформи:

- зміни production-коду core запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише тестів core запускають лише typecheck core test плюс core lint;
- зміни production-коду extension запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише тестів extension запускають typecheck extension test плюс extension lint;
- зміни публічного SDK Plugin або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів (прогони Vitest для extensions залишаються явною тестовою роботою);
- зміни лише release metadata для підняття версії запускають цільові перевірки версії/конфігурації/root-залежностей;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі правки тестів запускають самі себе, правки джерел віддають перевагу явним мапінгам, потім sibling tests і залежним з import graph. Конфігурація доставки shared group-room є одним з явних мапінгів: зміни до конфігурації group visible-reply, режиму доставки source reply або системного prompt message-tool проходять через основні тести відповідей плюс регресії доставки Discord і Slack, щоб зміна shared default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка для harness, що дешевий змapped набір не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й надавайте перевагу свіжій прогрітій box для широкого proof. Перед витрачанням повільного gate на box, яку повторно використали, термін якої минув або яка щойно повідомила про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли зникли потрібні root-файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цю box і прогрійте свіжу замість налагодження збою product test. Для PR з навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад пʼять хвилин без post-sync output. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий remote-box шлях, яким володіє репозиторій, для proof на Linux, коли Blacksmith недоступний або коли бажаніша власна хмарна потужність. Прогрійте box, гідруйте її через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає стандартні значення provider, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб hydrated checkout Actions зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` підвантажують як source.

## Повʼязане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
