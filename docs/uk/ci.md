---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, межі застосування перевірок і локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-27T06:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cb69d2eaa44460963bf9b540cbeb2c87ca3802842ffcfdf98780f5d9062d5da
    source_path: ci.md
    workflow: 15
---

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області змін і розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний commit SHA, запускає вручну workflow `CI` для цієї цілі та запускає `OpenClaw Release Checks` для перевірки встановлення, приймання пакетів, Docker-наборів шляху релізу, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, якщо вказано специфікацію опублікованого пакета.

`Package Acceptance` — це допоміжний workflow для перевірки артефакта пакета без блокування workflow релізу. Він визначає одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного вибраним harness `workflow_ref`, HTTPS URL tarball-файла з SHA-256 або tarball-артефакта з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує планувальник Docker release/E2E з цим tarball замість повторного пакування checkout workflow. Профілі охоплюють набори Docker для smoke, package, product, full і custom. Профіль `package` використовує офлайнове покриття Plugin, тому перевірка опублікованого пакета не залежить від доступності live ClawHub. Необов’язковий Telegram lane повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих standalone-запусків.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, а package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири jobs:

1. `resolve_package` робить checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє inventory tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow.
3. `package_telegram` за бажанням викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; standalone-запуск Telegram усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо не вдалося визначити пакет, не пройшла Docker acceptance або не пройшов необов’язковий Telegram lane.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для перевірки опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний commit SHA з `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або з тега релізу, встановлює залежності в detached worktree і пакує все через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, якими діляться назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це commit вихідного коду, який пакується, коли `source=ref`. Це дозволяє поточному test harness перевіряти старі довірені commits вихідного коду без запуску старої логіки workflow.

Профілі зіставляються з покриттям Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker-частини шляху релізу з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=package` і `telegram_mode=mock-openai`. Цей профіль є GitHub-native заміною для більшості перевірок пакета/оновлення в Parallels, а Telegram підтверджує той самий артефакт пакета через QA live transport. Cross-OS перевірки релізу все ще охоплюють специфічні для ОС onboarding, інсталятор і поведінку платформи; перевірку пакета/оновлення продукту слід починати з Package Acceptance.

Package Acceptance має обмежене вікно legacy-сумісності для вже опублікованих пакетів до `2026.4.25` включно, зокрема `2026.4.25-beta.*`. Ці послаблення задокументовано тут, щоб вони не стали постійними тихими пропусками: відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть спричиняти попередження, якщо tarball не містив цих файлів; `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, якщо пакет не надає цей прапорець; `update-channel-switch` може видаляти відсутні `pnpm.patchedDependencies` із похідного від tarball фіктивного git fixture та може логувати відсутній збережений `update.channel`; Plugin smoke-перевірки можуть читати legacy-розташування install-record або приймати відсутність збереження install-record marketplace; а `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без перевстановлення лишалися незмінними. Пакети після `2026.4.25` мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

Приклади:

```bash
# Перевірити поточний beta-пакет із product-рівнем покриття.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Запакувати та перевірити release-гілку з поточним harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Перевірити URL tarball. SHA-256 є обов’язковим для source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Повторно використати tarball, завантажений іншим запуском Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Під час налагодження невдалого запуску package acceptance починайте зі summary `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску профілю пакета, що впав, або точних Docker lanes замість повторного запуску повної валідації релізу.

