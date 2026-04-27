---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-27T12:48:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc14de6a52617a4670ded1c6770a6fb807ff27163010f546a65c55ffe7014493
    source_path: ci.md
    workflow: 15
---

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки. Ручні запуски через `workflow_dispatch` навмисно обходять розумне обмеження області дії та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella-workflow для сценарію «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` для цієї цілі та запускає `OpenClaw Release Checks`
для smoke-перевірки встановлення, приймання пакета, наборів Docker для шляху релізу, live/E2E,
OpenWebUI, паритету QA Lab, Matrix і Telegram. Він також може запускати
workflow після публікації `NPM Telegram Beta E2E`, якщо надано специфікацію опублікованого пакета.
Umbrella-workflow записує id запущених дочірніх запусків, а фінальне
завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків. Якщо
дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське завдання верифікації,
щоб оновити результат umbrella-workflow.

`Package Acceptance` — це допоміжний workflow для валідації артефакту пакета
без блокування workflow релізу. Він визначає одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного вибраним
каркасом `workflow_ref`, HTTPS URL tarball-архіву з SHA-256 або tarball-артефакту
з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує
планувальник Docker release/E2E із цим tarball замість перепакування checkout workflow. Профілі охоплюють
smoke, package, product, full і custom-вибір Docker lane. Профіль `package` використовує офлайн-покриття plugin, тож валідація опублікованого пакета не залежить від доступності live ClawHub. Необов’язковий lane Telegram повторно використовує
артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях зі специфікацією опублікованого npm збережено для окремих dispatch-запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей
пакет OpenClaw для встановлення як продукт?» Це відрізняється від звичайного CI:
звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє
один tarball через той самий каркас Docker E2E, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумок кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує
   цей артефакт, перевіряє склад tarball, готує Docker-образи з digest пакета, коли це потрібно, і запускає вибрані Docker lane для цього пакета замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; окремий dispatch Telegram, як і раніше, може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо не вдалося визначити пакет, виконати Docker-приймання або
   необов’язковий lane Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або тега релізу, встановлює залежності у відокремленому worktree та пакує їх за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для артефактів, якими діляться зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це код довіреного
workflow/каркаса, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточному каркасу тестування перевіряти
старі довірені вихідні коміти без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні чанки Docker для шляху релізу з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker-чанки
для шляху релізу покривають накладні lane пакета/оновлення/plugin, тоді як Package
Acceptance забезпечує нативну для артефакту перевірку сумісності bundled-channel, офлайн plugin і підтвердження Telegram для того самого визначеного tarball пакета.
Cross-OS перевірки релізу й надалі покривають специфічну для ОС поведінку онбордингу, інсталятора та платформи; перевірку продукту пакета/оновлення слід починати з Package
Acceptance. Лінії fresh для Windows packaged та installer також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із сирого абсолютного шляху Windows.

Package Acceptance має обмежене вікно сумісності з застарілими вже
опублікованими пакетами до `2026.4.25` включно, зокрема `2026.4.25-beta.*`. Ці
допуски задокументовані тут, щоб не перетворилися на постійні мовчазні пропуски:
відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть давати попередження, коли
tarball не містив цих файлів; `doctor-switch` може пропустити
підвипадок збереження `gateway install --wrapper`, коли пакет не надає
цей прапорець; `update-channel-switch` може відкинути відсутні
`pnpm.patchedDependencies` із фальшивого git fixture, похідного від tarball, і може логувати відсутній збережений
`update.channel`; smoke-перевірки plugin можуть читати застарілі розташування запису встановлення або
допускати відсутність збереження запису встановлення marketplace; а `plugin-update` може
допускати міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб запис встановлення та
поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25` мають відповідати
сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

Приклади:

