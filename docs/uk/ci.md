---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується невдачею.
    - Ви координуєте запуск або повторний запуск перевірки релізу
summary: Граф завдань CI, перевірки за областю охоплення, релізні парасольки та локальні відповідники команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-30T05:19:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80e0edd99f9832bed0c50d2f66b56163e32859e627090e6bf6b9ad7aa5f63d43
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається на кожен push до `main` і кожен pull request. Завдання `preflight` класифікує diff і вимикає витратніші лінії, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для release candidates і широкої валідації. Лінії Android залишаються опціональними через `include_android`. Релізне покриття Plugin живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує маніфест CI   | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без встановлення залежностей проти npm advisories                  | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий aggregate для швидких завдань безпеки                                           | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів              | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux лінії коректності, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate результатом перевірки             | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Shards тестів Core Node, крім channel, bundled, contract і extension ліній                   | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збірки та smoke для сумісності з Node 22                                               | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс регресії shared runtime import specifier      | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                               | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не самостійними завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux лініями, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Після цього розгортаються важчі platform і runtime лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний concurrency key CI версіонований (`CI-v7-*`), щоб zombie з боку GitHub у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і маршрутизація

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Зміни CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **CI routing-only edits, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю лінію; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node тестів розділені або збалансовані так, щоб кожне завдання лишалося малим без надмірного резервування runners: channel contracts виконуються як три weighted shards, малі core unit lanes спарені, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із BuildConfig flags для SMS/call-log, уникаючи duplicate debug APK packaging job на кожен Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на останній версії Knip, з вимкненим мінімальним віком релізу pnpm для встановлення через `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий невикористаний файл або залишає stale allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні dispatches

Ручні CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, релізний shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Опціональний input `target_ref` дає trusted caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                      | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/пакетних компонентів, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; передперевірка install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів пакетних Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` — це ручний парасольковий workflow для "запустити все перед релізом". Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних підтверджень Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів тестів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати після публікації workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує шириною live/provider, переданою в release checks:

- `minimum` залишає найшвидші критичні для релізу OpenAI/core lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапустили і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та зведення часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `release-checks` для кожного дочірнього релізного завдання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує перезапуск невдалого релізного середовища в межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв'язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт як у live/E2E workflow Docker release-path, так і в шард package acceptance. Це зберігає байти пакета узгодженими між релізними середовищами та уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- split media audio/video shards and provider-filtered music shards

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних live-збоїв provider. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Залишайте Docker-backed live набори тестів на звичайних Blacksmith runner — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed шарди live model/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей образ один раз, а потім Docker live model, gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker target, release run налаштований неправильно і марнуватиме wall clock на дублікати збірок образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево source, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв'язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у зведенні кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, перевіряє inventory tarball, готує package-digest Docker-образи за потреби та запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, багаторазовий workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв'язав його; автономний dispatch Telegram усе ще може встановити опубліковану npm spec.
4. `summary` завершує workflow з помилкою, якщо package resolution, Docker acceptance або опціональний Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію випуску OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable версій.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або тега випуску, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового обв’язування, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому обв’язуванню перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker шляху випуску з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugin, тому перевірка опублікованого пакета не залежить від доступності ClawHub наживо. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях специфікації опублікованого npm зберігається для автономних запусків.

Перевірки випуску викликають приймання пакета з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти шляху випуску покривають перетин ліній package/update/plugin; приймання пакета зберігає артефактно-нативні докази bundled-channel compat, офлайн plugin і Telegram для того самого розв’язаного tarball пакета. Міжплатформні перевірки випуску й далі покривають специфічну для ОС поведінку онбордингу, інсталятора й платформи; валідація продукту package/update має починатися з приймання пакета. Лінії свіжого запуску пакетованого Windows та інсталятора також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із сирого абсолютного шляху Windows. Міжплатформний smoke agent-turn OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо задано, інакше `openai/gpt-5.4-mini`, щоб доказ встановлення й Gateway залишався швидким і детермінованим.

### Вікна сумісності зі спадковими версіями

