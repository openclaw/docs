---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-27T13:07:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99e77bcfda3eeb3cc9e3e10640af0452e1e4ad9fa31f2c3e80617b16ca9c9a51
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне обмеження області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки. Ручні запуски через `workflow_dispatch` навмисно обходять розумне обмеження області дії та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella-workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks` для smoke-перевірки встановлення, приймання пакета, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, а також сценаріїв Matrix і Telegram. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано опубліковану специфікацію пакета. Umbrella-workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні результати дочірніх запусків. Якщо дочірній workflow перезапустили й він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат umbrella-workflow.

`Package Acceptance` — це побічний workflow для перевірки артефакту пакета без блокування workflow релізу. Він визначає один кандидат із опублікованої специфікації npm, довіреного `package_ref`, зібраного вибраним harness `workflow_ref`, HTTPS URL tarball-архіву із SHA-256, або артефакту tarball з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує Docker release/E2E scheduler із цим tarball замість перепакування checkout workflow. Профілі охоплюють вибірки Docker lane рівнів smoke, package, product, full і custom. Профіль `package` використовує офлайн-покриття plugin, тому валідація опублікованого пакета не блокується через недоступність live ClawHub. Необов’язковий сценарій Telegram повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях зі специфікацією опублікованого npm зберігається для окремих dispatch-запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи з package-digest і запускає вибрані Docker lane для цього пакета замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; окремий Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` позначає workflow як failed, якщо не вдалися визначення пакета, Docker acceptance або необов’язковий сценарій Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або з релізного тега, встановлює залежності у від’єднаному worktree та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` не є обов’язковим, але його слід вказувати для артефактів, якими діляться зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це коміт вихідного коду, який пакується, коли `source=ref`. Це дозволяє поточному тестовому harness перевіряти старіші довірені коміти вихідного коду без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker-чанки release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'`, і
`telegram_mode=mock-openai`. Docker-чанки release-path покривають
перехресні сценарії package/update/plugin, тоді як Package
Acceptance забезпечує артефактно-нативну перевірку bundled-channel compat, offline plugin і Telegram для того самого визначеного tarball пакета.
Cross-OS release checks, як і раніше, покривають специфічні для ОС сценарії onboarding, installer і поведінку платформи; валідацію package/update на рівні продукту слід починати з Package Acceptance. Windows packaged і installer fresh сценарії також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows.

Package Acceptance має обмежене вікно зворотної сумісності для вже опублікованих пакетів до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці дозволи задокументовано тут, щоб вони не перетворилися на постійні мовчазні пропуски:
відомі приватні записи QA у `dist/postinstall-inventory.json` можуть видавати попередження, якщо tarball не містив цих файлів; `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цього прапорця; `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з tarball-похідного фальшивого git-fixture і може журналювати відсутній збережений `update.channel`; plugin smoke-перевірки можуть читати застарілі розташування install-record або приймати відсутність збереження install-record marketplace; а `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25` мають відповідати сучасним контрактам; ті самі умови тоді завершуються помилкою, а не попередженням чи пропуском.

Приклади:

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