```bash
# Перевірити поточний beta-пакет з покриттям рівня product.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Запакувати та перевірити release-гілку поточним каркасом.
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

Під час налагодження збійного запуску приймання пакета починайте з підсумку
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Далі перевірте
дочірній запуск `docker_acceptance` та його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane,
тривалість фаз і команди повторного запуску. Надавайте перевагу повторному запуску
збійного профілю пакета або точних Docker lane замість повторного запуску повної перевірки релізу.

QA Lab має окремі lane CI поза основним workflow із розумним обмеженням області дії. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному dispatch; він
збирає приватне середовище виконання QA та порівнює agentic pack для mock GPT-5.5 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при
ручному dispatch; він розгортає mock parity gate, live lane Matrix, а також live
lane Telegram і Discord як паралельні завдання. Live-завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix
використовує `--profile fast --fail-fast` для запланованих і релізних перевірок, тоді як значенням CLI за замовчуванням і ручного входу workflow лишається `all`; ручний dispatch із `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критично важливі для релізу lane QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише
явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє,
що злитий PR справді merged, і що кожен дублікат має або спільне пов’язане issue,
або перекривні змінені hunks.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримки
наявної документації у відповідності до нещодавно злитих змін. Він не має суто запланованого запуску:
його може запустити успішний неботовий push-запуск CI на `main`, а ручний dispatch може
запускати його безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже пішов далі або якщо
інший незапропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, він
переглядає діапазон комітів від попереднього незапропущеного source SHA Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex
для повільних тестів. Він не має суто запланованого запуску: його може запустити успішний неботовий push-запуск CI на
`main`, але він пропускається, якщо того UTC-дня інший виклик через workflow-run уже
відпрацював або працює. Ручний dispatch обходить це денне обмеження активності.
Lane будує повний згрупований звіт про продуктивність Vitest, дозволяє Codex
вносити лише невеликі зміни продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає повний звіт і відхиляє зміни, які зменшують кількість тестів, що проходять, у базовому стані. Якщо в базовому стані є збої тестів, Codex може виправляти лише очевидні збої, а підсумковий повний звіт після роботи агента має пройти, перш ніж щось буде закомічено. Якщо `main` просувається далі до того, як bot push буде злитий, lane
перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберігати ту саму безпечну політику без `sudo`, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені extensions і формує CI manifest | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                   | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                            | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream-артефакти | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, такі як перевірки bundled/plugin-contract/protocol            | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні Node             |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                 | Зміни, релевантні Node             |
| `checks-node-core-test`          | Шарди основних Node-тестів, без урахування каналів, bundled, контрактних і extension-ланок    | Зміни, релевантні Node             |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node             |
| `check-additional`               | Шарди архітектури, меж, guards поверхні extension, меж пакетів і gateway-watch                | Зміни, релевантні Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                          | Зміни, релевантні Node             |
| `checks`                         | Верифікатор для built-artifact тестів каналів                                                 | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Ланка сумісності Node 22 для збірки та smoke                                                  | Ручний dispatch CI для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні Python Skills    |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії import specifier середовища виконання | Зміни, релевантні Windows          |
| `macos-node`                     | Ланка TypeScript-тестів для macOS з використанням спільних built artifacts                    | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, збірка та тести для застосунку macOS                                              | Зміни, релевантні macOS            |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK-збірка                                 | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний main CI або ручний dispatch |

Ручні dispatch-запуски CI запускають той самий граф завдань, що й звичайний CI, але
примусово вмикають усі scoped-ланки: Linux Node shards, bundled-plugin shards, channel contracts,
сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS, Android і i18n для Control UI. Ручні запуски використовують
унікальну групу concurrency, щоб повний набір перевірок кандидата на реліз не скасовувався
іншим push- або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає
довіреному виклику змогу запускати цей граф для гілки, тега або повного SHA коміту, використовуючи
при цьому файл workflow із вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок швидкого завершення з помилкою

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не очікуючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли почати роботу, щойно буде готова спільна збірка.
4. Після цього розгортаються важчі платформні та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії живе в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує manifest preflight
працювати так, ніби змінилася кожна область дії з обмеженням.

Редагування workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати native-збірки Windows, Android або macOS; ці платформні ланки й надалі обмежуються змінами в коді відповідних платформ.
Редагування лише маршрутизації CI, окремі дешеві редагування fixture core-test і вузькі редагування helper/test-routing для plugin contract використовують швидкий шлях manifest лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних shard core, shard bundled-plugin і додаткових матриць guards, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.

Перевірки Windows Node обмежені специфічними для Windows wrapper процесів/шляхів, helper для запуску npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цю ланку; не пов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються на Linux Node-ланках, щоб не займати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shard.

Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає smoke CLI `agents delete shared-workspace`, запускає container `gateway-network` e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin з агрегованим тайм-аутом команди 240 секунд, де `docker run` для кожного сценарію обмежено окремо. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запланованих запусків, ручних dispatch, workflow-call перевірок релізу і pull request, які справді змінюють поверхні installer/package/Docker. Push до `main`, зокрема merge-коміти, не примушують повний шлях; коли логіка changed-scope запитує повне покриття під час push, workflow залишає швидкий Docker smoke, а повний install smoke відкладає на нічну або релізну валідацію. Повільна smoke-перевірка image-provider для глобального встановлення Bun керується окремо через `run_bun_global_install_smoke`; вона запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `install-smoke` можуть явно її ввімкнути, але pull request і push до `main` її не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення.

Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і будує два спільні image з `scripts/e2e/Dockerfile`: базовий runner Node/Git для ланок installer/update/plugin-dependency і функціональний image, який встановлює той самий tarball у `/app` для звичайних функціональних ланок. Визначення Docker lane живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає image для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і чутливу до provider кількість слотів tail-пулу 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lane за замовчуванням такі: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб ланки з npm install і багатосервісні ланки не перевантажували Docker, поки легші ланки все ще займають доступні слоти. Одна lane, важча за ефективні обмеження, усе одно може стартувати з порожнього пулу, а потім працюватиме одна, доки не звільнить ресурси. Запуски lane за замовчуванням розносяться на 2 секунди, щоб уникнути штормів створення контейнерів локальним Docker daemon; перевизначайте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, показує статус активних lane, зберігає timings lane для порядку від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для аналізу планувальника. За замовчуванням він припиняє планувати нові lane в пулах після першої помилки, і кожна lane має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane використовують жорсткіші індивідуальні обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane планувальника, включно з lane лише для релізу, такими як `install-e2e`, і розділеними lane оновлення bundled, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну збійну lane.

Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який пакет, тип image, live image, lane і покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного запуску, або завантажує package artifact із `package_artifact_run_id`; перевіряє склад tarball; будує й публікує package-digest-tagged bare/functional GHCR Docker E2E image через кеш шарів Docker від Blacksmith, коли план потребує lane з установленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest image замість перебудови.

