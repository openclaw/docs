---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої в перевірках GitHub Actions.
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T10:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01b27624c9f88ba6261c38f2fbf449a936e6dd0a6a7a5aaa24f8f9db230a7cef
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані між собою ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області дії та розгортають увесь звичайний граф CI для кандидатів на реліз або широкої перевірки.

`Full Release Validation` — це ручний umbrella-workflow для сценарію «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks`
для smoke-перевірок встановлення, перевірки пакета, наборів Docker release-path, live/E2E,
OpenWebUI, QA Lab parity, а також каналів Matrix і Telegram. Він також може запускати
workflow після публікації `NPM Telegram Beta E2E`, коли вказано специфікацію
опублікованого пакета.

`Package Acceptance` — це побічний workflow для перевірки артефакту пакета
без блокування workflow релізу. Він визначає одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою
вибраного середовища `workflow_ref`, HTTPS URL tarball-архіву з SHA-256 або tarball-артефакту
з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, після чого повторно використовує
планувальник Docker release/E2E із цим tarball замість повторного пакування
checkout workflow. Профілі охоплюють вибір Docker lanes для smoke, package, product, full і custom.
Профіль `package` використовує офлайн-покриття плагінів, тому перевірка опублікованого пакета
не залежить від доступності live ClawHub. Опціональний канал Telegram повторно використовує
артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
через специфікацію опублікованого npm зберігається для окремих запусків.

## Перевірка пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи цей встановлюваний пакет OpenClaw
працює як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє
дерево вихідного коду, тоді як перевірка пакета перевіряє один tarball через
те саме середовище Docker E2E, яким користуються користувачі після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить джерело, посилання на workflow, посилання на пакет,
   версію, SHA-256 та профіль у зведенні кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує
   цей артефакт, перевіряє склад tarball, готує Docker-образи
   package-digest за потреби та запускає вибрані Docker lanes із цим
   пакетом замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`,
   якщо Package Acceptance визначив його; окремий запуск Telegram усе ще
   може встановити специфікацію опублікованого npm.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або
   опціональний канал Telegram завершилися з помилкою.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  перевірки опублікованих бета/стабільних версій.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілок репозиторію або тега релізу, встановлює залежності в
  від’єднаному worktree та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його слід указати для
  артефактів, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/середовища, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточному тестовому середовищу
перевіряти старі довірені вихідні коміти без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні chunks Docker release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=package` і `telegram_mode=mock-openai`. Цей профіль є
GitHub-native заміною для більшості перевірок пакета/оновлення в Parallels, при цьому
Telegram доводить той самий артефакт пакета через live-транспорт QA.
Cross-OS release checks і далі покривають специфічну для ОС адаптацію, інсталятор
і поведінку платформи; перевірку продукту пакета/оновлення слід починати з
Package Acceptance. Лінії Windows packaged та installer fresh також перевіряють, що
встановлений пакет може імпортувати browser-control override із сирого абсолютного
шляху Windows.

Package Acceptance має обмежене вікно сумісності зі старими версіями для вже
опублікованих пакетів до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці
допуски задокументовані тут, щоб не перетворитися на постійні тихі пропуски:
відомі приватні записи QA в `dist/postinstall-inventory.json` можуть видавати попередження, коли
tarball не містив цих файлів; `doctor-switch` може пропускати підвипадок
збереження `gateway install --wrapper`, коли пакет не надає
цей прапорець; `update-channel-switch` може видаляти відсутні
`pnpm.patchedDependencies` із фіктивного git-fixture, похідного від tarball, і може журналювати відсутній збережений
`update.channel`; plugin smoke-перевірки можуть читати застарілі розташування install-record або
приймати відсутнє збереження install-record marketplace; а `plugin-update` може
дозволяти міграцію метаданих конфігурації, при цьому як і раніше вимагаючи, щоб install record і
поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25` мають відповідати
сучасним контрактам; за тих самих умов буде помилка, а не попередження чи пропуск.

Приклади:

```bash
# Перевірити поточний бета-пакет із покриттям рівня product.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Запакувати та перевірити гілку релізу з поточним середовищем.
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

Під час налагодження невдалого запуску package acceptance починайте зі зведення
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск
`docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз
і команди повторного запуску. Надавайте перевагу повторному запуску профілю пакета, що завершився помилкою, або
точних Docker lanes, а не повторному запуску повної перевірки релізу.

