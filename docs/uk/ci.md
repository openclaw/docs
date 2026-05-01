---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, шлюзи області дії, релізні парасолі та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-01T23:10:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4475dd906e2a7b7675a01ec72e7782f75ccbb4769bd0333c3f56acea9f343893
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для реліз-кандидатів і широкої валідації. Android-лінії залишаються opt-in через `include_android`. Покриття Plugin лише для релізу міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або через явний ручний dispatch.

## Огляд конвеєра

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та будує CI-маніфест  | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без встановлення залежностей щодо npm advisories                   | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів       | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані артефакти для downstream | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, крім ліній каналів, bundled, contract і extension                    | Зміни, релевантні для Node         |
| `check`                          | Sharded-еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і startup-memory smoke                                             | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збірки та smoke для сумісності з Node 22                                               | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Зміни, релевантні для Python skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс регресії shared runtime import specifier   | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням спільних зібраних артефактів                  | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Unit-тести Android для обох flavors плюс одна збірка debug APK                               | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний dispatch  |

## Порядок швидкого завершення при помилці

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Важчі платформні й runtime-лінії розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні помилки шардів, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний ключ concurrency CI версійований (`CI-v7-*`), тож zombie з боку GitHub у старій групі черги не може безстроково блокувати новіші запуски main. Ручні запуски повного suite використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає виявлення changed-scope і змушує preflight-маніфест поводитися так, ніби змінилася кожна scoped-ділянка.

