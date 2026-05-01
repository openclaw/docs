---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви діагностуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, шлюзи за областю дії, релізні парасолі та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-01T08:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається на кожному push у `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для реліз-кандидатів і широкої валідації. Лінії Android залишаються опційними через `include_android`. Релізне покриття Plugin живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує manifest CI   | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                  | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язкова aggregate-перевірка для швидких завдань безпеки                                  | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів       | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і перевикористовні downstream artifacts | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded-перевірки channel contract зі стабільним aggregate-результатом перевірки             | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди core Node tests, без ліній channel, bundled, contract і extension                      | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node    |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести built-CLI і smoke startup-memory                                                 | Зміни, релевантні для Node         |
| `checks`                         | Verifier для channel tests built-artifact                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності Node 22 і smoke-лінія                                                      | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                      | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Windows-специфічні тести process/path плюс регресії shared runtime import specifier          | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням shared built artifacts                        | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка й тести для macOS-застосунку                                              | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime лінії розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow вже був superseded. Автоматичний concurrency key CI версіонований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Зміни CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються прив’язаними до platform source changes.
- **Routing-only зміни CI, вибрані cheap core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task безпосередньо перевіряє.
- **Windows Node checks** обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю лінію; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші родини Node tests розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes згруповані попарно, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards конкурентно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для залежностей, закріплений на latest Knip version, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює Knip production unused-file findings із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Ручні dispatches

Ручні CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну scoped lane не для Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Окремі ручні CI dispatches запускають Android лише з `include_android=true`; повна релізна парасолька вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Опційний input `target_ref` дає довіреному caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Засіб виконання                  | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; передперевірка install-smoke також використовує GitHub-хостований Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, менш ресурсомісткі шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих plugin, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі 32-vCPU коштував дорожче, ніж заощаджував)                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## Локальні відповідники

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

## Повна валідація випуску

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед випуском». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для release-only proof plugin/пакета/статичних ресурсів/Docker, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і смуг Telegram. Він також може запускати після публікації workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

Див. [Повну валідацію випуску](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
цільових ручок повторного запуску.

`release_profile` керує шириною live/provider, що передається до перевірок випуску. Ручні workflow випуску за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка рекомендаційна матриця provider/media.

- `minimum` залишає найшвидші критичні для випуску смуги OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку рекомендаційну матрицю provider/media.

Парасолька записує id запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній workflow перезапущено й він стає зеленим, перезапустіть лише батьківське завдання верифікатора, щоб оновити результат парасольки та підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на випуск, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease plugin, `release-checks` для кожного дочірнього завдання випуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це утримує повторний запуск невдалого release box у межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і до live/E2E release-path Docker workflow, і до шарда package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати прогонів `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow,
який він уже запустив, коли батьківський скасовано, тож новіша валідація main
не стоятиме за застарілим двогодинним прогоном release-check. Валідація release-гілок/тегів
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній live/E2E випуск зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені шарди audio/video для media та відфільтровані за provider шарди music

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media шарди виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. У цьому образі попередньо встановлено `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних раннерах Blacksmith — контейнерні завдання є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live model/backend шарди використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для вибраного коміту. Live release workflow збирає й публікує цей образ один раз, а потім Docker live model, шардований за provider Gateway, CLI backend, ACP bind і шарди Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker шарди мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, release-прогін налаштовано неправильно, і він марнуватиме wall clock на дублікати збірок образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Він відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

### Завдання

1. `resolve_package` витягує `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, вивантажує обидва як артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи з digest пакета й запускає вибрані Docker-напрями для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці напрями як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` за бажанням викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; окремий dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або необов’язковий напрям Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний commit SHA. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового harness, який запускає тест. `package_ref` — це вихідний commit, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старі довірені вихідні commit без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти release-path Docker з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugin, щоб валідація опублікованого пакета не залежала від доступності live ClawHub. Необов’язковий напрям Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для окремих dispatch.

Релізні перевірки викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Фрагменти release-path Docker покривають суміжні напрями package/update/plugin; Package Acceptance зберігає artifact-native перевірку сумісності bundled-channel, офлайн plugin і доказ Telegram для того самого визначеного package tarball. Cross-OS релізні перевірки все ще покривають OS-специфічний onboarding, installer і поведінку платформи; валідацію продукту package/update слід починати з Package Acceptance. Docker-напрям `published-upgrade-survivor` перевіряє один опублікований базовий пакет за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає резервну опубліковану baseline, за замовчуванням `openclaw@latest`; команди повторного запуску невдалого напряму зберігають цю baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розширити напрям до дедуплікованої матриці історії: останні шість stable-релізів, `2026.4.23` і останній stable-реліз до `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-подібні fixtures для конфігурації/runtime-deps Feishu, збережених bootstrap/persona файлів, шляхів журналів із тильдою та застарілих versioned runtime-deps коренів. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати один напрям із `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікований напрям налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Свіжі напрями packaged і installer для Windows також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо задано, інакше `openai/gpt-5.4-mini`, тому доказ встановлення й Gateway залишається швидким і детермінованим.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна сумісності зі спадковими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні записи QA у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може прибрати відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати спадкові розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволити міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні build metadata stamp files, які вже були shipped. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови спричиняють помилку замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали напрямів, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-напрямів замість повторного запуску повної релізної валідації.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт scope через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що зачіпають Docker/package surfaces, зміни bundled plugin package/manifest або core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений bundled-plugin Docker profile під 240-секундним aggregate command timeout (кожен Docker-запуск сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У повному режимі install-smoke готує або повторно використовує один GHCR root Dockerfile smoke image для target-SHA, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб installer work не очікувала за root image smokes.

Пуші в `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope запитувала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо контролюється `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow релізних перевірок, а manual dispatches `Install Smoke` можуть увімкнути його, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для напрямів installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожного напряму за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає напрями з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                 | Типове значення | Призначення                                                                                                      |
| -------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних ліній.                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів хвостового пулу для ліній, чутливих до провайдерів.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Обмеження одночасних ліній встановлення npm.                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Обмеження одночасних багатосервісних ліній.                                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Рознесення запусків ліній, щоб уникнути сплесків створення в Docker daemon; установіть `0`, щоб вимкнути його.   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут на лінію (120 хвилин); вибрані live/хвостові лінії використовують жорсткіші обмеження.        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано       | `1` виводить план планувальника без запуску ліній.                                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано       | Розділений комами точний список ліній; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за її ефективне обмеження, усе ще може стартувати з порожнього пулу, а потім працює самостійно, доки не звільнить місткість. Локальний агрегатор попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E-контейнери, виводить стан активних ліній, зберігає таймінги ліній для впорядкування від найдовших, і за замовчуванням припиняє планувати нові пулові лінії після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, який пакет, тип образу, live-образ, лінія та покриття обліковими даними потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summary. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує bare/functional GHCR Docker E2E-образи з тегом package digest через кеш Docker-шарів Blacksmith, коли план потребує ліній зі встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package digest замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшість критичного шляху CI.

### Фрагменти шляху релізу

Релізне Docker-покриття запускає менші фрагментовані завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу та виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні релізні Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` лишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` лишаються агрегованими псевдонімами Plugin/runtime. Псевдонім лінії `install-e2e` лишається агрегованим ручним псевдонімом повторного запуску для обох ліній інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну універсальну лінію `bundled-channel-deps`.

OpenWebUI включається в `plugins-runtime-services`, коли повне покриття release-path цього потребує, і зберігає окремий фрагмент `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз для тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість фрагментованих завдань, що обмежує налагодження невдалої лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір release-path.