Під час налагодження невдалого запуску package acceptance почніть із summary `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску проблемного профілю package або точних Docker lane замість повторного запуску повної release validation.

QA Lab має окремі сценарії CI поза основним workflow із розумним обмеженням області дії. Workflow `Parity gate` запускається для відповідних змін у PR та при ручному запуску; він збирає приватний runtime QA і порівнює agentic pack’и mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щонічно на `main` і при ручному запуску; він розгортає mock parity gate, live Matrix lane, а також live сценарії Telegram і Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix використовує `--profile fast` для запланованих і релізних перевірок, додаючи `--fail-fast` лише тоді, коли CLI у checkout підтримує це. Значення за замовчуванням у CLI та ручний вхід workflow залишаються `all`; ручний dispatch із `matrix_profile=all`
завжди шардить повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критично важливі для релізу сценарії QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний maintainer-workflow для очищення дублікатів після мерджу. За замовчуванням він працює в режимі dry-run і закриває лише явно вказані PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що влитий PR справді змерджений і що кожен дублікат має або спільне згадане issue, або перетин змінених hunks.

Workflow `Docs Agent` — це event-driven сценарій супроводу Codex для підтримання наявної документації узгодженою з нещодавно влитими змінами. У нього немає окремого schedule: його може запустити успішний небазований ботом CI-run після push у `main`, а manual dispatch може запустити його безпосередньо. Запуски через workflow-run пропускаються, якщо `main` уже пішов далі або якщо інший непропущений запуск Docs Agent було створено впродовж останньої години. Коли він запускається, він перевіряє діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни `main`, накопичені з часу останнього проходу docs.

Workflow `Test Performance Agent` — це event-driven сценарій супроводу Codex для повільних тестів. У нього немає окремого schedule: його може запустити успішний небазований ботом CI-run після push у `main`, але він пропускається, якщо інший запуск через workflow-run уже виконувався або виконується того ж UTC-дня. Ручний dispatch обходить це денне обмеження активності. Сценарій будує звіт продуктивності Vitest для повного набору тестів, згрупований за категоріями, дозволяє Codex робити лише невеликі зміни продуктивності тестів без зниження покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що не проходять, Codex може виправляти лише очевидні збої, і після-агентний звіт для повного набору має пройти, перш ніж щось буде закомічено. Коли `main` просувається далі до того, як bot-push буде влитий, сценарій перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику без `sudo`, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і формує маніфест CI | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                  | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і повторно використовувані downstream-артефакти | За змін, що стосуються Node        |
| `checks-fast-core`               | Швидкі Linux-сценарії коректності, як-от bundled/plugin-contract/protocol checks             | За змін, що стосуються Node        |
| `checks-fast-contracts-channels` | Розшарджені перевірки контрактів каналів зі стабільним агрегованим результатом перевірки     | За змін, що стосуються Node        |
| `checks-node-extensions`         | Повністю розшарджені тести bundled-plugin для всього набору extensions                       | За змін, що стосуються Node        |
| `checks-node-core-test`          | Розшарджені тести core Node, без сценаріїв channel, bundled, contract і extension            | За змін, що стосуються Node        |
| `check`                          | Розшарджений еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | За змін, що стосуються Node        |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | За змін, що стосуються Node        |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | За змін, що стосуються Node        |
| `checks`                         | Перевіряльник для built-artifact тестів каналів                                              | За змін, що стосуються Node        |
| `checks-node-compat-node22`      | Сценарій збірки та smoke-перевірки сумісності з Node 22                                      | Ручний dispatch CI для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Коли змінено docs                  |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | За змін, що стосуються Python Skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс регресії спільних runtime import specifier | За змін, що стосуються Windows     |
| `macos-node`                     | Сценарій TypeScript-тестів на macOS із використанням спільних зібраних артефактів            | За змін, що стосуються macOS       |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | За змін, що стосуються macOS       |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK-збірка                                | За змін, що стосуються Android     |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх main CI або ручний dispatch  |

Ручні dispatch-запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожен сценарій з обмеженням області дії: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки docs, Python Skills, Windows, macOS, Android і локалізацію Control UI. Ручні запуски використовують унікальну concurrency group, щоб повний набір перевірок для кандидата на реліз не скасовувався іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які сценарії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-сценаріями, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгортаються важчі платформені та runtime-сценарії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії розміщена в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує preflight-маніфест
працювати так, ніби змінилася кожна область з обмеженням області дії.
Зміни workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені сценарії й надалі обмежуються змінами у вихідному коді платформи.
Зміни лише в маршрутизації CI, окремі дешеві зміни fixture core-test і вузькі зміни helper/test-routing для plugin contract використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних shard core, shard bundled-plugin і додаткових матриць guard, коли змінені файли обмежуються поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежуються Windows-специфічними wrapper для process/path, helper для запуску npm/pnpm/UI, конфігурацією пакетного менеджера та поверхнями workflow CI, які виконують цей сценарій; не пов’язані зміни у вихідному коді, plugin, install-smoke і лише тестові зміни залишаються на Linux Node lanes, щоб не займати 16-vCPU Windows worker заради покриття, яке вже забезпечують звичайні test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розбиває smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають fast-path для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, лише тестові зміни й зміни лише в документації не резервують Docker workers. Fast-path один раз збирає кореневий образ Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin з агрегованим timeout команди 240 секунд, де `docker run` кожного сценарію окремо теж має обмеження. Full-path зберігає QR package install і installer Docker/update покриття для нічних запланованих запусків, ручних dispatch-запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commit, не примушують full-path; коли логіка changed-scope на push запитала б повне покриття, workflow залишає fast Docker smoke, а повний install smoke переносить на нічну або релізну валідацію. Повільний smoke для image-provider із глобальним встановленням Bun керується окремо через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch-запуски `install-smoke` можуть його ввімкнути, але pull request і push у `main` його не запускають. QR і installer Docker-тести зберігають власні install-орієнтовані Dockerfile. Локальний `test:docker:all` заздалегідь збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і будує два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для installer/update/plugin-dependency lanes і функціональний image, який встановлює той самий tarball у `/app` для звичайних functional lanes. Визначення Docker lane знаходяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає image для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів tail-pool 10, чутливого до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб сценарії npm install і multi-service не перевантажували Docker, поки легші сценарії все ще заповнюють доступні слоти. Один lane, важчий за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить місткість. Запуски lane за замовчуванням розносяться на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск виконує попередню перевірку Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних lane, зберігає таймінги lane для сортування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes мають жорсткіші індивідуальні обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з релізними lane, такими як `install-e2e`, і розділеними bundled update lanes, такими як `bundled-channel-update-acpx`, при цьому пропускаючи cleanup smoke, щоб агенти могли відтворити один проблемний lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, kind image, live image, lane і покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через кеш Docker layer від Blacksmith, коли плану потрібні lanes з установленим пакетом; і повторно використовує передані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або вже наявні package-digest images замість перебудови. Workflow `Package Acceptance` — це високорівневий gate для пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball разом із SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені коміти без checkout старого коду workflow. Release checks запускають спеціальний delta-виклик Package Acceptance для цільового ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти визначеного tarball. Набір release-path Docker запускає чотири chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому kind image і виконував кілька lanes через той самий зважений scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`). OpenWebUI включається в `plugins-runtime`, коли для повного release-path coverage його запитано, і зберігає окремий chunk `openwebui` лише для dispatch-запусків лише OpenWebUI. Chunk `bundled-channels` запускає розділені lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовного all-in-one lane `bundled-channel-deps`; `plugins-integrations` лишається застарілим агрегованим псевдонімом для ручних повторних запусків. Кожен chunk завантажує `.artifacts/docker-tests/` з журналами lane, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON-планом scheduler, таблицями повільних lane і командами повторного запуску для кожного lane. Вхід workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk-завдань, що утримує налагодження проблемного lane в межах одного цільового Docker-завдання та готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибраний lane є live Docker lane, це цільове завдання локально збирає live-test image для такого повторного запуску. Згенеровані GitHub-команди повторного запуску для окремих lane включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених image, коли ці значення існують, тож проблемний lane може повторно використати точний package й images із невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести комбіновані/по-окремих lane команди цільового повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень повільних lane і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний набір release-path Docker. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled-перевірками.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіше ставиться до меж архітектури, ніж широка область дії платформ у CI: зміни в production core запускають typecheck core prod і core test плюс core lint/guards, зміни лише в тестах core запускають лише typecheck core test плюс core lint, зміни в production extension запускають typecheck extension prod і extension test плюс extension lint, а зміни лише в тестах extension запускають typecheck extension test плюс extension lint. Публічні зміни Plugin SDK або plugin-contract розширюються до typecheck extension, оскільки extensions залежать від цих контрактів core, але повні прогони Vitest для extensions є явною тестовою роботою. Лише version bump у release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірки на всі check lanes.

