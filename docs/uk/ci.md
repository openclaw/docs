---
read_when:
    - Потрібно зрозуміти, чому CI-завдання запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що не проходить
    - Ви координуєте запуск або повторний запуск перевірки релізу
summary: Граф завдань CI, перевірки області дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-01T08:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdf65df865a8efcee7b0745b33b5ff633e885823177fb19c9920db37a10c59e4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidates та широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття Plugin лише для релізу міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scopes, змінені extensions і збирає маніфест CI           | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Аудит production lockfile без встановлення залежностей за npm advisories                     | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів              | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts          | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                      | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, без channel, bundled, contract і extension lanes                      | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного local gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken links                                             | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows process/path tests плюс shared runtime import specifier regressions   | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних Codex tests після довіреної активності                         | Успіх Main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безкінечно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і маршрутизація

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, вибрані cheap core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднуються парами, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, з вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings від Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Ручні dispatches

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` із увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не скасовувався іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, сегментовані перевірки контрактів каналів, сегменти `check`, окрім lint, сегменти й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; попередня перевірка install-smoke також використовує Ubuntu, розміщену на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші сегменти розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, сегменти тестів Linux Node, сегменти тестів вбудованих плагінів, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного доказу плагінів/пакетів/статичних файлів/Docker, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path для Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

Дивіться [Повну валідацію релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
цільових обробників повторного запуску.

`release_profile` керує шириною live/provider, переданою у release checks. Ручні
релізні workflow за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку рекомендаційну матрицю провайдерів/медіа.

- `minimum` залишає найшвидші критичні для релізу OpenAI/core lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку рекомендаційну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного релізного дочірнього workflow або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це тримає повторний запуск невдалої release box обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в Docker workflow live/E2E release-path, і в сегмент package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський workflow скасовано, тож новіша валідація main
не стоїть позаду застарілого двогодинного запуску release-check. Валідація release branch/tag
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E сегменти

Дочірній live/E2E реліз зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані сегменти через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви сегментів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` лишаються чинними для ручних одноразових повторних запусків.

Нативні live media segments запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед setup. Тримайте live suites на базі Docker на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Live model/backend segments на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає та публікує цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness segments запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker segments мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб застряглий контейнер або шлях очищення швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці сегменти самостійно перебудовують повну source Docker target, релізний запуск налаштовано неправильно і він марнуватиме wall clock на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей installable пакет OpenClaw як продукт?» Він відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, яким користувачі послуговуються після встановлення або оновлення.

### Завдання

