---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, шлюзи областей дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-27T07:07:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 197ca6bd69f47fc26f8bee3f10c90fab75536cc46c0ca2350a02342d7a3a030c
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області дії та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний узагальнювальний workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks` для перевірки встановлення, приймання пакетів, наборів Docker release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`Package Acceptance` — це побічний workflow для валідації артефакту пакета без блокування workflow релізу. Він визначає один кандидат із опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою вибраного каркаса `workflow_ref`, HTTPS URL tarball-архіву із SHA-256 або tarball-артефакту з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує планувальник Docker release/E2E з цим tarball замість повторного пакування checkout workflow. Профілі охоплюють вибірки Docker lane: smoke, package, product, full і custom. Профіль `package` використовує офлайн-покриття plugin, тому валідація опублікованого пакета не залежить від доступності live ClawHub. Необов’язкова lane Telegram повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий каркас Docker E2E, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить у підсумку кроку GitHub джерело, workflow ref, package ref, версію, SHA-256 і профіль.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє вміст tarball, за потреби готує Docker-образи з digest пакета та запускає вибрані Docker lane для цього пакета замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; окремий запуск Telegram і далі може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow помилкою, якщо не вдалося визначити пакет, не пройшла Docker acceptance або необов’язкова lane Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`. Визначувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або з тега релізу, встановлює залежності у відокремленому worktree та пакує їх за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/каркаса, який запускає тест. `package_ref` — це коміт джерела, який пакується, коли `source=ref`. Це дозволяє поточному тестовому каркасу перевіряти старіші довірені коміти джерела без запуску старої логіки workflow.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker-chunk release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=package` і `telegram_mode=mock-openai`. Цей профіль є
GitHub-native заміною для більшості перевірок пакета/оновлення в Parallels, а
Telegram підтверджує той самий артефакт пакета через QA live transport.
Cross-OS перевірки релізу й надалі охоплюють специфічні для ОС сценарії
онбордингу, інсталятора та платформеної поведінки; валідацію продукту для
пакета/оновлення слід починати з Package Acceptance.

Package Acceptance має обмежене вікно legacy-сумісності для вже
опублікованих пакетів до `2026.4.25` включно, зокрема `2026.4.25-beta.*`. Ці
послаблення задокументовані тут, щоб вони не перетворилися на постійні
мовчазні пропуски: відомі приватні записи QA в `dist/postinstall-inventory.json`
можуть спричиняти попередження, якщо tarball не містив цих файлів;
`doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`,
коли пакет не надає цей прапорець; `update-channel-switch` може обрізати
відсутні `pnpm.patchedDependencies` із фальшивої git-фикстури, похідної від tarball,
і може журналювати відсутній збережений `update.channel`; plugin smoke-тести можуть
читати legacy-розташування записів встановлення або приймати відсутність
збереження запису встановлення marketplace; а `plugin-update` може дозволяти
міграцію метаданих конфігурації, водночас і далі вимагаючи, щоб запис
встановлення та поведінка без перевстановлення лишалися незмінними. Пакети після
`2026.4.25` мають відповідати сучасним контрактам; ті самі умови завершуються
помилкою замість попередження або пропуску.

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

# Запакувати та перевірити гілку релізу поточним каркасом.
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
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, часові
показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску
профілю пакета, що завершився помилкою, або точних Docker lane замість повторного
запуску повної валідації релізу.

QA Lab має окремі lane CI поза основним workflow з розумним визначенням області дії. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному запуску; він
збирає приватне середовище виконання QA і порівнює пакети agentic mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при ручному
запуску; він розгортає mock parity gate, live lane Matrix і live lane Telegram та Discord
як паралельні завдання. Live-завдання використовують середовище
`qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix
використовує `--profile fast --fail-fast` для запланованих запусків і перевірок релізу, тоді як
типове значення CLI та ручний параметр workflow лишаються `all`; ручний запуск з
`matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу lane QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після злиття. Типово він працює в режимі dry-run і закриває лише
явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що
злитий PR справді об’єднано і що кожен дублікат має або спільну згадану issue,
або перекривні змінені hunks.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримки
наявної документації у відповідності до нещодавно злитих змін. Воно не має окремого
розкладу: його може запустити успішний неботовий запуск push CI на `main`, а
ручний запуск може запускати його безпосередньо. Виклики через workflow-run
пропускаються, коли `main` уже пішов далі або коли інший неперепущений запуск
Docs Agent був створений за останню годину. Коли воно запускається, воно
переглядає діапазон комітів від SHA джерела попереднього неперепущеного запуску
Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в
main, накопичені від останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex
для повільних тестів. Воно не має окремого розкладу: його може запустити
успішний неботовий запуск push CI на `main`, але воно пропускається, якщо інший
виклик через workflow-run уже виконувався або виконується тієї ж UTC-доби.
Ручний запуск обходить це денне обмеження активності. Lane будує звіт про
продуктивність Vitest для повного набору тестів, згрупований за категоріями,
дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі
збереженням покриття замість широких рефакторингів, потім повторно запускає
звіт для повного набору та відхиляє зміни, що зменшують базову кількість тестів,
які проходять. Якщо в базовому стані є тести, що падають, Codex може виправити
лише очевидні збої, і після агента повторний звіт для повного набору має пройти
перед будь-яким комітом. Коли `main` просувається до того, як bot push буде
застосовано, lane перебазовує перевірений патч, повторно запускає `pnpm check:changed`
і повторює спробу push; конфліктні застарілі патчі пропускаються. Воно
використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму
безпечну позицію без `sudo`, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                  |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                       | Визначає зміни лише в документації, змінені області дії, змінені extensions і будує маніфест CI | Завжди для non-draft push і PR     |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`       | Аудит production lockfile без залежностей за npm advisory                                    | Завжди для non-draft push і PR     |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для non-draft push і PR     |
| `build-artifacts`                 | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`                | Швидкі Linux-ланки коректності, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels`  | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node         |
| `checks-node-extensions`          | Повні шардовані тести bundled-plugin для всього набору extension                             | Зміни, релевантні для Node         |
| `checks-node-core-test`           | Шардовані core Node тести, без channel, bundled, contract та extension lanes                 | Зміни, релевантні для Node         |
| `check`                           | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`                | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні для Node         |
| `build-smoke`                     | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                              | Зміни, релевантні для Node         |
| `checks`                          | Перевіряльник built-artifact тестів channel                                                  | Зміни, релевантні для Node         |
| `checks-node-compat-node22`       | Ланка сумісності Node 22 для збірки та smoke                                                 | Ручний запуск CI для релізів       |
| `check-docs`                      | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                   | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                  | Специфічні для Windows тестові ланки                                                         | Зміни, релевантні для Windows      |
| `macos-node`                      | Ланка тестів TypeScript на macOS із використанням спільних built artifacts                   | Зміни, релевантні для macOS        |
| `macos-swift`                     | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                         | Android unit-тести для обох flavor плюс одна debug APK-збірка                                | Зміни, релевантні для Android      |
| `test-performance-agent`          | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний CI на main або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped-ланку: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS, Android і i18n для Control UI. Ручні запуски використовують унікальну групу конкурентності, щоб повний набір для кандидата на реліз не був скасований іншим push або PR-запуском для того самого ref. Необов’язковий параметр `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту, використовуючи файл workflow із вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються помилкою без очікування важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформені й runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії живе в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує маніфест preflight
поводитися так, ніби змінилася кожна scoped-область.
Редагування workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують виконувати native-збірки для Windows, Android або macOS; ці платформені ланки й далі залишаються прив’язаними до змін у платформеному коді.
Редагування лише маршрутизації CI, окремі дешеві зміни fixture core-test і вузькі редагування helper/test-routing для plugin contract використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, channel contracts, повних shard core, shard bundled-plugin і додаткових матриць guard, коли змінені файли обмежуються поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node прив’язані до специфічних для Windows обгорток process/path, helper для npm/pnpm/UI runner, конфігурації package manager і поверхонь workflow CI, які виконують цю ланку; непов’язані зміни вихідного коду, plugin, install-smoke і зміни лише тестів залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише вихідного коду bundled plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений профіль Docker для bundled-plugin із сумарним timeout команди 240 секунд, де `docker run` для кожного сценарію окремо також обмежений. Повний шлях зберігає покриття для встановлення QR package і installer Docker/update для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push до `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope запитує повне покриття для push, workflow зберігає швидкий Docker smoke, а повний install smoke лишає на нічний прогін або валідацію релізу. Повільний smoke для global install image-provider на Bun окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть його ввімкнути, але pull request і push до `main` його не запускають. QR і installer Docker тести зберігають власні install-орієнтовані Dockerfile. Локальний `test:docker:all` заздалегідь збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для installer/update/plugin-dependency lanes і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lanes. Визначення Docker lanes живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, також 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Ліміти для важких lanes типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lanes з npm install і кількома сервісами не перевантажували Docker, тоді як легші lanes все ще заповнюють доступні слоти. Одна lane, важча за ефективні ліміти, усе одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить ресурси. Запуски lanes типово розносяться на 2 секунди, щоб уникнути локальних storm під час create у Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск виконує preflight для Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних lanes, зберігає часові показники lanes для longest-first упорядкування і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. Типово він припиняє планувати нові pooled lanes після першої помилки, і кожна lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші ліміти для конкретної lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lanes планувальника, включно з lane лише для релізу, як-от `install-e2e`, і розділеними lane оновлення bundled, як-от `bundled-channel-update-acpx`, водночас пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, які package, kind образу, live image, lane і покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє вміст tarball; збирає і публікує в GHCR bare/functional Docker E2E images, позначені digest пакета, через Docker layer cache Blacksmith, коли план потребує lanes з установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні images package-digest замість повторної збірки. Workflow `Package Acceptance` — це високорівневий шлюз пакетів: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені коміти без checkout старого коду workflow. Release checks запускають профіль acceptance `package` для цільового ref; цей профіль покриває контракти package/update/plugin і є типовою GitHub-native заміною для більшості покриття package/update у Parallels. Набір Docker release-path запускає максимум три chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому kind образу і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). OpenWebUI включається до `plugins-integrations`, коли запитується повне покриття release-path, і зберігає окремий chunk `openwebui` лише для запусків, присвячених тільки OpenWebUI. Chunk `plugins-integrations` запускає розділені lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із журналами lanes, часовими показниками, `summary.json`, `failures.json`, часовими показниками фаз, JSON плану планувальника, таблицями повільних lanes і командами повторного запуску для кожної lane. Вхід `docker_lanes` workflow запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує налагодження невдалої lane одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана lane є live Docker lane, цільове завдання локально збирає live-test image для цього повторного запуску. Згенеровані для кожної lane GitHub-команди повторного запуску містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, тож невдала lane може повторно використати точний пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести об’єднані/поканальні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lanes і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний набір Docker release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторювані проходи npm update і doctor repair могли шардитися разом з іншими bundled-перевірками.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо меж архітектури, ніж широка область дії платформ CI: зміни у production core запускають typecheck core prod і core test плюс lint/guards core, зміни лише в core test запускають лише typecheck core test плюс lint core, зміни у production extension запускають typecheck extension prod і extension test плюс lint extension, а зміни лише в extension test запускають typecheck extension test плюс lint extension. Зміни у публічному Plugin SDK або plugin-contract розширюють перевірку до typecheck extension, тому що extensions залежать від цих core-контрактів, але повні проходи Vitest для extension лишаються явною тестовою роботою. Зміни лише метаданих релізу для version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно завершуються переходом на всі check lanes.

Ручні запуски CI виконують `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request і push до `main` пропускають цю lane і тримають матрицю зосередженою на test/channel lanes для Node 24.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені shard-и, тести bundled plugin балансуються між шістьма worker-ами extension, малі core unit lanes поєднуються в пари, auto-reply виконується на чотирьох збалансованих worker-ах із розбиттям піддерева reply на shard-и agent-runner, dispatch і commands/state-routing, а agentic-конфігурації gateway/plugin розподіляються по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser-, QA-, media- і miscellaneous plugin-тести використовують свої окремі конфігурації Vitest замість спільної catch-all конфігурації plugin. Завдання shard-ів extension запускають до двох груп конфігурацій plugin одночасно з одним worker-ом Vitest на групу та більшим heap Node, щоб import-важкі пакети plugin не створювали додаткові завдання CI. Широка lane agents використовує спільний file-parallel scheduler Vitest, тому що в ній домінують import/планування, а не один конкретний повільний тестовий файл. `runtime-config` запускається разом із shard-ом infra core-runtime, щоб спільний runtime shard не тримав tail. Shard-и include-pattern записують записи таймінгів із використанням назви shard-а CI, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard-а. `check-additional` тримає compile/canary-роботи package-boundary разом і відокремлює архітектуру topology runtime від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard-и паралельно всередині одного завдання. Gateway watch, channel-тести і shard support-boundary core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі verifier-завдання та уникаючи двох додаткових worker-ів Blacksmith і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane unit-тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дублювання завдання пакування debug APK при кожному push, релевантному для Android.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо лише найновіший запуск для того самого ref також не падає. Агреговані перевірки shard-ів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні помилки shard-ів, але не стають у чергу після того, як увесь workflow уже був замінений новішим.

Автоматичний ключ конкурентності CI має версіонування (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски на main. Ручні повні запуски використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, shard-и `check`, окрім lint, shard-и й агрегати `check-additional`, aggregate verifier-и Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу в черзі для 32-vCPU була вищою за виграш                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний check gate: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі для Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній push-запуск CI для origin/main
pnpm ci:timings:recent                        # порівняти недавні успішні запуски CI для main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти недавні успішні запуски CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