Приймання пакета має обмежені вікна сумісності зі спадковими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть указувати на файли, опущені з tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` з фіктивного git-фікстура, похідного від tarball, і може логувати відсутній збережений `update.channel`;
- plugin smoke-тести можуть читати спадкові розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб запис встановлення й поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампів метаданих збірки, які вже були доставлені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію і SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної валідації випуску.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий сценарій визначення області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/package, змін пакета/маніфесту вбудованого plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованого plugin, редагування лише тестів і редагування лише документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke видалення agents shared-workspace, запускає контейнерний gateway-network e2e, перевіряє аргумент збірки вбудованого розширення і запускає обмежений Docker-профіль вбудованого plugin із сукупним тайм-аутом команди 240 секунд (кожен Docker-запуск сценарію обмежується окремо).
- **Повний шлях** зберігає покриття встановлення QR-пакета та Docker/update інсталятора для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR smoke-образ кореневого Dockerfile для цільового SHA, потім запускає встановлення QR-пакета, smoke-тести кореневого Dockerfile/gateway, smoke-тести installer/update і швидкий Docker E2E вбудованого plugin як окремі завдання, щоб робота інсталятора не чекала за smoke-тестами кореневого образу.

Пуші в `main` (включно з merge-комітами) не примушують повний шлях; коли логіка області змін просила б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні запуски `Install Smoke` можуть явно ввімкнути його, але pull request і пуші в `main` не роблять цього. QR і Docker-тести інсталятора зберігають власні Dockerfile, сфокусовані на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний runner Node/Git для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштовувані параметри

| Змінна                                | Типове значення | Призначення                                                                                                   |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10              | Кількість слотів основного пулу для звичайних ліній.                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-пулу, чутливого до провайдерів.                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9               | Ліміт одночасних live-ліній, щоб провайдери не throttling.                                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10              | Ліміт одночасних ліній встановлення npm.                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7               | Ліміт одночасних багатосервісних ліній.                                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами ліній, щоб уникнути сплесків створення в Docker daemon; задайте `0`, щоб вимкнути її.  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000         | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження.        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset           | `1` друкує план планувальника без запуску ліній.                                                              |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset           | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить ємність. Локальні сукупні preflight-перевірки перевіряють Docker, видаляють застарілі контейнери OpenClaw E2E, виводять статус активних ліній, зберігають таймінги ліній для впорядкування від найдовших до найкоротших і за замовчуванням припиняють планувати нові pooled лінії після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії й облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й пушить GHCR Docker E2E образи bare/functional з тегами за дайджестом пакета через кеш Docker-шарів Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з дайджестом пакета замість повторної збірки. Pull Docker-образів повторюється з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий stream registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Фрагменти шляху випуску

Docker-покриття випуску запускає менші фрагментовані завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох ліній інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну універсальну лінію `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли цього вимагає повне покриття шляху релізу, і зберігає окремий фрагмент `openwebui` лише для диспетчеризацій тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` із журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість завдань фрагментів, що обмежує налагодження збійної лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання збирає образ live-test локально для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної лінії включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, тож збійна лінія може повторно використати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір шляху релізу.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який диспетчеризується `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і самостійні ручні диспетчеризації CI тримають цей набір вимкненим. Він балансує тести bundled plugin між вісьмома extension-працівниками; ці завдання extension shard запускають до двох груп конфігурації plugin одночасно з одним Vitest-працівником на групу та більшим heap Node, щоб імпортомісткі пакети plugin не створювали додаткових CI-завдань.

## Лабораторія QA

Лабораторія QA має виділені CI-лінії поза основним workflow зі smart-scoped.

- Workflow `Parity gate` запускається за відповідних змін PR і ручної диспетчеризації; він збирає приватний QA runtime і порівнює agentic-пакети mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручної диспетчеризації; він розгалужує mock parity gate, live Matrix-лінію та live Telegram і Discord-лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex-оренди.