QA Lab має окремі CI lanes поза основним workflow з розумним визначенням області змін. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватний QA runtime і порівнює mock agentic packs GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгортає mock parity gate, live Matrix lane та live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix використовує `--profile fast --fail-fast` для запланованих і релізних перевірок, тоді як значення CLI за замовчуванням і вхід ручного workflow лишаються `all`; ручний запуск із `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу lanes QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після злиття. Типово він працює в dry-run режимі й закриває лише явно вказані PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що злитий PR дійсно merge-нутий і що кожен дублікат має або спільну згадану issue, або перекривні змінені hunks.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримки наявної документації у відповідності до нещодавно злитих змін. У нього немає окремого schedule: його може запустити успішний неботовий запуск push CI на `main`, а ручний запуск може запустити його напряму. Виклики через workflow-run пропускаються, якщо `main` уже просунувся далі або якщо інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він переглядає діапазон commits від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex для повільних тестів. У нього немає окремого schedule: його може запустити успішний неботовий запуск push CI на `main`, але він пропускається, якщо інший виклик через workflow-run уже відпрацював або виконується в ту саму добу UTC. Ручний запуск обходить цей денний activity gate. Lane збирає повний згрупований звіт продуктивності Vitest, дозволяє Codex робити лише невеликі правки продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає повний звіт і відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а повний звіт після змін має пройти до того, як щось буде закомічено. Якщо `main` просувається вперед до того, як push бота буде застосовано, lane робить rebase перевіреного патча, повторно запускає `pnpm check:changed` і повторює спробу push; конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених розширень і побудова CI manifest | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі npm advisories                           | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-lanes коректності, як-от перевірки bundled/plugin-contract/protocol            | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin у всьому наборі розширень                                  | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів core Node, крім lanes каналів, bundled, контрактів і розширень                 | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, меж, extension-surface guards, package-boundary і gateway-watch          | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті при запуску                             | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для built-artifact тестів каналів                                                | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Lane сумісності Node 22 для збирання та smoke                                               | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows test lanes                                                            | Зміни, релевантні для Windows      |
| `macos-node`                     | Lane тестів TypeScript на macOS з використанням спільних built artifacts                     | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збирання та тести для застосунку macOS                                           | Зміни, релевантні для macOS        |
| `android`                        | Юніт-тести Android для обох flavor плюс одна debug APK збірка                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх main CI або ручний запуск    |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають усі scoped lanes: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS, Android і локалізацію Control UI i18n. Ручні запуски використовують унікальну групу concurrency, щоб повний набір перевірок для кандидата на реліз не скасовувався іншим запуском push або PR на тому самому ref. Необов’язковий параметр `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тега або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запускаються дорогі:

