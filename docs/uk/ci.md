---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, гейти області дії, парасолькові релізи та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T23:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67bfe0245e2d78e88357f7068cc9bf9b99559655f87f9b65ffa89649b39bec44
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає витратніші напрямки, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження області й розгортають повний граф для реліз-кандидатів і широкої перевірки. Напрямки Android лишаються опціональними через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Передреліз Plugin`](#plugin-prerelease) і запускається тільки з [`Повної релізної перевірки`](#full-release-validation) або явного ручного запуску.

## Огляд конвеєра

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує маніфест CI  | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів       | Зміни, релевантні Node             |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux-напрямки коректності, як-от перевірки bundled/plugin-contract/protocol          | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, релевантні Node             |
| `checks-node-core-test`          | Shards тестів ядра Node, без напрямків channel, bundled, contract та extension               | Зміни, релевантні Node             |
| `check`                          | Sharded-еквівалент головного локального gate: production-типи, lint, guards, test types і strict smoke | Зміни, релевантні Node             |
| `check-additional`               | Shards для architecture, boundary, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні Node             |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Напрямок збірки сумісності Node 22 і smoke                                                   | Ручний запуск CI для релізів       |
| `check-docs`                     | Перевірки форматування документації, lint і битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні Python Skills    |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс регресії спільних runtime import specifier    | Зміни, релевантні Windows          |
| `macos-node`                     | Напрямок тестів TypeScript для macOS із використанням спільних зібраних артефактів           | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні macOS            |
| `android`                        | Unit-тести Android для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх main CI або ручний запуск    |

## Порядок fail-fast

1. `preflight` вирішує, які напрямки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-напрямками, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Важчі платформні та runtime-напрямки розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shards використовують `!cancelled() && always()`, тож вони все ще повідомляють звичайні збої shards, але не стають у чергу після того, як увесь workflow уже замінено. Автоматичний concurrency key CI версіонований (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може безстроково блокувати новіші запуски main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручний запуск пропускає changed-scope detection і змушує маніфест preflight поводитися так, ніби кожну scoped area було змінено.

- **Редагування workflow CI** перевіряють граф Node CI плюс workflow linting, але самі по собі не змушують виконувати native-збірки Windows, Android або macOS; ці платформні напрямки лишаються обмеженими змінами платформного source.
- **Редагування лише маршрутизації CI, вибрані дешеві редагування core-test fixtures і вузькі редагування plugin contract helper/test-routing** використовують швидкий шлях маніфесту лише для Node: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання перевіряє напряму.
- **Перевірки Windows Node** обмежені специфічними для Windows обгортками process/path, помічниками npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, що виконують цей напрямок; непов’язані source, plugin, install-smoke і test-only зміни лишаються на Linux Node-напрямках.

Найповільніші сімейства тестів Node розділено або збалансовано, щоб кожне завдання лишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднуються в пари, auto-reply запускається як чотири balanced workers (із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування на built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; shard boundary guard запускає свої малі independent guards паралельно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, водночас уникаючи дублювання debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на найновішій версії Knip, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий неперевірений unused file або залишає застарілий allowlist entry, зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні запуски

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожен scoped lane, крім Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI запускають Android лише з `include_android=true`; повна релізна парасолька вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і Docker-напрямки plugin prerelease виключені з CI. Набір Docker prerelease запускається лише тоді, коли `Повна релізна перевірка` запускає окремий workflow `Передреліз Plugin` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, тож повний набір для release-candidate не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному caller запустити цей граф для branch, tag або full commit SHA, використовуючи файл workflow із вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих пакетів, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` — це ручний парасольковий workflow для "запустити все перед релізом." Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних доказів Plugin/пакетів/статичних файлів/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram lanes. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує широтою live/provider, переданою в release checks:

- `minimum` залишає найшвидші критично важливі для релізу lanes OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку матрицю рекомендаційних provider/media.

Парасолька записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього workflow або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує перезапуск невдалого релізного блока в межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв'язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і live/E2E Docker workflow release-path, і shard package acceptance. Це зберігає байти пакета узгодженими між релізними блоками й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live та E2E шарди

Дочірній live/E2E реліз зберігає широке native-покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені шарди media audio/video та music-шарди, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск і діагностику повільних live-збоїв provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Native live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live набори на звичайних runner Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live шарди model/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей образ один раз, а потім Docker live model, gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker target, релізний запуск налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI валідує дерево джерел, тоді як package acceptance валідує один tarball через той самий Docker E2E harness, який користувачі використовують після встановлення або оновлення.

### Завдання