Workflow `Package Acceptance` — це високорівневий gate пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball разом із SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старі довірені коміти без checkout старого коду workflow. Перевірки релізу запускають власну delta-перевірку Package Acceptance для цільового ref: сумісність bundled-channel, офлайн fixture plugin і QA пакета Telegram для визначеного tarball. Набір Docker для шляху релізу запускає чотири chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип image і виконував кілька lane через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`). OpenWebUI вбудовано в `plugins-runtime`, коли повне покриття шляху релізу цього вимагає, і окремий chunk `openwebui` зберігається лише для dispatch-запусків, орієнтованих виключно на OpenWebUI. Chunk `bundled-channels` запускає розділені lane `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one lane `bundled-channel-deps`; `plugins-integrations` лишається застарілим агрегованим alias для ручних повторних запусків. Кожен chunk завантажує `.artifacts/docker-tests/` із журналами lane, timings, `summary.json`, `failures.json`, timings фаз, JSON плану планувальника, таблицями повільних lane і командами повторного запуску для кожної lane. Вхід workflow `docker_lanes` запускає вибрані lane для підготовлених image замість chunked-завдань, що обмежує налагодження збійної lane одним цільовим Docker-завданням і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, цільове завдання локально будує live-test image для цього повторного запуску. Згенеровані для GitHub команди повторного запуску на рівні lane включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених image, коли ці значення існують, щоб збійна lane могла повторно використати точний пакет і image зі збійного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести комбіновані/поканальні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lane і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний Docker-набір шляху релізу. Матриця bundled update поділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled-перевірками.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate перевірок суворіший щодо архітектурних меж, ніж широка CI-область платформ: зміни core production запускають typecheck core prod і core test плюс core lint/guards, зміни лише в core test запускають лише typecheck core test плюс core lint, зміни production в extension запускають typecheck extension prod і extension test плюс extension lint, а зміни лише в extension test запускають typecheck extension test плюс extension lint. Публічні зміни Plugin SDK або plugin-contract розширюють typecheck на extension, бо extensions залежать від цих контрактів core, але повні sweeps Vitest для extension є явною тестовою роботою. Version bump лише в metadata релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірки на всі check-ланки.

Ручні dispatch-запуски CI виконують `checks-node-compat-node22` як покриття сумісності кандидата на реліз. Звичайні pull request і push до `main` пропускають цю ланку та залишають матрицю сфокусованою на test/channel-ланках Node 24.

Найповільніші сімейства Node-тестів поділено або збалансовано так, щоб кожне завдання лишалося невеликим без надмірного резервування runner: контракти каналів працюють як три зважені shard, тести bundled plugin балансуються між шістьма workers extension, невеликі core unit-ланки об’єднано в пари, auto-reply працює як чотири збалансовані workers із поділом піддерева reply на shard agent-runner, dispatch і commands/state-routing, а agentic-конфігурації gateway/plugin розподілені між наявними source-only agentic Node-завданнями замість очікування built artifacts. Широкі browser-, QA-, media- та miscellaneous-тести plugin використовують свої окремі конфігурації Vitest замість спільного catch-all для plugin. Завдання shard extension запускають до двох груп конфігурацій plugin одночасно з одним worker Vitest на групу та збільшеним heap Node, щоб batch plugin з великою кількістю imports не створювали додаткові завдання CI. Широка ланка agents використовує спільний file-parallel планувальник Vitest, оскільки в ній домінують imports/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний runtime-shard не залишався найдовшим. Include-pattern shard записують записи timing із використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від фільтрованого shard. `check-additional` тримає package-boundary compile/canary разом і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, channel tests і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі імена перевірок як легкі завдання-верифікатори та водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його ланка unit-тестів однаково компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK на кожен Android-релевантний push.

GitHub може позначати заміщені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується збоєм. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб і далі повідомляти про звичайні збої shard, але не ставати в чергу після того, як увесь workflow уже був заміщений.

Ключ автоматичної concurrency CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні повні запуски використовують `CI-manual-v1-*` і не скасовують запуски в процесі виконання.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard `check`, окрім lint, shard і агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше стати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard, shard тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу в черзі для 32-vCPU була вищою за виграш                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate перевірок: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate з timings для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі CI artifact/build-smoke lanes
pnpm ci:timings                               # звести останній push-запуск CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # звести wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