1. `preflight` визначає, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих matrix-завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lanes, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита юніт-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує preflight manifest поводитися так, ніби змінилася кожна область із визначенням scope.
Зміни CI workflow перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати native-збірки Windows, Android або macOS; ці platform lanes залишаються прив’язаними до змін у коді відповідних платформ.
Зміни лише в маршрутизації CI, вибрані дешеві зміни у fixture core-тестів і вузькі редагування helper/test-routing для контрактів Plugin використовують швидкий шлях manifest лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows wrapper для процесів/шляхів, helper для запуску npm/pnpm/UI, конфігурацією package manager і поверхнями CI workflow, які запускають цей lane; не пов’язані зміни у вихідному коді, Plugin, install-smoke і лише тестові зміни залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже забезпечують звичайні test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest вбудованих Plugin і поверхонь core Plugin/channel/Gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді вбудованих Plugin, лише тестові зміни та зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збирання bundled extension і запускає обмежений Docker-профіль bundled-plugin із сумарним таймаутом команд у 240 секунд, де кожен Docker run сценарію окремо також має обмеження. Повний шлях зберігає QR package install і installer Docker/update покриття для нічних запланованих запусків, ручних запусків, workflow-call перевірок релізу та pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope на push запитувала б повне покриття, workflow залишає швидкий Docker smoke, а повний install smoke — для нічної або релізної валідації. Повільний smoke image-provider для глобального встановлення Bun окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `install-smoke` можуть його вмикати, але pull request і push у `main` його не запускають. QR і installer Docker тести зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий Node/Git runner для installer/update/plugin-dependency lanes і функціональний образ, який встановлює той самий tarball у `/app` для звичайних function lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів tail-pool 10, чутливого до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lanes типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lanes з npm install і кількома сервісами не перевантажували Docker, тоді як легші lanes все ще заповнюють доступні слоти. Один lane, важчий за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім виконуватиметься самостійно, доки не звільнить місткість. Запуски lanes типово розводяться на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск виконує preflight для Docker, видаляє застарілі контейнери OpenClaw E2E, показує статус активних lanes, зберігає таймінги lanes для порядку «найдовші спочатку» і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. Типово він припиняє планувати нові pooled lanes після першої помилки, і кожен lane має запасний таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші обмеження для конкретного lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lanes планувальника, зокрема lanes лише для релізу, як-от `install-e2e`, і розділені lanes оновлення bundled, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити один збійний lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, тип образу, live image, lane і покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає і публікує в GHCR bare/functional Docker E2E образи з тегом package-digest через кеш шарів Docker від Blacksmith, коли плану потрібні lanes зі встановленим пакетом; і повторно використовує надані вхідні параметри `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторного збирання. Workflow `Package Acceptance` — це high-level перевірка пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він зберігає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commits без checkout старого коду workflow. Перевірки релізу запускають acceptance-профіль `package` для цільового ref; цей профіль покриває контракти package/update/Plugin і є типовою GitHub-native заміною для більшості покриття package/update у Parallels. Docker-набір шляху релізу запускає не більше трьох chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний йому тип образу й виконував кілька lanes через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). OpenWebUI вбудовано в `plugins-integrations`, коли повне покриття шляху релізу цього потребує, і окремий chunk `openwebui` зберігається лише для запусків, присвячених тільки OpenWebUI. Chunk `plugins-integrations` запускає розділені lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовного all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із логами lanes, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних lanes і командами повторного запуску для кожного lane. Вхідний параметр workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що дозволяє обмежити налагодження збійного lane одним цільовим Docker job і підготувати, завантажити або повторно використати артефакт пакета для цього запуску; якщо вибраний lane є live Docker lane, цільове job локально збирає образ live-test для такого повторного запуску. Згенеровані для GitHub команди повторного запуску для кожного lane містять `package_artifact_run_id`, `package_artifact_name` і підготовлені входи образів, коли ці значення існують, щоб збійний lane міг повторно використати точний пакет і образи зі збійного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести комбіновані/поканальні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lanes і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний Docker-набір шляху релізу. Матрицю bundled update поділено за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими перевірками bundled.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широкий CI scope платформ: зміни core production запускають typecheck core prod і core test плюс lint/guards core, зміни лише в core tests запускають лише typecheck core test плюс lint core, зміни extension production запускають typecheck extension prod і extension test плюс lint extension, а зміни лише в extension tests запускають typecheck extension test плюс lint extension. Зміни в публічному Plugin SDK або plugin-contract розширюють typecheck на extensions, оскільки extensions залежать від цих контрактів core, але Vitest-прогони extensions є явною тестовою роботою. Зміни лише в метаданих релізу з підвищенням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config надійно переводять перевірку в усі check lanes.

Ручні запуски CI запускають `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request і push у `main` пропускають цей lane і зберігають фокус matrix на test/channel lanes для Node 24.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне job залишалося невеликим без надмірного резервування runner-ів: контракти каналів запускаються як три зважені shard-и, тести bundled Plugin балансуються між шістьма worker-ами розширень, невеликі core unit lanes попарно об’єднані, auto-reply працює на чотирьох збалансованих worker-ах із розділенням піддерева reply на shard-и agent-runner, dispatch і commands/state-routing, а конфігурації agentic Gateway/Plugin розподілені по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous Plugin тести використовують свої окремі конфігурації Vitest замість спільного універсального набору Plugin. Jobs shard-ів розширень запускають до двох груп конфігурацій Plugin одночасно з одним worker-ом Vitest на групу та більшим heap Node, щоб пакети Plugin з великим імпортом не створювали зайві CI jobs. Широкий lane agents використовує спільний file-parallel планувальник Vitest, оскільки в ньому домінують імпорти/планування, а не один конкретний повільний тестовий файл. `runtime-config` працює разом із shard-ом infra core-runtime, щоб спільний runtime shard не був останнім, що затримує завершення. Shard-и include-pattern записують таймінги з використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може розрізняти цілу конфігурацію та відфільтрований shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard-и паралельно всередині одного job. Gateway watch, тести каналів і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі імена перевірок як легкі jobs-верифікатори та уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane юніт-тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого job пакування debug APK при кожному Android-релевантному push.

GitHub може позначати замінені jobs як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shard-ів, але не ставали в чергу після того, як увесь workflow уже було замінено новішим.

Ключ automatic CI concurrency має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують already in-progress запуски.

## Runner-и

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі jobs безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard-и `check`, крім lint, shard-и й агрегати `check-additional`, aggregate-верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node-тестів, shard-и тестів bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який досі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж економили; Docker-збірки install-smoke, де час очікування в черзі для 32-vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork-ів використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork-ів використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                     |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/guards за lane меж
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # збірка dist, коли важливі CI artifact/build-smoke lanes
pnpm ci:timings                               # підсумок останнього запуску push CI для origin/main
pnpm ci:timings:recent                        # порівняння останніх успішних запусків main CI
node scripts/ci-run-timings.mjs <run-id>      # підсумок wall time, часу в черзі та найповільніших jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти останні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