1. `resolve_package` checkout-ить `workflow_ref`, розв'язує один кандидат пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, валідує інвентар tarball, готує Docker-образи package-digest, коли потрібно, і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли профіль вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгалужує ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` за бажанням викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв'язав один; standalone Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або необов'язковий Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих бета/стабільних версій.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт доступний з історії гілки репозиторію або з тегу релізу, встановлює залежності у відокремленому робочому дереві та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто вказувати для артефактів, якими діляться зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/стенда, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому стенду перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, тому перевірка опублікованого пакета не залежить від доступності живого ClawHub. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях специфікації опублікованого npm зберігається для автономних запусків.

Перевірки релізу викликають Package Acceptance із `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Фрагменти Docker release-path покривають лінії package/update/plugin, що перетинаються; Package Acceptance зберігає перевірку сумісності bundled-channel, офлайн Plugin і Telegram, нативну для артефакта, щодо того самого розв’язаного tarball пакета. Крос-OS перевірки релізу й надалі покривають OS-специфічні onboarding, інсталятор і поведінку платформи; продуктову перевірку package/update слід починати з Package Acceptance. Лінії свіжого Windows packaged і installer також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із сирого абсолютного шляху Windows. Smoke-перевірка agent-turn OpenAI cross-OS за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо її задано, інакше `openai/gpt-5.4-mini`, щоб доказ встановлення та Gateway залишався швидким і детермінованим.

### Вікна застарілої сумісності

Package Acceptance має обмежені вікна застарілої сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` із підробленого git fixture, отриманого з tarball, і може логувати відсутній збережений `update.channel`;
- smoke-перевірки Plugin можуть читати застарілі розташування записів встановлення або приймати відсутність збереження запису встановлення marketplace;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас вимагаючи, щоб запис встановлення та поведінка без повторного встановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли stamp метаданих збірки, які вже були відвантажені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови призводять до помилки замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної перевірки релізу.

## Smoke-перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/package, змін пакетів/маніфестів bundled Plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled Plugin, правки лише тестів і правки лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR package і Docker/update-покриття інсталятора для нічних запланованих запусків, ручних запусків, workflow-call перевірок релізу та pull request, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR smoke-образ кореневого Dockerfile для цільового SHA, а потім запускає встановлення QR package, smoke-перевірки кореневого Dockerfile/gateway, smoke-перевірки installer/update і швидкий Docker E2E bundled-plugin як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття на push, workflow зберігає швидку Docker smoke-перевірку й залишає повну install smoke-перевірку для нічної або релізної перевірки.

Повільна smoke-перевірка Bun global install image-provider окремо керується `run_bun_global_install_smoke`. Вона запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `Install Smoke` можуть увімкнути її, але pull request і пуші в `main` — ні. Docker-тести QR та інсталятора зберігають власні Dockerfile, сфокусовані на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare runner Node/Git для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                 | Типове значення | Призначення                                                                                   |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних ліній.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-пулу, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Ліміт одночасних live-ліній, щоб провайдери не тротлили.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Ліміт одночасних ліній встановлення npm.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Ліміт одночасних multi-service ліній.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами ліній, щоб уникнути штормів створення Docker daemon; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний таймаут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset           | `1` друкує план планувальника без запуску ліній.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset           | Список точних ліній, розділених комами; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальний агрегат попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших до найкоротших і за замовчуванням припиняє планувати нові pooled лінії після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й пушить bare/functional GHCR Docker E2E образи з тегом digest пакета через кеш Docker layers Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість повторної збірки. Pull Docker-образів повторюється з обмеженим таймаутом 180 секунд на спробу, щоб завислий registry/cache stream швидко повторювався замість споживання більшої частини критичного шляху CI.

### Фрагменти release-path

Docker-покриття релізу запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент тягнув лише потрібний йому тип образу та виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні релізні Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` через `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових перезапусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім смуги `install-e2e` залишається агрегованим псевдонімом ручного перезапуску для обох смуг інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені смуги `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну універсальну смугу `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття релізного шляху цього потребує, і зберігає окремий фрагмент `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Смуги оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент вивантажує `.artifacts/docker-tests/` із журналами смуг, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Вхід `docker_lanes` workflow запускає вибрані смуги проти підготовлених образів замість завдань фрагментів, що утримує налагодження збійної смуги в межах одного цільового Docker-завдання та готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker-смугою, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди GitHub для повторного запуску окремих смуг включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, тож збійна смуга може повторно використати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний релізний Docker-набір.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається через `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і автономні ручні CI dispatch тримають цей набір вимкненим. Він балансує тести вбудованих plugin між вісьмома extension-працівниками; ці extension shard-завдання запускають до двох груп конфігурації plugin одночасно з одним Vitest-працівником на групу та більшим heap Node, щоб насичені імпортами пакети plugin не створювали додаткових CI-завдань.

## Лабораторія QA

