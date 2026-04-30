---
read_when:
    - Потрібно з’ясувати, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск перевірки випуску
summary: Граф завдань CI, перевірки за областю дії, релізні зведені перевірки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-30T05:47:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cdbf803e7a6c7ad75cd499234a58443e2a36557c34972f59ea144e0ebd3a6f4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний graph для release candidates і широкої валідації. Android lanes лишаються опційними через `include_android`. Release-only покриття плагінів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд Pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, змінені scopes, змінені extensions і будує CI manifest              | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Production-аудит lockfile без установлення залежностей за npm advisories                     | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів       | Node-релевантні зміни              |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built artifacts і повторно використовувані downstream artifacts | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                      | Node-релевантні зміни              |
| `checks-node-core-test`          | Shards тестів Core Node, без channel, bundled, contract і extension lanes                    | Node-релевантні зміни              |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke | Node-релевантні зміни              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-релевантні зміни              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-релевантні зміни              |
| `checks`                         | Верифікатор для built-artifact channel tests                                                 | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для releases    |
| `check-docs`                     | Форматування docs, lint і перевірки broken links                                             | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні тести process/path плюс regressions shared runtime import specifier       | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                            | Успішний Main CI або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Автоматичний CI concurrency key має версію (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може безстроково блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не змушують Windows, Android або macOS native builds; ці platform lanes лишаються scoped до platform source changes.
- **CI routing-only edits, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли change обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-специфічних process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes лишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділено або збалансовано, щоб кожне job лишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes поєднано в пари, auto-reply запускається як чотири balanced workers (із розбиттям reply subtree на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої невеликі незалежні guards concurrently в одному job. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job під час кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або лишає застарілий allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Manual dispatches

Manual CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тож release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Опційний input `target_ref` дає trusted caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file із вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого пакета, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж економили); install-smoke Docker-збірки (час очікування в черзі 32-vCPU коштував більше, ніж економив)                                                                                                                                                                                                                                                                                       |
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

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/пакета/статичних ресурсів/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram lanes. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує широтою live/provider, що передається в перевірки релізу:

- `minimum` залишає найшвидші критичні для релізу OpenAI/core lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory-матрицю provider/media.

Парасольковий workflow записує ідентифікатори запущених дочірніх виконань, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх виконань і додає таблиці найповільніших завдань для кожного дочірнього виконання. Якщо дочірній workflow перезапустили і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасолькового workflow і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього повного CI, `release-checks` для кожного дочірнього релізного запуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольковому workflow. Це утримує повторний запуск невдалого релізного блока в межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E release-path Docker workflow, і в package acceptance shard. Це зберігає байти пакета узгодженими між релізними блоками й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live та E2E шарди

Дочірній live/E2E реліз зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені медіашарди audio/video і provider-filtered music shards

Це зберігає те саме файлове покриття, водночас роблячи повільні збої live provider простішими для повторного запуску й діагностики. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіазавдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live suites на базі Docker на звичайних Blacksmith runners — контейнерні завдання не підходять для запуску вкладених Docker-тестів.

Live model/backend shards на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей образ один раз, а потім шарди Docker live model, gateway, CLI backend, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди самостійно перебудовують повну Docker-ціль джерельного коду, релізний запуск налаштовано неправильно, і він марнуватиме настінний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей інстальовний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево джерельного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Завдання

1. `resolve_package` робить checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумок кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, багаторазовий workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; окремий запуск Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або опційний Telegram lane зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для перевірки прийнятності опублікованих beta/stable версій.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту з `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у від’єднаному робочому дереві та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надати для артефактів, що поширюються зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це початковий коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старіші довірені початкові коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття plugin, щоб перевірка опублікованого пакета не залежала від доступності живого ClawHub. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях специфікації опублікованого npm збережено для автономних запусків.

Релізні перевірки викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Фрагменти Docker release-path покривають перетин ліній package/update/plugin; Package Acceptance зберігає artifact-native перевірку сумісності bundled-channel, offline plugin і Telegram для того самого розв’язаного tarball пакета. Cross-OS релізні перевірки все ще покривають OS-specific onboarding, інсталятор і поведінку платформи; перевірку package/update продукту слід починати з Package Acceptance. Лінії Windows packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо задано, інакше `openai/gpt-5.4-mini`, тож доказ встановлення й Gateway залишається швидким і детермінованим.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені вікна сумісності зі спадщиною для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні записи QA у `dist/postinstall-inventory.json` можуть вказувати на файли, відсутні в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати застарілі розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли штампа локальних build metadata, які вже були поставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю package або точних Docker-ліній замість повторного запуску повної релізної перевірки.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт scope через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/package, змін package/manifest для bundled plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише початкового коду bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд (кожен Docker run сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і Docker/update покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call релізних перевірок і pull request, які справді торкаються поверхонь installer/package/Docker. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за root image smokes.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow релізних перевірок, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | За замовчуванням | Призначення                                                                                   |
| ------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10               | Кількість слотів main-pool для звичайних ліній.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10               | Кількість слотів tail-pool, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9                | Ліміт одночасних live-ліній, щоб провайдери не застосовували throttling.                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10               | Ліміт одночасних ліній npm install.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7                | Ліміт одночасних multi-service ліній.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000             | Інтервал між стартами ліній, щоб уникнути create storms демона Docker; задайте `0`, щоб вимкнути інтервал. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000          | Резервний таймаут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset            | `1` друкує план планувальника без запуску ліній.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset            | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за її ефективний ліміт, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить місткість. Локальний сукупний запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших і за замовчуванням припиняє планувати нові pooled lanes після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, які package, image kind, live image, lane і credential coverage потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Pull Docker images повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий registry/cache stream швидко повторювався замість споживання більшої частини критичного шляху CI.

### Фрагменти release-path

Релізне Docker-покриття запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент тягнув лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох ліній інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість послідовної лінії «усе-в-одному» `bundled-channel-deps`.

OpenWebUI включається в `plugins-runtime-services`, коли повне покриття шляху релізу цього потребує, і зберігає окремий фрагмент `openwebui` лише для диспетчеризацій, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` із журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість завдань фрагментів, що обмежує налагодження збійної лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди GitHub для повторного запуску кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, тож збійна лінія може повторно використати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір шляху релізу.

## Попередній реліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явно оператором. Звичайні pull request, пуші в `main` і самостійні ручні CI-диспетчеризації тримають цей набір вимкненим. Він балансує тести bundled plugin між вісьмома extension-воркерами; ці завдання extension-шардів запускають до двох груп конфігурації plugin одночасно з одним Vitest-воркером на групу та більшим Node heap, щоб насичені імпортами пакети plugin не створювали додаткових CI-завдань.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і ручній диспетчеризації; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручною диспетчеризацією; він розгалужує mock parity gate, live Matrix-лінію, а також live Telegram і Discord-лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex-оренди.

Перевірки релізу запускають live транспортні лінії Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і ручний вхід workflow залишаються `all`; ручна диспетчеризація `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу QA Lab-лінії перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння parity.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-test розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check докази.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та non-draft guard-запуски pull request сканують код Actions workflow разом із JavaScript/TypeScript-поверхнями найвищого ризику, використовуючи high-confidence security queries, відфільтровані до high/critical `security-severity`.

Guard pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова лінія gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                        |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні Core SSRF, розбору IP, network guard, web-fetch і політики SSRF Plugin SDK                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і gates виконання інструментів агента                                       |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для Plugin install, loader, manifest, registry, staging runtime-dependency, source-loading і package contract Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований security shard Android. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний security shard macOS. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими запуском, бо збірка macOS домінує за runtime навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його guard pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні shards `channel-runtime-boundary`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін channel runtime, gateway protocol/server-method, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, package-contract Plugin SDK або reply runtime Plugin SDK. Зміни конфігурації CodeQL і quality workflow запускають усі вісім PR quality shards.

Ручна диспетчеризація приймає:

```
profile=all|channel-runtime-boundary|gateway-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код Auth, secrets, sandbox, cron і межі безпеки Gateway                                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації каналів ядра                                                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автовідповідей, а також runtime-контракти площини керування ACP                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, помічники нагляду за процесами та контракти вихідної доставки                                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми SDK пам’яті Plugin, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми черги відповідей, черги доставки сесій, помічники прив’язки/доставки вихідних сесій, поверхні діагностичних подій/пакетів логів і CLI-контракти doctor сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, помічники payload/розбиття на chunks/runtime для відповідей, параметри відповідей каналів, черги доставки та помічники прив’язки сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, стандартні параметри/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для core web fetch/search, media IO, media understanding, image-generation і media-generation                                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код Plugin SDK з боку пакета та помічники контрактів пакетів plugin                                                                                       |

Якість лишається відокремленою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як обмежену за scope або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси підтримки

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована лінія підтримки Codex для підтримання наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого розкладу: успішний CI-запуск push від не-бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він виконується, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована лінія підтримки Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push від не-бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей денний gate активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість успішних тестів. Якщо в baseline є тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push потрапить у репозиторій, лінія rebases валідований patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати таку саму безпечну позицію drop-sudo, як і docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змарджено, і що кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни production-коду ядра запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише тестів ядра запускають тільки core test typecheck плюс core lint;
- зміни production-коду extension запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише тестів extension запускають extension test typecheck плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів (Vitest sweeps для extension лишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Конфігурація shared group-room delivery є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу свіжому прогрітому box для широкого proof. Перед тим як витрачати повільний gate на box, який повторно використовувався, протермінувався або щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root-файли, такі як `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цей box і прогрійте новий замість налагодження збою product test. Для навмисних PR із великими deletion задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається у фазі sync понад п’ять хвилин без output після sync. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diffs.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