- **Редагування CI workflow** валідують граф Node CI плюс workflow linting, але самі по собі не змушують виконувати native-збірки Windows, Android або macOS; ці платформні лінії залишаються обмеженими змінами платформного source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий шлях маніфесту лише для Node: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність із Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові матриці guard, коли зміна обмежена routing або helper-поверхнями, які швидке завдання безпосередньо перевіряє.
- **Windows Node checks** обмежені специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і CI workflow-поверхнями, що виконують цю лінію; непов’язані зміни source, plugin, install-smoke і лише тестові зміни залишаються на Linux Node-лініях.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runners: channel contracts виконуються як три зважені шарди, малі core unit-лінії спарені, auto-reply виконується як чотири збалансовані workers (із розділенням reply subtree на шарди agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування build artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з BuildConfig flags для SMS/call-log, водночас уникаючи дубльованого debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на найновішій версії Knip, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні dispatch

Ручні CI dispatch запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped-лінію, крім Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Окремі ручні CI dispatch запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch окремого workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, тому повний suite реліз-кандидата не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному викликачеві змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, сегментовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, верифікатори агрегатів тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; попередня перевірка install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих плагінів, `android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували дорожче, ніж заощаджували); Docker-збірки install-smoke (час у черзі для 32-vCPU коштував дорожче, ніж заощаджував)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

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

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження плагінів/пакетів/статичних ресурсів/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` з артефактом `release-package-under-test` із перевірок релізу. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm-пакета.

Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
дескрипторів цільового повторного запуску.

`release_profile` керує широтою live/provider, переданою в перевірки релізу. Ручні
релізні workflow типово використовують `stable`; використовуйте `full` лише тоді, коли
навмисно потрібна широка дорадча матриця провайдерів/медіа.

- `minimum` залишає найшвидші критичні для релізу OpenAI/core lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку дорадчу матрицю провайдерів/медіа.

Парасолька записує ідентифікатори запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease плагінів, `release-checks` для кожного дочірнього релізного workflow або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це зберігає повторний запуск невдалої релізної машини обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E release-path Docker workflow, і в шард package acceptance. Це зберігає байти пакета узгодженими між релізними машинами й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати прогонів `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський workflow скасовано, тому новіша перевірка main
не стоїть позаду застарілого двогодинного прогону release-check. Перевірка релізної гілки/тега
й цільові групи повторного запуску залишають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній live/E2E для релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені шарди audio/video для медіа та шарди music, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних live-збоїв provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media шарди виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіа-завдання лише перевіряють двійкові файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних виконавцях Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live model/backend шарди використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і шарди Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker шарди мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, релізний прогін налаштовано неправильно, і він марнуватиме реальний час на дублікати збірок образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

### Завдання

1. `resolve_package` перевіряє `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-лінії для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; окремий запуск Telegram усе ще може встановити опубліковану специфікацію npm.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker-приймання або опційна лінія Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт доступний з історії гілки репозиторію або релізного тегу, встановлює залежності у відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старі довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker-шляху релізу з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття Plugin, щоб перевірка опублікованого пакета не залежала від live-доступності ClawHub. Опційна лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої специфікації npm збережено для окремих запусків.

Для спеціальної політики тестування оновлень і Plugin, включно з локальними командами,
Docker-лініями, вхідними параметрами Package Acceptance, типовими параметрами релізу та тріажем збоїв,
див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Перевірки релізу викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає перевірку міграції пакета, оновлення, очищення застарілих залежностей Plugin, offline Plugin, plugin-update і Telegram на одному й тому самому визначеному tarball пакета. Cross-OS перевірки релізу й надалі покривають специфічні для ОС onboarding, installer і поведінку платформи; перевірка продукту для пакета/оновлення має починатися з Package Acceptance. Docker-лінія `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback baseline опублікованого пакета, за замовчуванням `openclaw@latest`; команди повторного запуску лінії, що впала, зберігають цей baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розширити лінію на дедупліковану матрицю історії: шість останніх stable-релізів, `2026.4.23` і останній stable-реліз перед `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-подібні fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, шляхів логів із тильдою та застарілих коренів залежностей legacy Plugin. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну лінію з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована лінія налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Лінії Windows packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows. Smoke OpenAI cross-OS agent-turn за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його встановлено, інакше `openai/gpt-5.5`, тож перевірка встановлення й gateway лишається на бажаній тестовій моделі GPT-5.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` із фіктивного git fixture, похідного від tarball, і може логувати відсутній збережений `update.channel`;
- smoke-перевірки Plugin можуть читати legacy-розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без повторного встановлення лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли stamp локальних build-метаданих, які вже були доставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови призводять до помилки замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску профілю пакета, що впав, або точних Docker-ліній замість повторного запуску повної перевірки релізу.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package-поверхонь, змін пакета/маніфесту bundled Plugin або core-поверхонь plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду bundled Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає покриття QR package install і installer Docker/update для нічних планових запусків, ручних запусків, workflow-call перевірок релізу та pull requests, які справді торкаються installer/package/Docker-поверхонь. У повному режимі install-smoke готує або повторно використовує один GHCR root Dockerfile smoke-образ для target-SHA, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб installer-робота не чекала за smoke-перевірками root image.

Push до `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття на push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки.

Повільний smoke image-provider для глобального встановлення Bun окремо контролюється `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `Install Smoke` можуть увімкнути його, але pull requests і push до `main` — ні. QR і installer Docker-тести зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                           |
| -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу, чутливого до провайдерів.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live-ліній, щоб провайдери не вмикали обмеження.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних ліній встановлення npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних багатосервісних ліній.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між запусками ліній, щоб уникнути штормів створення в демоні Docker; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/хвостові лінії використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано | `1` друкує план планувальника без запуску ліній.                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано | Розділений комами точний список ліній; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Локальний агрегатор попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E-контейнери, виводить статус активних ліній, зберігає тривалості ліній для впорядкування від найдовших і типово припиняє планування нових pooled-ліній після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, які пакет, тип образу, live-образ, лінія та покриття обліковими даними потрібні. `scripts/docker-e2e.mjs` потім перетворює цей план на виходи й підсумки GitHub. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує bare/functional GHCR Docker E2E-образи з тегами package-digest через кеш Docker-шарів Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість повторного збирання. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Фрагменти release-шляху

Release Docker-покриття запускає менші фрагментовані job з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` through `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох ліній installer провайдера.

OpenWebUI включається до `plugins-runtime-services`, коли повне release-path-покриття його запитує, і зберігає окремий фрагмент `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент вивантажує `.artifacts/docker-tests/` з логами ліній, тривалостями, `summary.json`, `failures.json`, тривалостями фаз, JSON-планом планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід `docker_lanes` workflow запускає вибрані лінії проти підготовлених образів замість fragment jobs, що обмежує налагодження невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільовий job збирає live-test-образ локально для цього повторного запуску. Згенеровані команди GitHub для повторного запуску кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і підготовлені входи образів, коли такі значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір release-path.

## Попередній випуск Plugin

`Plugin Prerelease` є дорожчим продуктово-пакетним покриттям, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і самостійні ручні CI dispatch не вмикають цей набір. Він балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурацій Plugin одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy пакети Plugin не створювали додаткових CI jobs. Release-only Docker prerelease path групує цільові Docker-лінії в малі групи, щоб не резервувати десятки runners для job тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і ручному dispatch; він збирає приватний QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну через dispatch; він розгортає mock parity gate, live Matrix lane і live Telegram та Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають live transport lanes Matrix і Telegram із детермінованим mock-провайдером та mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від live model latency і звичайного startup provider-plugin. Live transport gateway вимикає пошук памʼяті, бо QA parity окремо покриває поведінку памʼяті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і release gates, додаючи `--fail-fast` лише коли checkout CLI це підтримує. Типове значення CLI та вхід ручного workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix-покриття на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для release лінії QA Lab перед затвердженням release; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в малий report job для фінального parity comparison.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, model-pack parity або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-test розглядайте це як optional signal і спирайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують код Actions workflow плюс JavaScript/TypeScript-поверхні найвищого ризику за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні політики SSRF у Plugin SDK                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                               |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust surfaces контракту package у Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build з вивантаженого SARIF і вивантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими запусками, бо macOS build домінує за runtime навіть коли чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких high-value поверхнях на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за запланований профіль: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і reply dispatch, коді config schema/migration/IO, коді auth/secrets/sandbox/security, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, секрети, sandbox, Cron і код межі безпеки Gateway                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel plugin                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація та черги автовідповідей, а також runtime-контракти control plane ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і tool bridges, помічники нагляду за процесами та контракти outbound delivery                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми memory Plugin SDK, glue-код активації memory runtime та команди memory doctor                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня реалізація черги відповідей, черги доставки сесій, помічники прив’язки/доставки outbound-сесій, поверхні діагностичних подій/log bundle і контракти CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, помічники payload/chunking/runtime відповідей, параметри відповідей каналів, черги доставки та помічники прив’язки сесій/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та discovery провайдерів, реєстрація provider runtime, provider defaults/catalogs, а також реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальна персистентність, control flows Gateway і runtime-контракти task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти core web fetch/search, media IO, media understanding, image-generation та media-generation                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, public-surface і entrypoint Plugin SDK                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side вихідний код Plugin SDK і помічники контрактів package plugin                                                                               |

Якість залишається відокремленою від безпеки, щоб висновки щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це керована подіями maintenance lane Codex для підтримання наявної документації у відповідності з нещодавно доданими змінами. Він не має чистого розкладу: успішний CI-запуск після push не від bot на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший не пропущений запуск Docs Agent було створено протягом останньої години. Коли він виконується, він переглядає діапазон комітів від попереднього не пропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це керована подіями maintenance lane Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск після push не від bot на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей daily activity gate. Lane будує повний grouped Vitest performance report для всього набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline count успішних тестів. Якщо baseline має failing tests, Codex може виправити лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push буде додано, lane rebases перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex міг зберегти ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після land. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільну referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий scope платформи CI:

- core production changes запускають core prod і core test typecheck плюс core lint/guards;
- core test-only changes запускають лише core test typecheck плюс core lint;
- extension production changes запускають extension prod і extension test typecheck плюс extension lint;
- extension test-only changes запускають extension test typecheck плюс extension lint;
- public Plugin SDK або plugin-contract changes розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються explicit test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі edits тестів запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config — одне з explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change зазнав failure перед першим PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли change достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Перевірка Testbox

Запускайте Testbox з repo root і віддавайте перевагу свіжому warmed box для broad proof. Перш ніж витрачати повільний gate на box, який було reused, expired або який щойно повідомив про неочікувано великий sync, спочатку запустіть `pnpm testbox:sanity` всередині box.

Sanity check fails fast, коли обов’язкові root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і warm a fresh one замість налагодження product test failure. Для навмисних large-deletion PR встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний Blacksmith CLI invocation, який залишається у sync phase понад п’ять хвилин без post-sync output. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

Crabbox — це repo-owned другий remote-box path для Linux proof, коли Blacksmith недоступний або коли owned cloud capacity є кращою. Warm a box, hydrate його через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` керує provider, sync і GitHub Actions hydration defaults. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість syncing maintainer-local remotes і object stores, а також виключає local runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` керує checkout, налаштуванням Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
