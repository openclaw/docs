---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмежувальні правила охоплення та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-27T19:39:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b6aef34b73f85ef7dae00d21cebfa7c560173dd7b979ca19829ea5290972047
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінено лише не пов’язані між собою ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення охоплення й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний узагальнювальний workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` для цієї цілі та запускає `OpenClaw Release Checks` для smoke-перевірок встановлення, перевірки пакунків, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram. Він також може запускати workflow `NPM Telegram Beta E2E` після публікації, якщо вказано специфікацію опублікованого пакунка. Узагальнювальний workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні результати дочірніх запусків. Якщо дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат узагальнювального workflow.

Дочірній workflow live/E2E для релізу зберігає широке нативне охоплення `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway-core`, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z` і `native-live-extensions-media`) через `scripts/test-live-shard.mjs` замість одного послідовного завдання. Це зберігає те саме файлове охоплення, але полегшує повторний запуск і діагностику повільних збоїв live-провайдерів.

`Package Acceptance` — це допоміжний workflow для валідації артефакту пакунка без блокування workflow релізу. Він визначає одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою вибраного harness `workflow_ref`, HTTPS URL tarball-файлу з SHA-256 або tarball-артефакту з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує планувальник Docker release/E2E з цим tarball замість повторного пакування checkout workflow. Профілі охоплюють вибір Docker lane для smoke, package, product, full і custom. Профіль `package` використовує офлайнове охоплення Plugin, тому валідація опублікованого пакунка не залежить від доступності live ClawHub. Необов’язкова lane Telegram повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях зі специфікацією опублікованого npm зберігається для окремих ручних запусків.

## Прийняття пакунка

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакунок OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакунка, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball-файлу, за потреби готує Docker-образи package-digest і запускає вибрані Docker lane для цього пакунка замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; окремий запуск Telegram усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` позначає workflow як невдалий, якщо не вдалося визначити пакунок, не пройшла Docker acceptance або не пройшла необов’язкова lane Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`. Визначення пакунка отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або з тега релізу, встановлює залежності в detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для артефактів, поширених зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це коміт вихідного коду, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

Профілі відповідають охопленню Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker chunks шляху релізу покривають lane пакунка/оновлення/Plugin, що перетинаються, а Package Acceptance зберігає нативне для артефакту підтвердження bundled-channel compat, офлайнового Plugin і Telegram для того самого визначеного tarball пакунка.
Cross-OS release checks і далі покривають специфічну для ОС поведінку онбордингу, інсталятора й платформи; валідацію пакунка/оновлення на рівні продукту слід починати з Package Acceptance. Windows packaged і installer fresh lane також перевіряють, що встановлений пакунок може імпортувати override browser-control із сирого абсолютного шляху Windows.

Package Acceptance має обмежене вікно сумісності зі старими вже опублікованими пакунками до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці винятки задокументовано тут, щоб вони не перетворилися на постійні тихі пропуски: відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть викликати попередження, якщо tarball не містив цих файлів; `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, якщо пакунок не надає цей прапорець; `update-channel-switch` може видаляти відсутні `pnpm.patchedDependencies` з fake git fixture, похідного від tarball, і може журналювати відсутній збережений `update.channel`; Plugin smoke-перевірки можуть читати застарілі розташування записів встановлення або приймати відсутність збереження запису встановлення з marketplace; а `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб запис встановлення і поведінка без перевстановлення залишалися незмінними. Пакунки після `2026.4.25` мають відповідати сучасним контрактам; за тих самих умов буде помилка, а не попередження чи пропуск.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакунка, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Віддавайте перевагу повторному запуску профілю пакунка, що завершився збоєм, або точних Docker lane, а не повторному запуску повної release validation.

QA Lab має окремі lane CI поза основним workflow з розумним визначенням охоплення. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне QA runtime і порівнює агентні набори mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгортає mock parity gate, live Matrix lane і live Telegram та Discord lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix використовує `--profile fast` для запланованих і release gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Значення CLI за замовчуванням і значення ручного вводу workflow залишаються `all`; ручний запуск `matrix_profile=all` завжди розбиває повне охоплення Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу lane QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідника, призначений для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що злитий PR справді має статус merged і що кожен дублікат має або спільне пов’язане issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким сканером першого проходу, а не повним обходом репозиторію. Щоденні та ручні запуски сканують код workflow Actions, а також найризикованіші поверхні JavaScript/TypeScript, пов’язані з auth, secrets, sandbox, cron і gateway. Критична security lane використовує високоточні запити безпеки, а окрема critical quality lane запускає лише non-security запити рівня error для тієї самої вузької поверхні JavaScript/TypeScript. Розширення CodeQL на Swift, Android, Python, UI і bundled-plugin слід повертати лише як обмежену за охопленням або шардовану подальшу роботу після того, як вузький профіль матиме стабільний runtime і якісний сигнал.