## Попередній реліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push у `main` і автономні ручні CI dispatch не запускають цей набір. Він балансує тести bundled Plugin між вісьмома extension-воркерами; ці shard-завдання extension виконують до двох груп конфігурації Plugin одночасно з одним Vitest-воркером на групу та більшим heap Node, щоб import-heavy партії Plugin не створювали додаткових CI-завдань. Релізний Docker prerelease path групує цільові Docker-лінії в невеликі групи, щоб не резервувати десятки runner для завдань тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має окремі CI-лінії поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і ручному dispatch; він збирає приватний QA runtime і порівнює agentic-паки mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при ручному dispatch; він розгортає mock parity gate, live Matrix-лінію та live Telegram і Discord лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex.

Релізні перевірки запускають live transport-лінії Matrix і Telegram з deterministic mock provider та mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук у пам’яті, тому що QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і input ручного workflow лишаються `all`; ручний dispatch `matrix_profile=all` завжди розділяє повне Matrix-покриття на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критично важливі для релізу лінії QA Lab перед схваленням релізу; його QA parity gate запускає candidate і baseline паки як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике звітне завдання для фінального parity-порівняння.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, model-pack parity або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів вважайте це необов’язковим сигналом і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким первинним security scanner, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard-запуски сканують код Actions workflow плюс найризикованіші JavaScript/TypeScript поверхні з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard лишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts плюс runtime channel plugin, gateway, Plugin SDK, secrets, audit touchpoints                    |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні SSRF policy Plugin SDK                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading і trust surfaces package contract Plugin SDK     |