QA Lab має виділені канали CI поза основним workflow з розумним визначенням області дії. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному запуску; він
збирає приватне QA runtime і порівнює mock agentic packs GPT-5.5 та Opus 4.6. Workflow
`QA-Lab - All Lanes` запускається щоночі на `main` і при ручному запуску; він
розгортає mock parity gate, live-канал Matrix, а також live-канали
Telegram і Discord як паралельні завдання. Live-завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix
використовує `--profile fast --fail-fast` для запланованих і релізних шлюзів, тоді як
типове значення CLI та ручний параметр workflow залишаються `all`; ручний запуск
`matrix_profile=all` завжди розподіляє повне покриття Matrix на завдання `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу канали QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супроводжувачів для
очищення дублікатів після злиття. Типово він працює в dry-run режимі й закриває лише
явно перелічені PR, коли `apply=true`. Перш ніж змінювати стан у GitHub, він перевіряє,
що злитий PR справді має статус merged і що кожен дублікат має або спільний пов’язаний issue,
або зміни в hunk, що перетинаються.

Workflow `Docs Agent` — це керований подіями канал обслуговування Codex для підтримки
наявної документації у відповідності до нещодавно злитих змін. У нього немає суто планового запуску:
його може запустити успішний неботівський push CI у `main`, а ручний запуск може
запустити його напряму. Виклики через workflow-run пропускаються, якщо `main` уже пішов далі
або якщо інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він
переглядає діапазон комітів від попереднього непропущеного вихідного SHA Docs Agent до
поточного `main`, тому один щогодинний запуск може охопити всі зміни main, накопичені з
моменту останнього проходу документації.

Workflow `Test Performance Agent` — це керований подіями канал обслуговування Codex
для повільних тестів. У нього немає суто планового запуску: його може запустити
успішний неботівський push CI у `main`, але він пропускається, якщо того ж UTC-дня
інший виклик через workflow-run уже виконався або виконується. Ручний запуск обходить
цей добовий шлюз активності. Канал будує повний групований звіт про продуктивність Vitest,
дозволяє Codex робити лише невеликі правки продуктивності тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає повний звіт і відхиляє зміни, які
зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести з помилками,
Codex може виправити лише очевидні збої, а післяагентний звіт повного набору тестів
має пройти, перш ніж щось буде закомічено. Якщо `main` просувається далі до того, як bot push буде злитий,
канал перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія
Codex могла зберігати ту саму безпечну політику drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та будує маніфест CI | Завжди для недрафтових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow за допомогою `zizmor`                            | Завжди для недрафтових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для недрафтових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built artifacts і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-канали коректності, такі як перевірки bundled/plugin-contract/protocol          | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, за винятком каналів, bundled, contract і extension lanes             | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, boundary, extension-surface guards, package-boundary і gateway-watch      | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke startup-memory                                            | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів built artifacts                                               | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Канал сумісності Node 22 для збірки та smoke                                                 | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії import specifier runtime  | Зміни, релевантні для Windows      |
| `macos-node`                     | Канал тестів TypeScript на macOS з використанням спільних built artifacts                    | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Модульні тести Android для обох flavor плюс одна збірка debug APK                            | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний CI на main або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але
примусово вмикають усі канали з визначенням області дії: Linux Node shards, bundled-plugin shards, channel contracts,
сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS, Android і Control UI i18n. Ручні запуски використовують
унікальну групу concurrency, щоб повний набір перевірок для кандидата на реліз не було скасовано
іншим push або PR-запуском на тому самому ref. Необов’язковий параметр `target_ref` дає
змогу довіреному виклику виконати цей граф для гілки, тега або повного SHA коміту, використовуючи
файл workflow із вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж
запустяться дорогі:

1. `preflight` визначає, які канали взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-каналами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформні та runtime-канали: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії живе в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує маніфест preflight
працювати так, ніби змінилася кожна область із визначенням області дії.
Редагування workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні канали й надалі прив’язані до змін у вихідному коді відповідних платформ.
Редагування лише маршрутизації CI, вибрані дешеві зміни fixture core-test і вузькі зміни helper/test-routing для контрактів плагінів використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає built artifacts, сумісності Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node прив’язані до специфічних для Windows обгорток process/path, helper для npm/pnpm/UI runner, конфігурації package manager і поверхонь workflow CI, які виконують цей канал; не пов’язані зміни в source, plugin, install-smoke і лише в тестах залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, лише в тестах і лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke із видаленням agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із загальним timeout команди 240 секунд, при цьому `docker run` кожного сценарію окремо також обмежений. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запланованих запусків, ручних запусків, перевірок релізу через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope запросила б повне покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke відкладає на нічну або релізну перевірку. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається в нічному розкладі та з workflow release checks, а ручні запуски `install-smoke` можуть явно його ввімкнути, але pull request і push у `main` його не запускають. Тести QR та installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для каналів installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних каналів. Визначення Docker lanes живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до провайдера, 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких каналів типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб канали npm install і multi-service не перевантажували Docker, поки легші канали все ще заповнюють доступні слоти. Один окремий lane, важчий за ефективні обмеження, усе одно може стартувати з порожнього пулу, а потім виконуватиметься самостійно, доки не звільнить ресурси. Запуски lanes типово розносяться на 2 секунди, щоб уникнути локальних штормів створення Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних lanes, зберігає таймінги lanes для впорядкування за принципом «найдовші спочатку» і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. Типово він припиняє планувати нові pooled lanes після першої помилки, і кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші обмеження для окремих lanes. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lanes планувальника, включно з lanes лише для релізу, такими як `install-e2e`, і розділеними lanes bundled update, такими як `bundled-channel-update-acpx`, при цьому пропускаючи cleanup smoke, щоб агенти могли відтворити один проблемний lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, kind образу, live image, lane і покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного запуску, або завантажує package artifact із `package_artifact_run_id`; перевіряє склад tarball; збирає та публікує package-digest-tagged Docker E2E образи bare/functional у GHCR через кеш шарів Docker Blacksmith, коли плану потрібні lanes із встановленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість перебудови. Workflow `Package Acceptance` — це високорівневий шлюз пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка перевірки могла валідувати старі довірені коміти без checkout старого коду workflow. Release checks запускають профіль acceptance `package` для цільового ref; цей профіль покриває контракти package/update/plugin і є типовою GitHub-native заміною для більшості покриття package/update у Parallels. Набір Docker release-path запускає не більш ніж три chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk витягував лише той kind образу, який йому потрібен, і виконував кілька lanes через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). OpenWebUI включається в `plugins-integrations`, коли повне покриття release-path цього вимагає, і зберігає окремий chunk `openwebui` лише для запусків тільки OpenWebUI. Chunk `plugins-integrations` запускає розділені lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовного об’єднаного lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із lane logs, timings, `summary.json`, `failures.json`, phase timings, JSON плану планувальника, таблицями повільних lanes і командами повторного запуску для кожного lane. Вхід workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що зберігає налагодження проблемного lane в межах одного цільового Docker job і для цього запуску готує, завантажує або повторно використовує package artifact; якщо вибраний lane є live Docker lane, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожного lane включають `package_artifact_run_id`, `package_artifact_name` і входи підготовленого образу, коли ці значення існують, щоб проблемний lane міг повторно використати точний package та образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із запуску GitHub і вивести комбіновані/поканальні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень повільних lanes і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний набір Docker release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled checks.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірки суворіший щодо архітектурних меж, ніж широка область дії платформ CI: зміни у production core запускають typecheck core prod і core test плюс core lint/guards, зміни лише в тестах core запускають лише typecheck core test плюс core lint, зміни у production extension запускають typecheck extension prod і extension test плюс extension lint, а зміни лише в тестах extension запускають typecheck extension test плюс extension lint. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до typecheck extension, оскільки extensions залежать від цих контрактів core, але Vitest sweeps для extension — це явна тестова робота. Зміни лише в метаданих релізу для version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх каналів перевірки.

Ручні запуски CI виконують `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request і push у `main` пропускають цей lane і тримають матрицю сфокусованою на каналах тестів/каналів Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три зважені шарди, тести bundled plugin збалансовано між шістьма workers для розширень, малі канали модульних тестів core об’єднано в пари, auto-reply виконується як чотири збалансовані workers із поділом піддерева reply на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподіляються по наявних agentic Node jobs лише для source замість очікування built artifacts. Широкі browser-, QA-, media- та miscellaneous-тести плагінів використовують свої окремі конфігурації Vitest замість спільного catch-all для плагінів. Завдання шардованих розширень запускають до двох груп конфігурацій плагінів одночасно з одним worker Vitest на групу та більшим heap Node, щоб пакети плагінів із важкими import не створювали додаткових CI jobs. Широкий канал agents використовує спільний file-parallel scheduler Vitest, оскільки в ньому домінують import/планування, а не один конкретний повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime shard не залишався «хвостом». Шарди include-pattern записують entries таймінгів, використовуючи ім’я CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного job. Gateway watch, channel tests і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі імена перевірок як легкі verifier jobs і водночас уникаючи двох додаткових workers Blacksmith і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його канал unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого job пакування debug APK для кожного push, релевантного Android.

GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref теж не завершується збоєм. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був витіснений.

Ключ автоматичної concurrency CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні запуски повного набору перевірок використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, aggregate verifiers для тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали економії; Docker builds для install-smoke, де вартість часу в черзі для 32-vCPU була більшою за виграш                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-и використовують запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-и використовують запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні цілі changed Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі канали CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній push-запуск CI на origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски CI для main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум від issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