Workflow `Docs Agent` — це подієвий супровідний lane Codex для підтримання наявної документації у відповідності до нещодавно злитих змін. Він не має чистого розкладу: його може запустити успішний небочий запуск push CI на `main`, а ручний запуск може запустити його напряму. Виклики через workflow-run пропускаються, якщо `main` уже змінився або якщо інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від SHA джерела попереднього непропущеного Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це подієвий lane супроводу Codex для повільних тестів. Він не має окремого розкладу: його може запустити успішний небочий запуск push CI на `main`, але він пропускається, якщо інший виклик через workflow-run уже виконався або виконується в той самий день UTC. Ручний запуск обходить це денне обмеження активності. Lane будує згрупований звіт про продуктивність повного набору Vitest, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість тестів, які проходять. Якщо в базовому стані є тести зі збоями, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед будь-яким комітом. Коли `main` просувається вперед до того, як push бота буде злитий, lane перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; застарілі патчі з конфліктами пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявлення змін лише в документації, змінених областей охоплення, змінених розширень і побудова маніфесту CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux lane коректності, як-от перевірки bundled/plugin-contract/protocol              | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-Plugin для всього набору розширень                             | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шардовані тести ядра Node, без lane каналів, bundled, контрактів і розширень                 | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, типи тестів і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди для архітектури, меж, захисту поверхні розширень, меж пакунків і gateway-watch         | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів built-artifact                                                | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Lane сумісності з Node 22 для збірки і smoke                                                 | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Тести процесів/шляхів, специфічні для Windows, плюс спільні регресії import specifier runtime | Зміни, релевантні для Windows      |
| `macos-node`                     | Lane тестів TypeScript на macOS із використанням спільних built artifacts                    | Зміни, релевантні для macOS        |
| `macos-swift`                    | Lint, build і тести Swift для програми macOS                                                 | Зміни, релевантні для macOS        |
| `android`                        | Модульні тести Android для обох варіантів плюс одна збірка debug APK                         | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів через Codex після довіреної активності                   | Успішний main CI або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожен lane з обмеженням за охопленням: шардовані Linux Node, шардовані bundled-Plugin, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS, Android і локалізацію Control UI. Ручні запуски використовують унікальну групу concurrency, щоб повний набір для кандидата на реліз не було скасовано іншим запуском push або PR на тому самому ref. Необов’язковий вхід `target_ref` дає змогу довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту, використовуючи файл workflow із вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформні та runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує маніфест preflight працювати так, ніби змінилася кожна область з обмеженням охоплення.
Зміни workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні lane і далі залишаються прив’язаними до змін у платформному вихідному коді.
Зміни лише в маршрутизації CI, окремі дешеві зміни fixture для core-test і вузькі зміни helper/test-routing для контрактів Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних шардів ядра, шардів bundled-Plugin і додаткових матриць захисту, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node обмежені Windows-специфічними process/path wrappers, helper для npm/pnpm/UI runner, конфігурацією менеджера пакунків і поверхнями workflow CI, які запускають цей lane; не пов’язані зміни у вихідному коді, Plugin, install-smoke і зміни лише в тестах залишаються в Linux Node lane, щоб не резервувати 16-vCPU Windows worker для охоплення, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий сценарій охоплення через власне завдання `preflight`. Він розділяє smoke-охоплення на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін пакунків/маніфестів bundled Plugin і поверхонь ядра Plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled Plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container `gateway-network` e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker profile для bundled-Plugin із сукупним тайм-аутом команди 240 секунд, при цьому `docker run` для кожного сценарію окремо також має власне обмеження. Повний шлях зберігає охоплення QR package install і installer Docker/update для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope запитує повне охоплення для push, workflow залишає швидкий Docker smoke, а повний install smoke переносить на нічну або релізну валідацію. Повільний smoke для Bun global install image-provider додатково контролюється через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть явно його ввімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальна команда `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для lane installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lane. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типовий розмір основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а розмір tail-пулу 10, чутливого до провайдерів, — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lane за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lane з npm install і кількома сервісами не перевантажували Docker, поки легші lane все ще заповнюють доступні слоти. Один lane, важчий за ефективні обмеження, усе одно може стартувати з порожнього пулу, а потім виконуватиметься самостійно, доки не звільнить ресурси. Запуски lane за замовчуванням розносяться на 2 секунди, щоб уникнути локальних штормів створення Docker daemon; змініть це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний сукупний запуск виконує preflight Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних lane, зберігає таймінги lane для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планування нових lane у пулі після першої помилки, і кожен lane має резервний тайм-аут 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lane використовують жорсткіші індивідуальні обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane планувальника, включно з lane лише для релізу, як-от `install-e2e`, і розділеними bundled update lane, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити один збійний lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який пакунок, тип образу, live image, lane і покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на виходи GitHub і підсумки. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакунка з поточного запуску, або завантажує артефакт пакунка з `package_artifact_run_id`; перевіряє інвентар tarball; збирає і публікує bare/functional образи Docker E2E з тегом package-digest у GHCR через кеш шарів Docker від Blacksmith, коли план потребує lane з установленим пакунком; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість повторної збірки. Workflow `Package Acceptance` — це високорівневий пакетний gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старі довірені коміти без checkout старого коду workflow. Release checks запускають власну custom-різницю Package Acceptance для цільового ref: bundled-channel compat, офлайнові fixture Plugin і package QA для Telegram на основі визначеного tarball. Docker suite для release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk витягував лише потрібний йому тип образу й виконував кілька lane через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`). OpenWebUI включено в `plugins-runtime-core`, коли повне охоплення release-path цього вимагає, і окремий chunk `openwebui` зберігається лише для запусків, що стосуються тільки OpenWebUI. Застарілі сукупні назви chunk `package-update`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних повторних запусків, але workflow релізу використовує розділені chunks, щоб installer E2E і повні перевірки встановлення/видалення bundled Plugin не домінували в критичному шляху. Псевдонім lane `install-e2e` залишається сукупним псевдонімом для ручного повторного запуску обох lane installer provider. Chunk `bundled-channels` запускає розділені lane `bundled-channel-*` і `bundled-channel-update-*` замість послідовного all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із журналами lane, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних lane і командами повторного запуску для кожного lane. Вхід workflow `docker_lanes` запускає вибрані lane на підготовлених образах замість chunk jobs, що обмежує налагодження збійного lane одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакунка для цього запуску; якщо вибраний lane є live Docker lane, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожного lane включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб збійний lane міг повторно використати точний пакунок і образи зі збійного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести комбіновані/по-lane команди цільового повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень про повільні lane і критичний шлях фаз. Запланований workflow live/E2E щодня запускає повний Docker suite release-path. Матрицю bundled update розділено за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled checks.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широке платформне охоплення CI: зміни в production ядра запускають перевірку типів core prod і core test разом із core lint/guards, зміни лише в тестах ядра запускають лише перевірку типів core test разом із core lint, зміни в production розширень запускають перевірку типів extension prod і extension test разом із extension lint, а зміни лише в тестах розширень запускають перевірку типів extension test разом із extension lint. Зміни в публічному Plugin SDK або plugin-contract розширюють охоплення до перевірки типів розширень, оскільки розширення залежать від цих контрактів ядра, але повні прогонки Vitest для розширень — це окрема явна тестова робота. Зміни лише в метаданих релізу для підвищення версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в корені/конфігурації безпечно призводять до запуску всіх lane перевірки.

