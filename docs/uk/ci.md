---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі шлюзів перевірки та локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T04:17:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af62bfd9f035069f6e6fecd9b0d5b85cee6322d75dd7ed7f18a7567e3bccf43
    source_path: ci.md
    workflow: 15
---

Конвеєр CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки. Ручні запуски через `workflow_dispatch` навмисно обходять розумне визначення області змін і розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний узагальнювальний workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks` для smoke-перевірок встановлення, приймання пакета, наборів Docker для шляху релізу, live/E2E, OpenWebUI, паритету QA Lab, а також lane-ів Matrix і Telegram. Він також може запускати workflow `NPM Telegram Beta E2E` після публікації, коли надано специфікацію опублікованого пакета.

`Package Acceptance` — це побічний workflow для валідації артефакту пакета без блокування workflow релізу. Він визначає одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою вибраного каркаса `workflow_ref`, HTTPS URL tarball-файла із SHA-256 або артефакту tarball з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує планувальник Docker release/E2E з цим tarball замість повторного пакування checkout workflow. Профілі охоплюють вибір Docker lane-ів для smoke, package, product, full і custom. Необов’язковий lane Telegram повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, тоді як шлях зі специфікацією опублікованого npm зберігається для окремих запусків.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований пакет OpenClaw як продукт?». Він відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий каркас Docker E2E, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує
   цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи
   package-digest і запускає вибрані Docker lane-и для цього пакета замість
   пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`,
   якщо Package Acceptance визначив такий артефакт; окремий запуск Telegram
   все ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо не вдалося визначити пакет, провалилася Docker acceptance або необов’язковий lane Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable версій.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Модуль визначення отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілок репозиторію або з тега релізу, встановлює залежності в
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для
  зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це код довіреного
workflow/каркаса, який запускає тест. `package_ref` — це коміт вихідного коду,
який пакується, коли `source=ref`. Це дає змогу поточному тестовому каркасу
перевіряти старіші довірені коміти вихідного коду без запуску старої логіки workflow.

Профілі зіставляються з покриттям Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `install-e2e`, `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps`, `plugins`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні chunk-и Docker для шляху релізу з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=package` і `telegram_mode=mock-openai`. Цей профіль є
GitHub-native заміною для більшості перевірок пакета/оновлення в Parallels, а
Telegram підтверджує той самий артефакт пакета через QA live transport.
Cross-OS перевірки релізу все ще охоплюють специфічні для ОС onboarding, інсталятор
і поведінку платформи; валідацію пакета/оновлення продукту слід починати з
Package Acceptance.

Приклади:

```bash
# Перевірити поточний beta-пакет із покриттям рівня product.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Запакувати й перевірити гілку релізу з поточним каркасом.
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

Під час налагодження невдалого запуску package acceptance починайте з підсумку
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім
перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane-ів, часи
фаз і команди повторного запуску. Надавайте перевагу повторному запуску
невдалого профілю пакета або точних Docker lane-ів замість повторного запуску
повної валідації релізу.

QA Lab має виділені lane-и CI поза основним workflow з розумним визначенням області змін.
Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він
збирає приватне середовище виконання QA й порівнює agentic pack-и mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щонічно на `main` і через ручний запуск; він
розгортає mock parity gate, live lane Matrix і live lane Telegram як паралельні завдання.
Live-завдання використовують середовище `qa-live-shared`, а lane Telegram використовує
оренди Convex. `OpenClaw Release Checks` також запускає ті самі lane-и QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супроводу обслуговувачами для
очищення дублікатів після злиття. За замовчуванням він використовує dry-run і закриває лише
явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що
злитий PR справді злитий, і що кожен дублікат має або спільну пов’язану issue,
або перекривні змінені hunks.