1. `resolve_package` перевіряє `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-лінії для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance визначив його; автономний Telegram dispatch усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або опціональна Telegram-лінія зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або тегу релізу, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опціональним, але його варто надавати для артефактів, поширених назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/обв’язки, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дозволяє поточній тестовій обв’язці перевіряти старі довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття plugin, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Опціональна Telegram-лінія повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних dispatch.

Перевірки релізу викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти release-path покривають перетин ліній package/update/plugin; Package Acceptance зберігає artifact-native proof для сумісності bundled-channel, offline plugin і Telegram щодо того самого визначеного tarball пакета. Cross-OS перевірки релізу все ще покривають специфічні для ОС onboarding, installer і platform behavior; перевірку продукту package/update слід починати з Package Acceptance. Docker-лінія `published-upgrade-survivor` перевіряє одну опубліковану baseline пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опубліковану baseline, за замовчуванням `openclaw@latest`; команди rerun для failed-lane зберігають цю baseline. Встановіть `published_upgrade_survivor_baselines=release-history`, щоб розширити лінію на дедупліковану history matrix: останні шість stable-релізів, `2026.4.23` і останній stable-реліз до `2026-03-15`. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для Feishu config/runtime-deps, збережених bootstrap/persona-файлів, tilde log paths і застарілих versioned runtime-deps roots. Локальні aggregate-запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну лінію з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікована лінія налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC-статус після запуску Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4-mini`, щоб proof встановлення й gateway залишався швидким і детермінованим.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені вікна сумісності зі спадщиною для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, отриманого з tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати застарілі місця install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволяти міграцію config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли штампа local build metadata, які вже були випущені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди rerun. Надавайте перевагу повторному запуску невдалого package profile або точних Docker lanes замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package surfaces, змін bundled plugin package/manifest або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише source-only bundled plugin, редагування лише tests і редагування лише docs не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений bundled-plugin Docker profile з aggregate command timeout 240 секунд (Docker run кожного сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі завдання, щоб installer work не чекав за root image smokes.

Пуші в `main` (зокрема merge commits) не примушують повний шлях; коли changed-scope logic запитувала б full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для нічної або release validation.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а manual `Install Smoke` dispatches можуть увімкнути його, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для normal functionality lanes.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної лінії через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                           |
| -------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних доріжок.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-пулу, чутливого до провайдерів.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Обмеження одночасних live-доріжок, щоб провайдери не застосовували throttling.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Обмеження одночасних доріжок установлення npm.                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Обмеження одночасних багатосервісних доріжок.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами доріжок, щоб уникнути шквалу створень Docker daemon; установіть `0` без затримки. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут на доріжку (120 хвилин); вибрані live/tail-доріжки використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано       | `1` друкує план планувальника без запуску доріжок.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано       | Розділений комами список точних доріжок; пропускає cleanup smoke, щоб агенти могли відтворити одну збійну доріжку. |

Доріжка, важча за свій ефективний ліміт, усе одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить ємність. Локальний агрегатор виконує preflight Docker, видаляє застарілі OpenClaw E2E-контейнери, виводить стан активних доріжок, зберігає тривалості доріжок для впорядкування від найдовших, і типово припиняє планувати нові pooled-доріжки після першого збою.

### Перевикористовуваний live/E2E workflow

Перевикористовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, доріжки й облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і підсумки. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує bare/functional GHCR Docker E2E-образи з тегами package digest через кеш шарів Docker від Blacksmith, коли план потребує доріжок із установленим пакетом; і перевикористовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з package digest замість повторної збірки. Pull Docker-образів повторюється з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Фрагменти release-шляху

Release Docker-покриття запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний тип образу й виконував кілька доріжок через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні release Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими aliases для plugin/runtime. Alias доріжки `install-e2e` залишається агрегованим ручним alias повторного запуску для обох доріжок інсталятора провайдерів. Фрагмент `bundled-channels` запускає розділені доріжки `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one доріжки `bundled-channel-deps`.

OpenWebUI включається в `plugins-runtime-services`, коли повне покриття release-path його запитує, і зберігає окремий фрагмент `openwebui` лише для dispatches тільки OpenWebUI. Доріжки оновлення bundled-channel повторюють спробу один раз для тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` із логами доріжок, тривалостями, `summary.json`, `failures.json`, тривалостями фаз, JSON плану планувальника, таблицями повільних доріжок і командами повторного запуску для кожної доріжки. Input workflow `docker_lanes` запускає вибрані доріжки проти підготовлених образів замість chunk-завдань, що обмежує налагодження збійної доріжки одним цільовим Docker-завданням і готує, завантажує або перевикористовує артефакт пакета для цього запуску; якщо вибрана доріжка є live Docker-доріжкою, цільове завдання збирає live-test образ локально для цього повторного запуску. Згенеровані для кожної доріжки GitHub-команди повторного запуску містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб збійна доріжка могла перевикористати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker-набір.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, pushes у `main` і standalone ручні CI dispatches тримають цей набір вимкненим. Він балансує тести bundled plugin між вісьмома extension workers; ці extension shard-завдання запускають до двох груп plugin config одночасно з одним Vitest worker на групу й більшим heap Node, щоб насичені імпортами plugin-batches не створювали додаткових CI-завдань. Release-only Docker prerelease path групує цільові Docker-доріжки в невеликі групи, щоб не резервувати десятки runners для завдань на одну-три хвилини.

## QA Lab

QA Lab має окремі CI-доріжки поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгортає mock parity gate, live Matrix-доріжку, а також live Telegram і Discord-доріжки як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport-доріжки з детермінованим mock provider і mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку memory; з’єднання з провайдерами покривають окремі набори live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix-покриття на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab-доріжки перед схваленням release; його QA parity gate запускає candidate і baseline packs як паралельні lane-завдання, потім завантажує обидва артефакти в невелике report-завдання для фінального порівняння parity.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test вважайте це необов’язковим сигналом і дотримуйтеся scoped CI/check-доказів.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним скануванням репозиторію. Daily, manual і non-draft pull request guard runs сканують код Actions workflow плюс найризикованіші поверхні JavaScript/TypeScript за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                         |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні Plugin SDK SSRF policy                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading і trust-поверхні контракту пакета Plugin SDK     |

### Платформо-специфічні security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза daily defaults, бо збірка macOS домінує runtime навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких високоцінних поверхнях на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і reply dispatch, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це навчальні/ітераційні хуки для запуску одного якісного шарда ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Автентифікація, секрети, пісочниця, cron і код межі безпеки Gateway                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти введення-виведення                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти основних каналів і реалізації вбудованих Plugin каналів                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація та черги автовідповідей, а також runtime-контракти площини керування ACP                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери й мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам'яті, runtime-фасади пам'яті, псевдоніми Plugin SDK пам'яті, клейовий код активації runtime пам'яті та команди doctor для пам'яті                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, допоміжні засоби прив'язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і CLI-контракти doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна диспетчеризація відповідей Plugin SDK, допоміжні засоби payload/розбиття на фрагменти/runtime для відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби прив'язування сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, стандартні налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Ініціалізація Control UI, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні web fetch/search, media IO, розуміння медіа, генерація зображень і runtime-контракти генерації медіа                                                                 |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код Plugin SDK на боці пакета та допоміжні засоби контрактів пакетів Plugin                                                                           |

Якість залишається окремо від безпеки, щоб результати перевірок якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як обмежену за областю або розшардовану подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована смуга супроводу Codex для підтримання наявної документації у відповідності з нещодавно доданими змінами. Він не має чистого розкладу: успішний CI-запуск push від небота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики через workflow-run пропускаються, коли `main` уже зрушив далі або коли інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного вихідного SHA Docs Agent до поточного `main`, тож один щогодинний запуск може покрити всі зміни main, накопичені від останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована смуга супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push від небота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний шлюз активності. Смуга формує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість прохідних тестів. Якщо базовий стан має падіння тестів, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед будь-яким комітом. Коли `main` просувається до того, як push бота потрапить у репозиторій, смуга перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати таку саму безпечну позицію drop-sudo, як і агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес супровідника для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landing PR змерджено і що кожен дублікат має або спільне згадане issue, або перетин змінених hunk.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні контрольні шлюзи та маршрутизація змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний шлюз суворіший щодо архітектурних меж, ніж широка область платформи CI:

- зміни основного production-коду запускають typecheck основного prod і основних тестів, а також основні lint/guards;
- зміни лише основних тестів запускають тільки typecheck основних тестів плюс основний lint;
- зміни production-коду розширень запускають typecheck prod і тестів розширень плюс lint розширень;
- зміни лише тестів розширень запускають typecheck тестів розширень плюс lint розширень;
- зміни публічного Plugin SDK або контрактів Plugin розширюються до typecheck розширень, бо розширення залежать від цих основних контрактів (sweep-и Vitest для розширень залишаються явною тестовою роботою);
- version bump-и лише метаданих релізу запускають цільові перевірки версії/конфігурації/root-dependency;
- невідомі зміни root/config безпечно падають до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, редагування вихідного коду віддають перевагу явним мапінгам, потім sibling-тестам і залежним за import-graph. Конфігурація доставки shared group-room — один із явних мапінгів: зміни конфігурації group visible-reply, режиму доставки source reply або системного prompt message-tool проходять через основні тести відповідей плюс регресії доставки Discord і Slack, щоб зміна спільного стандартного значення падала ще до першого push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо широка для harness, що дешевий змеплений набір не є надійним проксі.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію та віддавайте перевагу свіжому прогрітому box для широкого доказу. Перш ніж витрачати повільний шлюз на box, який було повторно використано, термін якого сплив або який щойно повідомив про несподівано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли зникли потрібні root-файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження падіння product-тесту. Для навмисних PR із великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п'ять хвилин без виводу після синхронізації. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

## Пов'язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