Ручні dispatch-запуски CI виконують `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request і push у `main` пропускають цей lane і зберігають матрицю сфокусованою на Node 24 test/channel lanes.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання лишалося невеликим без надмірного резервування runner’ів: контракти каналів запускаються як три зважені shard, тести bundled plugin балансуються між шістьма worker для extension, невеликі core unit-сценарії поєднуються попарно, auto-reply виконується на чотирьох збалансованих worker із розбиттям піддерева reply на shard `agent-runner`, `dispatch` і `commands/state-routing`, а agentic-конфігурації gateway/plugin розподіляються між наявними Node-завданнями agentic лише для source замість очікування built artifacts. Широкі browser-, QA-, media- та різні plugin-тести використовують свої окремі конфігурації Vitest замість спільного універсального plugin-набору. Завдання з shard для extension запускають до двох груп plugin-конфігурацій одночасно з одним worker Vitest на групу та більшим heap Node, щоб імпортно-важкі набори plugin не створювали додаткових CI-завдань. Широкий сценарій agents використовує спільний file-parallel scheduler Vitest, оскільки в ньому домінують імпорт/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime-shard не залишався єдиним «хвостом». Shard за include-pattern записують записи таймінгів із використанням назви CI-shard, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає разом compile/canary-роботи package-boundary та відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard паралельно в межах одного завдання. Gateway watch, channel-тести та shard support-boundary для core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як легкі verifier-завдання, водночас уникаючи двох додаткових worker Blacksmith і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set чи manifest; його сценарій unit-тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, уникаючи при цьому дубльованого пакування debug APK на кожному push, що стосується Android.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні помилки shard, але не стають у чергу після того, як увесь workflow уже був витіснений.

Автоматичний ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`. Ручні повні прогони використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Runner’и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, розшарджені перевірки контрактів каналів, shard `check`, окрім lint, shard та агрегати `check-additional`, aggregate verifier для Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard Linux Node-тестів, shard тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо чутливим до CPU, так що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32-vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                              |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний check gate: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # зібрати dist, коли важливі сценарії CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній push-запуск CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