Лабораторія QA має окремі CI-смуги поза основним workflow зі smart scope.

- Workflow `Parity gate` запускається на відповідних змінах PR і ручному dispatch; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.5 і Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручного dispatch; він розгортає mock parity gate, live Matrix-смугу, а також live Telegram і Discord-смуги як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex.

Релізні перевірки запускають Matrix і Telegram live transport-смуги з детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук у пам’яті, бо QA parity окремо покриває поведінку пам’яті; з’єднання з провайдером покривають окремі набори live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише тоді, коли перевірений CLI це підтримує. Стандартне значення CLI і ручний вхід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає релізно-критичні смуги Лабораторії QA перед затвердженням релізу; його QA parity gate запускає кандидатний і базовий пакети як паралельні завдання смуг, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння паритету.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається середовища виконання QA, паритету model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації чи unit-тестів вважайте це необов’язковим сигналом і спирайтеся на scoped CI/check докази.

## CodeQL

Workflow `CodeQL` навмисно є вузьким первинним сканером безпеки, а не повним sweep репозиторію. Щоденні, ручні та guard-запуски для pull request не в draft сканують код Actions workflow плюс JavaScript/TypeScript-поверхні з найвищим ризиком, використовуючи запити безпеки з високою впевненістю, відфільтровані до high/critical `security-severity`.

Guard pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму матрицю безпеки з високою впевненістю, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова лінія gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс runtime channel plugin, gateway, Plugin SDK, secrets, точки дотику audit                   |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні SSRF, парсингу IP, network guard, web-fetch і політики SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, outbound delivery і gates виконання інструментів агентом                                   |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри інсталяції Plugin, loader, manifest, registry, staging runtime-dependency, source-loading і контракту пакета Plugin SDK |

### Платформоспецифічні security shard

- `CodeQL Android Critical Security` — запланований security shard Android. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний security shard macOS. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із вивантаженого SARIF і вивантажує під `/codeql-critical-security/macos`. Тримається поза щоденними стандартами, бо macOS build домінує runtime навіть коли проходить без помилок.

### Категорії критичної якості

`CodeQL Critical Quality` є відповідним не-security shard. Він запускає лише JavaScript/TypeScript-запити якості з error-severity, не пов’язані з безпекою, по вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його guard pull request навмисно менший за запланований профіль: PR не в draft запускають лише відповідні shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агентом і dispatch відповіді, схемі конфігурації/міграції/IO-коді, коді auth/secrets/sandbox/security, основному каналі та runtime вбудованого channel plugin, протоколі Gateway/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, runtime провайдера/каталозі моделей, diagnostics сесій/чергах доставки, loader plugin, Plugin SDK/package-contract або runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і quality workflow запускають усі дванадцять PR quality shard.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки Auth, секретів, sandbox, cron і Gateway                                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                    |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Контракти виконання команд, диспетчеризації моделей/провайдерів, диспетчеризації та черг автовідповідей, а також runtime контрольної площини ACP                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасади runtime пам’яті, псевдоніми memory Plugin SDK, зв’язувальний код активації runtime пам’яті та команди memory doctor                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна диспетчеризація відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сесій/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, стандартні значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження UI керування, локальна сталість даних, потоки керування Gateway і контракти runtime контрольної площини завдань                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні контракти runtime для web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                             |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на боці пакета та допоміжні засоби контракту пакета plugin                                                                                   |

Якість залишається окремо від безпеки, щоб знахідки щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід повертати як обмежену за областю або шардовану подальшу роботу лише після того, як вузькі профілі матимуть стабільні runtime і сигнал.

## Робочі процеси обслуговування

### Агент документації

Робочий процес `Docs Agent` — це подієво керована лінія обслуговування Codex для підтримання наявної документації у відповідності з нещодавно внесеними змінами. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики через workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Під час запуску він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний activity gate. Лінія будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість тестів, які проходять. Якщо у baseline є тести з помилками, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну позицію drop-sudo, що й агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес maintainer для очищення дублікатів після land. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільну referenced issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область CI-платформи:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (обходи Vitest для extensions залишаються явною тестовою роботою);
- зміни лише release metadata для bump версії запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config безпечно переходять до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, редагування source віддають перевагу явним зіставленням, потім sibling tests і залежним елементам import graph. Конфігурація доставки shared group-room є одним із явних зіставлень: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна спільного стандартного значення падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо широка для harness, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й надавайте перевагу свіжому прогрітому box для широкого proof. Перш ніж витрачати повільний gate на box, який повторно використовувався, протермінувався або щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли обов’язкові root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження помилки product test. Для навмисних PR із великим видаленням задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у sync phase понад п’ять хвилин без post-sync output. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diffs.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