Перевірки релізу запускають live transport-лінії Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і вхід ручного workflow залишаються `all`; ручна диспетчеризація `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критично важливі для релізу лінії лабораторії QA перед затвердженням релізу; його QA parity gate запускає candidate і baseline-пакети як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике завдання звіту для фінального порівняння parity.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналу, конфігурації, документації або unit-тестів вважайте це необов’язковим сигналом і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та non-draft guard-запуски pull request сканують код Actions workflow плюс JavaScript/TypeScript-поверхні з найвищим ризиком із високодостовірними security queries, відфільтрованими до високої/критичної `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму високодостовірну security matrix, що й запланований workflow. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                          | Поверхня                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова лінія gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс runtime channel plugin, gateway, Plugin SDK, secrets, точки дотику audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні політики SSRF Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і gates виконання agent tool                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading і контракту пакета Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати збирання залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Утримується поза щоденними типовими запусками, бо macOS build домінує runtime навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним shard безпеки, що не стосується. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries над вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за запланований profile: non-draft PR запускають лише відповідні shards `channel-runtime-boundary`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `plugin-boundary` і `plugin-sdk-package-contract` для змін channel runtime, gateway protocol/server-method, MCP/process/outbound delivery, provider runtime/model catalog, plugin loader, Plugin SDK або package-contract. Зміни конфігурації CodeQL і quality workflow запускають усі шість PR quality shards.

Ручна диспетчеризація приймає:

```
profile=all|channel-runtime-boundary|gateway-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є навчальними/ітераційними hooks для запуску одного quality shard ізольовано.

| Категорія                                                | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки Auth, secrets, sandbox, cron і gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Контракти config schema, migration, normalization і IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas і контракти server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації core channel                                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution, model/provider dispatch, auto-reply dispatch і queues, а також runtime-контракти ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers і tool bridges, process supervision helpers, а також outbound delivery contracts                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, glue активації memory runtime і команди memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми reply queue, session delivery queues, outbound session binding/delivery helpers, поверхні diagnostic event/log bundle і session doctor CLI contracts |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows і runtime-контракти task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти Loader, registry, public-surface і Plugin SDK entrypoint                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане package-side джерело Plugin SDK і helpers контракту пакета plugin                                                                                      |

Якість залишається відокремленою від безпеки, щоб висновки щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як обмежену за сферою або розділену подальшу роботу лише після того, як вузькі профілі матимуть стабільний час виконання та сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це керована подіями лінія обслуговування Codex для підтримання наявної документації у відповідності з нещодавно внесеними змінами. Він не має суто розкладу: успішний запуск CI після push не від бота в `main` може його запустити, а ручний запуск може виконати його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він виконується, він переглядає діапазон комітів від попереднього непропущеного вихідного SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це керована подіями лінія обслуговування Codex для повільних тестів. Він не має суто розкладу: успішний запуск CI після push не від бота в `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний запуск обходить цей щоденний шлюз активності. Лінія створює згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість тестів, які проходять. Якщо базовий стан має тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед тим, як будь-що буде закомічено. Коли `main` просувається до того, як push бота потрапляє в репозиторій, лінія перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-хостинговий Ubuntu, щоб дія Codex могла зберігати таку саму безпечну позицію drop-sudo, як і агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для очищення дублікатів після внесення змін. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що внесений PR злито й що кожен дублікат має або спільне згадане issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check-шлюзи та маршрутизація змін

Логіка локальних changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check-шлюз суворіший щодо архітектурних меж, ніж широка сфера CI-платформи:

- зміни production-коду core запускають typecheck core prod і core test, а також core lint/guards;
- зміни лише в тестах core запускають тільки typecheck core test плюс core lint;
- зміни production-коду extension запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише в тестах extension запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extension залежать від цих core-контрактів (прогони Vitest для extension залишаються явною тестовою роботою);
- version bump лише release-метаданих запускають цільові перевірки версії/конфігурації/root-dependency;
- невідомі зміни root/config безпечно переходять до всіх check-ліній.

Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни вихідного коду надають перевагу явним мапінгам, потім sibling-тестам і залежним елементам import-graph. Спільна конфігурація доставлення group-room є одним із явних мапінгів: зміни до конфігурації visible-reply для group, режиму deliver source reply або системного prompt message-tool проходять через core reply-тести плюс регресії доставлення Discord і Slack, щоб зміна спільного значення за замовчуванням впала до першого push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо широка для harness, що дешевий зіставлений набір не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й надавайте перевагу свіжій прогрітій box для широкого proof. Перед тим як витрачати повільний шлюз на box, яку було повторно використано, термін якої сплив або яка щойно повідомила про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли обов’язкові root-файли, такі як `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цю box і прогрійте свіжу замість налагодження збою продуктового тесту. Для навмисних PR із великою кількістю видалень задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
