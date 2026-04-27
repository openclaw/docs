---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T08:07:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 997474e178b4a9195e4a421c81bbeb0f625ded48f015bc87c4406ddb28aec912
    source_path: ci.md
    workflow: 15
---

Конвеєр CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області дії та розгортають увесь звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks`
для smoke-перевірки встановлення, приймання пакета, наборів Docker release-path, live/E2E,
OpenWebUI, паритету QA Lab, а також доріжок Matrix і Telegram. Він також може запускати
post-publish workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`Package Acceptance` — це побічний workflow для валідації артефакту пакета
без блокування workflow релізу. Він визначає один кандидат із
опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою
вибраного harness `workflow_ref`, HTTPS URL tarball із SHA-256 або артефакту tarball
з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно
використовує планувальник Docker release/E2E з цим tarball замість перепакування
checkout workflow. Профілі охоплюють вибір доріжок Docker для smoke, package, product, full і custom.
Профіль `package` використовує офлайн-покриття plugin, тому валідація опублікованого пакета
не залежить від доступності live ClawHub. Необов’язкова доріжка Telegram повторно використовує
артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, при цьому шлях
опублікованої npm-специфікації зберігається для окремих запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей
пакет OpenClaw, придатний до встановлення, як продукт?» Це відрізняється від звичайного CI:
звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє
один tarball через той самий harness Docker E2E, який користувачі проходять після
встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить джерело, workflow ref, package
   ref, версію, SHA-256 і профіль у зведенні кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує
   цей артефакт, перевіряє вміст tarball, за потреби готує
   Docker-образи package-digest і запускає вибрані доріжки Docker для цього
   пакета замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`,
   якщо Package Acceptance визначив його; окремий запуск Telegram
   усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker acceptance або
   необов’язкова доріжка Telegram завершилися з помилкою.

Джерела кандидата:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Модуль визначення кандидата отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілок репозиторію або тега релізу, встановлює залежності в
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для
  артефактів, якими діляться зовнішнім чином.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточному harness тестування
перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker-чанки release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=package` і `telegram_mode=mock-openai`. Цей профіль є
GitHub-native заміною для більшості перевірок пакета/оновлення в Parallels,
а Telegram підтверджує той самий артефакт пакета через QA live transport.
Cross-OS release checks усе ще покривають специфічні для ОС onboarding, installer і
поведінку платформи; валідацію пакета/оновлення продукту слід починати з Package
Acceptance. Доріжки Windows packaged та installer fresh також перевіряють, що
встановлений пакет може імпортувати browser-control override із сирого абсолютного
шляху Windows.

Package Acceptance має обмежене вікно сумісності зі старими версіями для вже
опублікованих пакетів до `2026.4.25` включно, зокрема `2026.4.25-beta.*`. Ці
послаблення задокументовано тут, щоб вони не перетворилися на постійні мовчазні пропуски:
відомі приватні записи QA у `dist/postinstall-inventory.json` можуть видавати
попередження, якщо tarball пропустив ці файли; `doctor-switch` може пропускати
підвипадок збереження `gateway install --wrapper`, якщо пакет не надає
цей прапорець; `update-channel-switch` може відкидати відсутні `pnpm.patchedDependencies`
із підробленого git fixture, похідного від tarball, і може журналювати відсутній
збережений `update.channel`; smoke-перевірки plugin можуть читати застарілі розташування
записів встановлення або приймати відсутність збереження запису встановлення marketplace; а
`plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи,
щоб запис встановлення та поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25`
мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

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

# Запакувати та перевірити гілку релізу з поточним harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Перевірити URL tarball. Для source=url SHA-256 є обов’язковим.
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
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте
дочірній запуск `docker_acceptance` і його артефакти Docker:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали доріжок,
тривалість фаз і команди повторного запуску. Надавайте перевагу повторному запуску
невдалого профілю пакета або точних доріжок Docker, а не повторному запуску повної валідації релізу.

QA Lab має окремі доріжки CI поза основним workflow із розумним визначенням області дії. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному запуску; воно
збирає приватне середовище виконання QA та порівнює agentic packs mock GPT-5.5 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при ручному запуску;
воно розгортає mock parity gate, live-доріжку Matrix і live-доріжки Telegram та Discord
як паралельні завдання. Live-завдання використовують середовище
`qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix
використовує `--profile fast --fail-fast` для планових і релізних шлюзів, тоді як
типовим значенням CLI і ручного входу workflow залишається `all`; ручний запуск
`matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу доріжки QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває
лише явно перелічені PR, коли `apply=true`. Перед зміною стану GitHub
він перевіряє, що злитий PR справді об’єднано і що кожен дублікат має або спільне пов’язане issue,
або перетин змінених hunks.

Workflow `Docs Agent` — це event-driven lane технічного обслуговування Codex для
підтримання наявної документації у відповідності до нещодавно об’єднаних змін. Воно не має
чистого розкладу: його може запустити успішний небoтовий push-запуск CI на `main`,
а ручний запуск може запускати його безпосередньо. Виклики через workflow-run пропускаються,
коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено
протягом останньої години. Під час запуску воно переглядає діапазон комітів від
попереднього вихідного SHA останнього непропущеного Docs Agent до поточного `main`,
тому один щогодинний запуск може охопити всі зміни в main, накопичені з часу
останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane технічного обслуговування Codex
для повільних тестів. Воно не має чистого розкладу: його може запустити успішний
неботовий push-запуск CI на `main`, але воно пропускається, якщо інший виклик через workflow-run
уже виконався або виконується того ж дня UTC. Ручний запуск обходить цей денний
шлюз активності. Доріжка будує повний згрупований звіт про продуктивність Vitest,
дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість
широких рефакторингів, потім повторно запускає повний звіт і відхиляє зміни, що
зменшують базову кількість тестів, які проходять. Якщо в базовому стані є тести, що падають,
Codex може виправляти лише очевидні збої, а повний звіт після агента має пройти,
перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде застосовано,
доріжка перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб action Codex
міг зберігати ту саму безпечну позицію drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені extensions і формує маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані артефакти для downstream | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі доріжки коректності Linux, такі як перевірки bundled/plugin-contract/protocol         | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extension                             | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шардовані тести core Node, без урахування доріжок channel, bundled, contract і extension     | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди для перевірок архітектури, меж, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-перевірка стартової пам’яті                               | Зміни, релевантні для Node         |
| `checks`                         | Засіб перевірки для тестів каналів на зібраних артефактах                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Доріжка сумісності Node 22 для збірки та smoke                                               | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Доріжки тестів, специфічні для Windows                                                       | Зміни, релевантні для Windows      |
| `macos-node`                     | Доріжка тестів TypeScript на macOS з використанням спільних зібраних артефактів              | Зміни, релевантні для macOS        |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                        | Модульні тести Android для обох варіантів плюс одна debug-збірка APK                         | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний main CI або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але
примусово вмикають кожну доріжку з визначенням області дії: шарди Linux Node, шарди bundled-plugin, контракти каналів,
сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS, Android і i18n для Control UI. Ручні запуски використовують
унікальну групу concurrency, щоб повний набір перевірок для кандидата на реліз не був скасований
іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному виклику запускати цей граф для гілки, тегу або повного SHA коміту,
використовуючи файл workflow з вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються помилкою, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими доріжками Linux, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії розміщена в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує маніфест preflight
працювати так, ніби кожну область дії було змінено.
Редагування workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформні доріжки й надалі залежать від змін у вихідному коді відповідних платформ.
Редагування лише маршрутизації CI, вибрані дешеві редагування fixture для core-тестів і вузькі редагування helper/test-routing для контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних шардів core, шардів bundled-plugin і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows process/path wrappers, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які виконують цю доріжку; непов’язані зміни вихідного коду, plugin, install-smoke і лише тестів залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже забезпечується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий сценарій визначення області дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, лише тестові редагування і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker-профіль bundled-plugin з сукупним тайм-аутом команди 240 секунд, при цьому `docker run` для кожного сценарію обмежується окремо. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, зокрема merge commits, не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke для провайдера образів Bun global install окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть явно його ввімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` заздалегідь збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для доріжок installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних доріжок. Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної доріжки через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів хвостового пулу 10, чутливого до провайдерів, — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких доріжок за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і multi-service не перевантажували Docker, тоді як легші доріжки все одно заповнюють доступні слоти. Одна доріжка, важча за ефективні обмеження, усе ж може стартувати з порожнього пулу, а потім працює сама, доки не звільнить ресурси. Запуски доріжок за замовчуванням розводяться на 2 секунди, щоб уникнути локальних штормів create у Docker daemon; змініть це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних доріжок, зберігає тривалість доріжок для впорядкування за принципом longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перегляду планувальника. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна доріжка має резервний тайм-аут 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші індивідуальні обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні доріжки планувальника, зокрема доріжки лише для релізу, як-от `install-e2e`, і розділені доріжки оновлення bundled, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити одну невдалу доріжку. Повторно використовуваний workflow live/E2E запитує у `scripts/test-docker-all.mjs --plan-json`, який package, тип образу, live image, доріжка та покриття облікових даних потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє вміст tarball; збирає та публікує bare/functional Docker E2E images з тегом package-digest у GHCR через Blacksmith Docker layer cache, коли плану потрібні доріжки з установленим package; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість повторної збірки. Workflow `Package Acceptance` — це високорівневий шлюз пакетів: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball із SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він зберігає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені коміти без checkout старого коду workflow. Release checks запускають профіль acceptance `package` для цільового ref; цей профіль покриває package/update/plugin contracts і є типовою GitHub-native заміною для більшості покриття package/update у Parallels. Набір Docker release-path запускає не більше трьох поділених на частини завдань із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожна частина завантажувала лише потрібний їй тип образу й виконувала кілька доріжок через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). OpenWebUI входить до `plugins-integrations`, коли це потрібно для повного покриття release-path, і зберігає окремий chunk `openwebui` лише для запусків, призначених тільки для OpenWebUI. Chunk `plugins-integrations` запускає розділені доріжки `bundled-channel-*` і `bundled-channel-update-*` замість послідовної універсальної доріжки `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із журналами доріжок, тривалостями, `summary.json`, `failures.json`, тривалістю фаз, JSON плану планувальника, таблицями повільних доріжок і командами повторного запуску для кожної доріжки. Вхід `docker_lanes` workflow запускає вибрані доріжки на підготовлених образах замість chunk jobs, що обмежує налагодження невдалих доріжок одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана доріжка є live Docker lane, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані для GitHub команди повторного запуску для кожної доріжки містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, тож невдала доріжка може повторно використати точний package та образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із запуску GitHub і вивести комбіновані/покрокові цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень повільних доріжок і критичного шляху фаз. Workflow scheduled live/E2E щодня запускає повний набір Docker release-path. Матрицю bundled update розділено за ціллю оновлення, щоб повторні проходи npm update і doctor repair можна було шардити разом з іншими bundled-перевірками.

Локальна логіка changed-lane розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірок суворіше ставиться до архітектурних меж, ніж широка платформна область дії CI: зміни production у core запускають typecheck для core prod і core test плюс core lint/guards, зміни лише в core tests запускають лише typecheck для core test плюс core lint, зміни production в extension запускають typecheck для extension prod і extension test плюс extension lint, а зміни лише в extension tests запускають typecheck лише для extension test плюс extension lint. Зміни у публічному Plugin SDK або plugin-contract розширюються до typecheck для extension, оскільки extensions залежать від цих контрактів core, але повні прогінні перевірки Vitest для extension є явною тестовою роботою. Зміни лише в метаданих релізу для version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переводять перевірки в усі check lanes.

Ручні запуски CI виконують `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request і push у `main` пропускають цю доріжку та зберігають матрицю зосередженою на доріжках test/channel для Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три зважені шарди, тести bundled plugin балансувалися між шістьма worker-ами extension, малі core unit lanes об’єднуються в пари, auto-reply працює на чотирьох збалансованих worker-ах із розбиттям піддерева reply на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподіляються по наявних Node jobs лише для вихідного коду agentic замість очікування зібраних артефактів. Широкі browser-, QA-, media- та різні plugin-тести використовують власні конфігурації Vitest замість спільного універсального набору plugin. Завдання шардів extension запускають до двох груп конфігурацій plugin одночасно з одним worker-ом Vitest на групу та більшим heap Node, щоб пакети plugin із важкими import не створювали додаткових завдань CI. Широка доріжка agents використовує спільний file-parallel планувальник Vitest, оскільки в ній домінують import/планування, а не один конкретний повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime shard не володів хвостом. Шарди include-pattern записують записи тривалості з використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого шарда. `check-additional` тримає compile/canary-роботу package-boundary разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guard-и паралельно всередині одного завдання. Gateway watch, тести каналів і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи їхні старі назви перевірок як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Варіант third-party не має окремого source set або manifest; його доріжка unit-тестів усе одно компілює цей варіант із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK при кожному push, релевантному для Android.
GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Ставтеся до цього як до шуму CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні помилки shard-ів, але не стають у чергу після того, як увесь workflow уже було замінено новішим.

Автоматичний ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main. Ручні повні запуски набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди та агрегати `check-additional`, aggregate verifier-и тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, що 8 vCPU коштували більше, ніж зекономили; збірки Docker для install-smoke, де вартість часу очікування в черзі для 32-vCPU була більшою, ніж вигода                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-репозиторії повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-репозиторії повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із тривалістю кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
pnpm ci:timings                               # звести останній запуск push CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # звести загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
