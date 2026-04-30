---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви діагностуєте перевірку GitHub Actions, що завершується з помилкою
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, гейти області, релізні парасольки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-30T05:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a606991e83c50e82c1e0f8f96fd582fa1c6cbd0b999af4920f1e0af66d54d944
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається при кожному push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає витратніші напрями, коли зміни стосуються лише непов’язаних ділянок. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidate та широкої валідації. Напрями Android залишаються opt-in через `include_android`. Покриття Plugin лише для релізу міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або через явний ручний dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені scope, змінені extensions і будує CI manifest     | Завжди для non-draft push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR    |
| `security-dependency-audit`      | Production-аудит lockfile без dependencies на основі npm advisories                          | Завжди для non-draft push і PR    |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                          | Завжди для non-draft push і PR    |
| `check-dependencies`             | Production-прохід Knip лише для dependencies плюс guard allowlist невикористаних файлів      | Node-релевантні зміни             |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і перевикористовувані downstream artifacts | Node-релевантні зміни          |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от bundled/plugin-contract/protocol checks              | Node-релевантні зміни             |
| `checks-fast-contracts-channels` | Sharded-перевірки channel contract зі стабільним aggregate check result                      | Node-релевантні зміни             |
| `checks-node-core-test`          | Shards тестів Core Node, без channel, bundled, contract і extension напрямів                 | Node-релевантні зміни             |
| `check`                          | Sharded-еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Node-релевантні зміни        |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-релевантні зміни             |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-релевантні зміни             |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-релевантні зміни             |
| `checks-node-compat-node22`      | Сумісність із Node 22: build і smoke lane                                                    | Ручний CI dispatch для релізів    |
| `check-docs`                     | Форматування документації, lint і перевірки broken links                                     | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для skills на Python                                                           | Зміни, релевантні Python skills   |
| `checks-windows`                 | Специфічні для Windows process/path tests плюс регресії shared runtime import specifier      | Windows-релевантні зміни          |
| `macos-node`                     | macOS TypeScript test lane із використанням спільних built artifacts                         | macOS-релевантні зміни            |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | macOS-релевантні зміни            |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                               | Android-релевантні зміни          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                            | Успішний Main CI або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не очікуючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-напрямами, щоб downstream consumers могли стартувати одразу, щойно спільний build буде готовий.
4. Після цього розгортаються важчі platform і runtime напрями: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Scope logic міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** перевіряють Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Редагування лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність із Node 22, channel contracts, повні core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes поєднані в пари, auto-reply запускається як чотири збалансовані workers (із розділенням reply subtree на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи дублювання debug APK packaging job для кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для dependencies, закріплений на latest Knip version, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Manual dispatches

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожен scoped lane, крім Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Окремі manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes вилучені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тому full suite для release candidate не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу trusted caller запускати цей graph для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Запускач                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколів/контрактів/пакетних компонентів, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди плагінів, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів пакетних плагінів, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` в `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` в `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` — це ручний парасольковий workflow для "запустити все перед релізом". Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/пакета/статичних ресурсів/Docker і запускає `OpenClaw Release Checks` для install smoke, приймання пакета, наборів release-path для Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і ліній Telegram. Він також може запустити після публікації workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує широтою live/provider, яку передають у перевірки релізу:

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання-верифікатор, щоб оновити результат парасольки й підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного дочірнього повного CI, `release-checks` для кожної релізної дочірньої перевірки або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це тримає перезапуск невдалої релізної коробки обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і в Docker workflow live/E2E release-path, і в шард приймання пакета. Це зберігає байти пакета узгодженими між релізними коробками й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live і E2E шарди

Дочірній live/E2E реліз зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені шарди медіа аудіо/відео та відфільтровані за provider шарди музики

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори з підтримкою Docker на звичайних запускачах Blacksmith — контейнерні завдання є неправильним місцем для запуску вкладених Docker-тестів.

Live model/backend шарди з підтримкою Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає й публікує цей образ, після чого шарди Docker live model, Gateway, CLI backend, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди самостійно перебудовують повну ціль Docker із джерел, релізний прогін налаштовано неправильно, і він марнуватиме загальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево джерел, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Завдання

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, посилання workflow, посилання пакета, версію, SHA-256 та профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-лінії проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав його; окремий запуск Telegram усе ще може встановити опубліковану специфікацію npm.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker-приймання або опційна лінія Telegram зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих бета- та стабільних версій.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або з тегу релізу, встановлює залежності у від’єднаному робочому дереві й пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, що поширюються зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код робочого процесу/тестового оснащення, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому оснащенню перевіряти старіші довірені вихідні коміти без запуску старої логіки робочого процесу.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти шляху релізу з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб перевірка опублікованого пакета не залежала від доступності ClawHub наживо. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних запусків.

Перевірки релізу викликають Package Acceptance із `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти шляху релізу покривають перехресні лінії пакета/оновлення/Plugin; Package Acceptance зберігає нативну для артефакта перевірку сумісності вбудованих каналів, офлайн-Plugin і Telegram для того самого розв’язаного tarball пакета. Перевірки релізу для різних ОС усе ще покривають специфічне для ОС первинне налаштування, інсталятор і поведінку платформи; продуктову перевірку пакета/оновлення слід починати з Package Acceptance. Свіжі лінії Windows для запакованого пакета й інсталятора також перевіряють, що встановлений пакет може імпортувати перевизначення керування браузером із сирого абсолютного шляху Windows. Димовий тест агентного ходу OpenAI для різних ОС за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його задано, інакше `openai/gpt-5.4-mini`, тому перевірка встановлення й Gateway лишається швидкою та детермінованою.

### Вікна сумісності зі старими версіями

Package Acceptance має обмежені вікна сумісності зі старими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` із фіктивної git-фікстури, отриманої з tarball, і може журналювати відсутній збережений `update.channel`;
- димові тести Plugin можуть читати старі розташування записів встановлення або приймати відсутність збереження запису встановлення з маркетплейса;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб запис встановлення та поведінка без перевстановлення лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли штампів метаданих локальної збірки, які вже були доставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови спричиняють помилку замість попередження або пропуску.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, тривалості фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної перевірки релізу.

## Димовий тест встановлення

Окремий робочий процес `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє димове покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які зачіпають поверхні Docker/пакета, зміни пакетів/маніфестів вбудованих Plugin або основні поверхні Plugin/каналу/Gateway/Plugin SDK, які перевіряють Docker-димові завдання. Зміни лише вихідного коду вбудованих Plugin, лише тестові правки та правки лише документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає димовий тест CLI для видалення агентів спільного робочого простору, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого розширення і запускає обмежений Docker-профіль вбудованих Plugin із 240-секундним сукупним таймаутом команди (кожен Docker-запуск сценарію обмежено окремо).
- **Повний шлях** зберігає встановлення QR-пакета й Docker/оновлювальне покриття інсталятора для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-образ кореневого Dockerfile для димового тесту цільового SHA, а потім запускає встановлення QR-пакета, димові тести кореневого Dockerfile/Gateway, димові тести інсталятора/оновлення і швидкий Docker E2E для вбудованих Plugin як окремі завдання, щоб робота інсталятора не чекала за димовими тестами кореневого образу.

Пуші в `main` (зокрема merge-коміти) не примушують повний шлях; коли логіка області змін просила б повне покриття на push, робочий процес зберігає швидкий Docker-димовий тест і залишає повний димовий тест встановлення для нічної або релізної перевірки.

Повільний димовий тест Bun global install image-provider окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з робочого процесу release checks, а ручні запуски `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` — ні. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для ліній інсталятора/оновлення/залежностей Plugin;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типово  | Призначення                                                                                                  |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу для чутливих до провайдерів ліній.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження одночасних ліній встановлення npm.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних багатосервісних ліній.                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникати штормів створення в Docker daemon; задайте `0`, щоб вимкнути її.    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` виводить план планувальника без запуску ліній.                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список ліній; пропускає димове очищення, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальна сукупна перевірка спершу перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ліній, зберігає тривалості ліній для впорядкування від найдовших і за замовчуванням припиняє планування нових pooled ліній після першої помилки.

### Перевикористовуваний live/E2E робочий процес

Перевикористовуваний live/E2E робочий процес запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub-виводи й зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує до GHCR bare/functional Docker E2E образи з тегом digest пакета через кеш Docker-шарів Blacksmith, коли план потребує ліній зі встановленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість перебудови. Завантаження Docker-образів повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий потік реєстру/кешу швидко повторився, а не споживав більшу частину критичного шляху CI.

### Фрагменти шляху релізу

Релізне Docker-покриття запускає менші фрагментовані завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами Plugin/середовища виконання. Псевдонім смуги `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох смуг інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені смуги `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну універсальну смугу `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття шляху релізу цього вимагає, і зберігає окремий фрагмент `openwebui` лише для dispatch-запусків, призначених тільки для OpenWebUI. Смуги оновлення bundled-channel виконують одну повторну спробу в разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` із журналами смуг, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Вхід `docker_lanes` workflow запускає вибрані смуги проти підготовлених образів замість завдань фрагментів, що обмежує налагодження збійної смуги одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker-смугою, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди GitHub для повторного запуску кожної смуги включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, тож збійна смуга може повторно використати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти та вивести об'єднані/посмугові цільові команди повторного запуску
pnpm test:docker:timings <summary>   # зведення повільних смуг і критичного шляху фаз
```

Запланований live/E2E workflow щодня запускає повний Docker-набір шляху релізу.

## Попередній реліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push до `main` і самостійні ручні CI dispatch-запуски залишають цей набір вимкненим. Він балансує тести bundled Plugin між вісьмома extension workers; ці завдання extension shard запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим heap Node, щоб насичені імпортами пакети Plugin не створювали додаткових CI-завдань.

## Лабораторія QA

Лабораторія QA має спеціальні CI-смуги поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається за відповідних змін у PR і ручного dispatch; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.5 і Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручного dispatch; він розгалужує mock parity gate, live Matrix-смугу та live Telegram і Discord смуги як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують lease-и Convex.

Перевірки релізу запускають live transport-смуги Matrix і Telegram з детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук пам'яті, оскільки parity QA окремо покриває поведінку пам'яті; з'єднання з провайдером покриваються окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих перевірок і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і вхід manual workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розділяє повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу смуги QA Lab перед затвердженням релізу; його QA parity gate запускає candidate і baseline пакети як паралельні завдання смуг, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння parity.

Не ставте шлях landing для PR за `Parity gate`, якщо зміна фактично не торкається середовища виконання QA, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-test вважайте це необов'язковим сигналом і натомість дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та guard-запуски для non-draft pull request сканують код Actions workflow плюс JavaScript/TypeScript-поверхні найвищого ризику з high-confidence security-запитами, відфільтрованими до high/critical `security-severity`.

Guard для pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security-матрицю, що й запланований workflow. Android і macOS CodeQL залишаються поза типовими PR-перевірками.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базовий рівень auth, secrets, sandbox, cron і gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс середовище виконання channel plugin, gateway, Plugin SDK, secrets, audit touchpoints            |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політики SSRF для core SSRF, розбору IP, network guard, web-fetch і Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, outbound delivery і gates виконання інструментів агентом                             |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, staging runtime-dependency, source-loading і контракту пакета Plugin SDK |

### Платформо-специфічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза щоденними типовими перевірками, бо збірка macOS домінує час виконання навіть у чистому стані.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality-запити над вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні shards `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у channel runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, контракті Plugin SDK/package або Plugin SDK reply runtime. Зміни конфігурації CodeQL і quality workflow запускають усі дев'ять PR quality shards.

Ручний dispatch приймає:

```
profile=all|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це hooks для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                                | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основних каналів                                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделі/провайдера, диспетчеризація автовідповідей і черги, а також контракти середовища виконання площини керування ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади середовища виконання пам’яті, псевдоніми SDK Plugin пам’яті, зв’язувальний код активації середовища виконання пам’яті та команди doctor для пам’яті                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей SDK Plugin, допоміжні засоби для payload/chunking/runtime відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби прив’язування сеансів/потоків             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація середовища виконання провайдерів, типові параметри/каталоги провайдерів і реєстри web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальне збереження, потоки керування Gateway і контракти середовища виконання площини керування завданнями                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти середовища виконання для основних web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу SDK Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело SDK Plugin на боці пакета та допоміжні засоби контракту пакета plugin                                                                                      |

Якість залишається окремою від безпеки, щоб знахідки щодо якості можна було планувати, вимірювати, вимикати або розширювати без розмивання сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як обмежену за областю або розшардовану подальшу роботу лише після того, як вузькі профілі матимуть стабільне середовище виконання та сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво керована лінія обслуговування Codex для підтримання узгодженості наявної документації з нещодавно внесеними змінами. Він не має суто розкладу: успішний CI-запуск після push не від бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він виконується, він переглядає діапазон комітів від попереднього непропущеного вихідного SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво керована лінія обслуговування Codex для повільних тестів. Він не має суто розкладу: успішний CI-запуск після push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей денний шлюз активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують базову кількість прохідних тестів. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде внесено, лінія rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб action Codex міг зберігати ту саму безпечну позицію drop-sudo, що й docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес maintainer для очищення дублікатів після внесення. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що внесений PR змержено і що кожен дублікат має або спільне згадане issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні шлюзи перевірок і маршрутизація змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний шлюз перевірки суворіший щодо архітектурних меж, ніж широка область платформи CI:

- зміни production-коду core запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише тестів core запускають тільки typecheck core test плюс core lint;
- зміни production-коду extension запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише тестів extension запускають typecheck extension test плюс extension lint;
- зміни публічного SDK Plugin або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих контрактів core (прогони Vitest extension залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, редагування джерел віддають перевагу явним мапінгам, потім sibling tests і залежним від import-graph. Конфігурація доставки shared group-room є одним із явних мапінгів: зміни до конфігурації видимих відповідей групи, режиму доставки відповідей з джерела або системного prompt для message-tool маршрутизуються через основні тести відповідей плюс регресії доставки Discord і Slack, щоб зміна shared default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка для harness, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня repo і для широкого proof віддавайте перевагу свіжому прогрітому box. Перед тим як витрачати повільний gate на box, який повторно використано, строк дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли обов’язкові root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і прогрійте новий замість налагодження збою product test. Для навмисних PR із великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