### Платформозалежні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Утримується поза щоденними типовими запусками, бо macOS build домінує runtime навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за запланований профіль: non-draft PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і dispatch replies, коді config schema/migration/IO, auth/secrets/sandbox/security коді, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це хуки для навчання/ітерації, щоб запускати один якісний шард ізольовано.

| Категорія                                               | Поверхня                                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автоматичних відповідей, а також runtime-контракти площини керування ACP                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам'яті, runtime-фасади пам'яті, псевдоніми SDK пам'яті Plugin, зв'язувальний код активації runtime пам'яті та команди doctor для пам'яті                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, допоміжні засоби прив'язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна диспетчеризація відповідей Plugin SDK, допоміжні засоби payload/розбиття на фрагменти/runtime для відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби прив'язування сеансів/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, стандартні значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap інтерфейсу керування, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні runtime-контракти web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на боці пакета та допоміжні засоби контрактів пакетів Plugin                                                                                    |

Якість залишається окремою від безпеки, щоб знахідки щодо якості можна було планувати, вимірювати, вимикати або розширювати, не затуляючи сигнал безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільні runtime і сигнал.

## Робочі процеси обслуговування

### Агент документації

Робочий процес `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли за останню годину було створено інший непропущений запуск Docs Agent. Під час запуску він переглядає діапазон комітів від попереднього непропущеного SHA джерела Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з моменту останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується того самого дня UTC. Ручний dispatch обходить цей щоденний запобіжник активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед тим, як щось буде закомічено. Коли `main` просувається вперед до того, як bot push потрапить у репозиторій, лінія перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Він використовує GitHub-хостований Ubuntu, щоб дія Codex могла зберігати таку саму позицію безпеки drop-sudo, як агент документації.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для прибирання дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено й що кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні контрольні шлюзи та маршрутизація змін

Локальна логіка змінених смуг живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний шлюз суворіше ставиться до архітектурних меж, ніж широка область платформи CI:

- зміни виробничого коду ядра запускають перевірку типів core prod і core test, а також lint/guards ядра;
- зміни лише в тестах ядра запускають тільки перевірку типів core test і lint ядра;
- зміни виробничого коду розширень запускають перевірку типів extension prod і extension test, а також lint розширень;
- зміни лише в тестах розширень запускають перевірку типів extension test і lint розширень;
- зміни публічного Plugin SDK або контракту Plugin розширюються до перевірки типів розширень, бо розширення залежать від цих контрактів ядра (розгортальні перевірки розширень Vitest залишаються явною тестовою роботою);
- зміни лише метаданих релізної версії запускають цільові перевірки версії, конфігурації та кореневих залежностей;
- невідомі зміни кореня/конфігурації безпечно переходять до всіх смуг перевірок.

Локальна маршрутизація змінених тестів живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерельного коду віддають перевагу явним зіставленням, потім спорідненим тестам і залежним елементам графа імпортів. Спільна конфігурація доставки групової кімнати є одним з явних зіставлень: зміни конфігурації видимої відповіді групи, режиму доставки відповіді джерела або системної підказки інструмента повідомлень проходять через тести відповідей ядра, а також регресії доставки Discord і Slack, щоб зміна спільного стандартного значення падала ще до першого push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка для всього harness, що дешевий зіставлений набір не є надійним наближенням.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію та віддавайте перевагу свіжій прогрітій box для широкого підтвердження. Перш ніж витрачати повільний шлюз на box, яку було використано повторно, термін дії якої минув або яка щойно повідомила про несподівано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині box.

Перевірка sanity швидко падає, коли потрібні кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що віддалений стан синхронізації не є надійною копією PR; зупиніть цю box і прогрійте свіжу замість налагодження збою продуктового тесту. Для PR із навмисним великим видаленням задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п'ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей запобіжник, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий віддалений шлях box, яким володіє репозиторій, для підтвердження Linux, коли Blacksmith недоступний або коли бажано використати власну хмарну потужність. Прогрійте box, гідратуйте її через проєктний workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` володіє стандартними налаштуваннями provider, sync і гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних remotes і сховищ об'єктів maintainer, і виключає локальні runtime/build артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, отриманням `origin/main` і передачею несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` підхоплюють як source.

## Пов'язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