Workflow `Docs Agent` — це керований подіями lane супроводу Codex для підтримання
наявної документації у відповідності до нещодавно злитих змін. Він не має чистого запуску за розкладом:
його може запустити успішний CI-run не від бота для push у `main`, а також його можна
запустити напряму вручну. Виклики через workflow-run пропускаються, якщо `main` уже
пішов далі або якщо інший не пропущений запуск Docs Agent був створений протягом останньої години.
Коли він запускається, він переглядає діапазон комітів від попереднього не пропущеного source SHA
Docs Agent до поточного `main`, тому один погодинний запуск може охопити всі зміни в main,
накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це керований подіями lane супроводу Codex для
повільних тестів. Він не має чистого запуску за розкладом: його може запустити успішний
CI-run не від бота для push у `main`, але він пропускається, якщо інший виклик через workflow-run
уже виконувався або виконується в той самий день UTC. Ручний запуск обходить цей денний
шлюз активності. Lane будує повний звіт продуктивності Vitest для всього набору тестів,
дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття
замість широких рефакторингів, потім повторно запускає повний звіт і відхиляє зміни, які
зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що не проходять,
Codex може виправляти лише очевидні збої, а повний звіт після роботи агента має проходити,
перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як push бота буде злитий,
lane робить rebase перевіреного патча, повторно запускає `pnpm check:changed` і повторює push;
застарілі патчі з конфліктами пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберігати ту саму безпечну позицію drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених розширень і побудова маніфесту CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за advisory npm                                    | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки артефактів збірки та повторно використовувані артефакти для нижчих етапів | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі Linux lane-и коректності, наприклад перевірки bundled/plugin-contract/protocol        | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, пов’язані з Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди основних тестів Node, без lane-ів каналів, bundled, contract і extension               | Зміни, пов’язані з Node            |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Шарди архітектури, меж, guards поверхні розширень, меж пакетів і gateway-watch               | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | Зміни, пов’язані з Node            |
| `checks`                         | Засіб перевірки для тестів каналів на зібраних артефактах                                    | Зміни, пов’язані з Node            |
| `checks-node-compat-node22`      | Lane сумісності Node 22 для збірки та smoke                                                  | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, пов’язані з Python Skills   |
| `checks-windows`                 | Специфічні для Windows тестові lane-и                                                        | Зміни, пов’язані з Windows         |
| `macos-node`                     | Lane тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, пов’язані з macOS           |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, пов’язані з macOS           |
| `android`                        | Модульні тести Android для обох flavor-ів плюс одна збірка debug APK                         | Зміни, пов’язані з Android         |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний CI у main або ручний запуск |

Ручні запуски CI використовують той самий граф завдань, що і звичайний CI, але
примусово вмикають усі lane-и з визначенням області змін: шарди Linux Node, шарди
bundled-plugin, контракти каналів, сумісність Node 22, `check`, `check-additional`,
build smoke, перевірки документації, Python Skills, Windows, macOS, Android і
локалізацію Control UI. Ручні запуски використовують унікальну групу concurrency,
щоб повний набір для кандидата на реліз не був скасований іншим push або PR run
на тому самому ref. Необов’язковий вхід `target_ref` дає змогу довіреному
викликачеві запускати цей граф для гілки, тега або повного SHA коміту, водночас
використовуючи файл workflow з вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше,
ніж запускатимуться дорогі:

1. `preflight` вирішує, які lane-и взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane-ами, щоб нижчі споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime lane-и: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення області змін міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує маніфест preflight
працювати так, ніби змінено кожну область із визначенням області змін.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці platform lane-и залишаються прив’язаними до змін у коді відповідних платформ.
Зміни лише в маршрутизації CI, вибрані дешеві зміни фікстур core-test і вузькі зміни helper/test-routing для контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних shard-ів core, shard-ів bundled-plugin і додаткових матриць guard, коли змінені файли обмежуються поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, helper-ами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цей lane; не пов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються на Linux Node lane-ах, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shard-ами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і зміни лише в документації не резервують Docker worker-и. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker profile bundled-plugin із сукупним тайм-аутом команди 240 секунд, причому `docker run` для кожного сценарію окремо також обмежений. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних запусків, release checks через workflow-call і pull request-ів, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commit-ами, не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається в нічному розкладі та з workflow release checks, а ручні запуски `install-smoke` можуть явно його увімкнути, але pull request-и і push у `main` його не запускають. Тести QR і installer Docker зберігають власні install-орієнтовані Dockerfile. Локальний агрегат `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для lane-ів installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lane-ів. Визначення Docker lane-ів містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів tail-pool 10, чутливого до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких lane-ів за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lane-и з npm install і кількома сервісами не перевантажували Docker, тоді як легші lane-и все ще заповнюють доступні слоти. Один lane, важчий за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім працює самостійно, доки не звільнить ресурси. Запуски lane-ів за замовчуванням зміщуються на 2 секунди, щоб уникнути локальних бур створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, показує статус активних lane-ів, зберігає таймінги lane-ів для порядку від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планування нових lane-ів у пулах після першої помилки, а кожен lane має запасний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane-и використовують жорсткіші обмеження для кожного lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane-и планувальника, включно з lane-ами лише для релізу, такими як `install-e2e`, і розділеними lane-ами bundled update, такими як `bundled-channel-update-acpx`, водночас пропускаючи cleanup smoke, щоб агенти могли відтворити один проблемний lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який пакет, вид образу, live image, lane і покриття credential потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей план на вихідні дані GitHub і підсумки. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує наданий викликачем артефакт пакета, перевіряє інвентар tarball, будує і публікує package-digest-tagged образи GHCR Docker E2E типів bare/functional, коли плану потрібні lane-и з установленим пакетом, і повторно використовує ці образи, коли той самий digest пакета вже підготовлено. Workflow `Package Acceptance` — це високорівневий шлюз для пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний workflow Docker E2E. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commit-и без checkout старого коду workflow. Release checks запускають профіль acceptance `package` для цільового ref; цей профіль охоплює контракти package/update/plugin і є типовою GitHub-native заміною для більшості покриття package/update у Parallels. Docker suite для шляху релізу запускається не більш ніж як три розбиті на chunk завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише той тип образу, який йому потрібен, і виконував кілька lane-ів через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). Кожен chunk завантажує `.artifacts/docker-tests/` із журналами lane-ів, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника і командами повторного запуску для кожного lane. Вхід workflow `docker_lanes` запускає вибрані lane-и проти підготовлених образів замість трьох chunk-завдань, що обмежує налагодження проблемного lane-а одним цільовим Docker job і готує або завантажує артефакт пакета для цього запуску; якщо вибраний lane є live Docker lane, цільове завдання збирає live-test image локально для цього повторного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із запуску GitHub і вивести комбіновані/по-lane-ові цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lane-ів і критичного шляху фаз. Коли для suite шляху релізу запитується Open WebUI, він виконується всередині chunk-а plugins/integrations замість резервування четвертого Docker worker-а; Open WebUI зберігає окреме standalone job лише для запусків тільки openwebui. Запланований workflow live/E2E щодня запускає повний Docker suite шляху релізу. Матриця bundled update розділена за цілями оновлення, щоб повторні проходи npm update і doctor repair могли шардуватися разом з іншими bundled перевірками.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірок суворіший щодо меж архітектури, ніж широка область платформ CI: зміни в основному production-коді запускають typecheck core prod і core test плюс core lint/guards, зміни лише в core test запускають лише typecheck core test плюс core lint, зміни в production-коді extension запускають typecheck extension prod і extension test плюс extension lint, а зміни лише в extension test запускають typecheck extension test плюс extension lint. Зміни у публічному Plugin SDK або plugin-contract розширюють typecheck до extension, оскільки extensions залежать від цих core contract-ів, але повні проходи Vitest для extension — це явна тестова робота. Зміни лише в метаданих релізу для підвищення версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі lane-и перевірки.

Ручні запуски CI запускають `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request-и і push у `main` пропускають цей lane і зберігають фокус матриці на lane-ах тестів/каналів Node 24.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів працюють у трьох зважених shard-ах, тести bundled plugin збалансовані між шістьма worker-ами extension, невеликі lane-и модульних тестів core об’єднані в пари, auto-reply виконується на чотирьох збалансованих worker-ах із поділом reply subtree на shard-и agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin config-и розподілені по наявних source-only agentic Node jobs замість очікування на зібрані artifacts. Широкі тести browser, QA, media і miscellaneous plugin використовують власні конфігурації Vitest замість спільного універсального набору plugin. Завдання shard-ів extension запускають до двох груп конфігурацій plugin одночасно з одним worker-ом Vitest на групу і більшим heap Node, щоб групи plugin-ів із важкими import не створювали додаткових CI job-ів. Широкий lane agents використовує спільний file-parallel планувальник Vitest, оскільки для нього домінують import/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із shard-ом infra core-runtime, щоб спільний runtime shard не ставав хвостом. Shard-и include-pattern записують entries таймінгу з використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може розрізняти цілу конфігурацію і відфільтрований shard. `check-additional` тримає разом compile/canary роботу меж пакетів і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard виконує свої невеликі незалежні guard-и паралельно всередині одного job-а. Gateway watch, channel tests і shard меж support core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі jobs-верифікатори та водночас уникаючи двох додаткових worker-ів Blacksmith і другої черги споживачів artifacts.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane модульних тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого job-а пакування debug APK на кожному push, пов’язаному з Android.
GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні помилки shard-ів, але не стають у чергу після того, як увесь workflow уже було витіснено.
Ключ автоматичної concurrency CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні повні запуски використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard-и `check`, крім lint, shard-и й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше ставати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и тестів Linux Node, shard-и тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, так що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж заощаджував                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork-ів використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork-ів використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за lane меж
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні цілі changed Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі артефакти CI/build-smoke lane-и
pnpm ci:timings                               # підсумувати останній CI run push у origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні CI run-и в main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, час у черзі та найповільніші job-и
node scripts/ci-run-timings.mjs --latest-main # ігнорувати issue/comment noise і вибрати CI push у origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні CI run-и в main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