Ручні запуски CI запускають `checks-node-compat-node22` як перевірку сумісності для кандидатів на реліз. Звичайні pull request і push у `main` пропускають цей lane й залишають матрицю зосередженою на lane тестів/каналів Node 24.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування раннерів: контракти каналів виконуються як три зважені шарди, тести bundled Plugin балансуються між шістьма workers розширень, малі lane модульних тестів ядра об’єднано в пари, auto-reply виконується на чотирьох збалансованих workers із розділенням піддерева reply на шарди agent-runner, dispatch і commands/state-routing, а agentic-конфігурації gateway/Plugin розподілено між наявними Node jobs лише для вихідного коду замість очікування built artifacts. Широкі browser-, QA-, media- та різні тести Plugin використовують свої окремі конфігурації Vitest замість спільного універсального набору для Plugin. Завдання shard для розширень запускають до двох груп конфігурацій Plugin одночасно з одним worker Vitest на групу та більшим heap Node, щоб пакети Plugin з важкими імпортами не створювали додаткових CI jobs. Широкий lane agents використовує спільний file-parallel scheduler Vitest, оскільки в ньому домінують імпорти/планування, а не один конкретний повільний тестовий файл. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime shard не залишався у хвості. Шарди за include-pattern записують записи таймінгів із використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає compile/canary-перевірки меж пакунків разом і відокремлює архітектуру topology runtime від охоплення gateway watch; shard boundary guard запускає свої малі незалежні guard-перевірки паралельно в межах одного job. Gateway watch, тести каналів і shard support-boundary ядра виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як легкі jobs-верифікатори та водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає debug APK для Play. Варіант third-party не має окремого набору вихідного коду чи маніфесту; його lane модульних тестів усе одно компілює цей варіант із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK при кожному push, релевантному для Android.

GitHub може позначати заміщені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було заміщено.

Ключ автоматичної concurrency CI версіоновано (`CI-v7-*`), щоб GitHub-side zombie у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні повні запуски набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Раннери

| Раннер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали користі; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав користі                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |

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
pnpm test:changed   # дешева розумна перевірка changed-цілей Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі lane CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній запуск push CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
