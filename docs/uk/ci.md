---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions.
summary: Граф завдань CI, межі дії перевірок і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T14:18:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4a2143e1670641bc7a603c61f27062f888f32b2c0aad914d1f8f3fede88bbc0
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини. Ручні запуски через `workflow_dispatch` навмисно обходять це розумне визначення області змін і розгортають увесь звичайний граф CI для кандидатів на реліз або широкої перевірки.

`Full Release Validation` — це ручний узагальнювальний workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, а також запускає `OpenClaw Release Checks` для smoke-перевірок встановлення, перевірки пакета, наборів Docker для шляху релізу, live/E2E, OpenWebUI, паритету QA Lab, Matrix і сценаріїв Telegram. Він також може запускати workflow після публікації `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета. Узагальнювальний workflow записує id запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат узагальнювального workflow.

Дочірній workflow релізного live/E2E зберігає широке покриття нативного `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway`, `native-live-test`, `native-live-extensions-a-k` і `native-live-extensions-l-z`) через `scripts/test-live-shard.mjs`, а не як одне послідовне завдання. Це зберігає те саме покриття файлів, водночас полегшуючи повторний запуск і діагностику повільних збоїв live-провайдерів.

`Package Acceptance` — це допоміжний workflow для перевірки артефакту пакета без блокування workflow релізу. Він визначає одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою вибраного середовища `workflow_ref`, HTTPS URL tarball із SHA-256, або артефакту tarball з іншого запуску GitHub Actions, завантажує його як `package-under-test`, а потім повторно використовує планувальник Docker релізу/E2E з цим tarball замість повторного пакування checkout workflow. Профілі охоплюють вибір smoke, package, product, full і custom Docker-сценаріїв. Профіль `package` використовує офлайн-покриття плагінів, тому перевірка опублікованого пакета не залежить від доступності live ClawHub. Необов’язковий сценарій Telegram повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях із опублікованою npm-специфікацією зберігається для окремих ручних запусків.

## Перевірка пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, а перевірка пакета перевіряє один tarball через те саме середовище Docker E2E, яке користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва файли як артефакт `package-under-test` і виводить джерело, посилання на workflow, посилання на пакет, версію, SHA-256 і профіль у зведенні кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє склад tarball, за потреби готує Docker-образи з digest пакета і запускає вибрані Docker-сценарії для цього пакета замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо `Package Acceptance` його визначив; окремий запуск Telegram усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` позначає workflow як невдалий, якщо не вдалося визначення пакета, Docker acceptance або необов’язковий сценарій Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для перевірки опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`. Визначник завантажує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або з тега релізу, встановлює залежності в відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для артефактів, якими діляться зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/середовища, який запускає тест. `package_ref` — це коміт джерела, який пакується, коли `source=ref`. Це дозволяє поточному тестовому середовищу перевіряти старіші довірені коміти вихідного коду без запуску старої логіки workflow.

Профілі зіставляються з покриттям Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full`: повні chunks шляху релізу Docker з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker chunks шляху релізу покривають сценарії package/update/plugin, що перетинаються, а Package Acceptance зберігає нативну для артефакту перевірку bundled-channel compat, офлайн-плагінів і Telegram на основі того самого визначеного tarball пакета.
Cross-OS перевірки релізу й надалі покривають специфічну для ОС поведінку onboarding, інсталятора та платформи; перевірку продукту package/update слід починати з Package Acceptance. Сценарії свіжого встановлення packaged і installer для Windows також перевіряють, що встановлений пакет може імпортувати override керування браузером із сирого абсолютного шляху Windows.

Package Acceptance має обмежене вікно сумісності з уже опублікованими застарілими пакетами до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці винятки задокументовані тут, щоб вони не перетворилися на постійні мовчазні пропуски: відомі приватні записи QA у `dist/postinstall-inventory.json` можуть спричиняти попередження, коли в tarball відсутні ці файли; `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, якщо пакет не надає цей прапорець; `update-channel-switch` може видаляти відсутні `pnpm.patchedDependencies` із фіктивного git-фікстура, похідного від tarball, і може журналювати відсутній збережений `update.channel`; smoke-перевірки плагінів можуть читати застарілі розташування записів встановлення або приймати відсутність збереження запису встановлення marketplace; а `plugin-update` може дозволяти міграцію метаданих конфігурації, при цьому все одно вимагаючи, щоб запис встановлення і поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25` повинні відповідати сучасним контрактам; ті самі умови призводять до помилки, а не до попередження чи пропуску.

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

# Запакувати й перевірити гілку релізу за допомогою поточного середовища.
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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали сценаріїв, тривалість фаз і команди для повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-сценаріїв замість повторного запуску повної перевірки релізу.

QA Lab має окремі сценарії CI поза основним workflow із розумним визначенням області змін. Workflow `Parity gate` запускається для відповідних змін у PR і вручну; він збирає приватне середовище QA та порівнює mock agentic packs GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, live-сценарій Matrix і live-сценарії Telegram та Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують lease-механізми Convex. Matrix використовує `--profile fast` для запланованих і релізних перевірок, додаючи `--fail-fast` лише тоді, коли CLI в поточному checkout це підтримує. Значення CLI за замовчуванням і ручний вхід workflow залишаються `all`; ручний запуск із `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критично важливі для релізу сценарії QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після злиття. За замовчуванням він працює в dry-run режимі й закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільну згадану issue, або hunks змін, що перетинаються.

Workflow `Docs Agent` — це подієвий сервісний сценарій Codex для підтримки наявної документації у відповідності до нещодавно злитих змін. У нього немає окремого розкладу: його може запустити успішний не-ботовий push-запуск CI на `main`, а ручний запуск може запускати його напряму. Запуски через workflow-run пропускаються, якщо `main` уже пішов уперед або якщо інший не пропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього вихідного SHA не пропущеного Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це подієвий сервісний сценарій Codex для повільних тестів. У нього немає окремого розкладу: його може запустити успішний не-ботовий push-запуск CI на `main`, але він пропускається, якщо інший запуск через workflow-run уже виконувався або виконується в цю UTC-добу. Ручний запуск обходить це денне обмеження активності. Сценарій будує звіт про продуктивність Vitest для повного набору тестів, згрупований за категоріями, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують кількість тестів, що проходять, у базовому рівні. Якщо базовий стан має збої тестів, Codex може виправляти лише очевидні проблеми, і повний звіт після роботи агента повинен успішно завершитися, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде злитий, сценарій перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму політику безпеки drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та будує маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisory                                  | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream-артефакти | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі Linux-сценарії коректності, як-от перевірки bundled/plugin-contract/protocol          | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, пов’язані з Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди основних Node-тестів, без сценаріїв channel, bundled, contract і extension             | Зміни, пов’язані з Node            |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Шарди архітектурних перевірок, меж, guard-ів поверхні розширень, меж пакета і gateway-watch  | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-перевірка пам’яті під час запуску                         | Зміни, пов’язані з Node            |
| `checks`                         | Верифікатор для channel-тестів built-artifact                                                | Зміни, пов’язані з Node            |
| `checks-node-compat-node22`      | Сценарій перевірки сумісності збірки і smoke для Node 22                                     | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, пов’язані з Python Skills   |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії специфікаторів імпорту середовища виконання | Зміни, пов’язані з Windows         |
| `macos-node`                     | Сценарій TypeScript-тестів на macOS з використанням спільних built artifacts                 | Зміни, пов’язані з macOS           |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, пов’язані з macOS           |
| `android`                        | Модульні тести Android для обох flavor плюс одна debug APK-збірка                            | Зміни, пов’язані з Android         |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний CI на main або ручний запуск |

Ручні запуски CI використовують той самий граф завдань, що й звичайний CI, але примусово вмикають усі сценарії, визначені за областю змін: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS, Android і локалізацію Control UI i18n. Ручні запуски використовують унікальну групу concurrency, щоб повний набір перевірок для кандидата на реліз не було скасовано іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту, використовуючи файл workflow з вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які сценарії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-сценаріями, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформні та runtime-сценарії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує маніфест preflight поводитися так, ніби змінилася кожна область, що визначається за scope.
Редагування workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не змушують запускати нативні збірки Windows, Android або macOS; ці платформні сценарії й надалі залежать від змін у вихідному коді відповідної платформи.
Редагування, що стосуються лише маршрутизації CI, окремі дешеві зміни у фікстурах core-test і вузькі зміни в helper/test-routing для plugin contract використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, channel contracts, повних core shards, bundled-plugin shards і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або helper-ів, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node обмежені специфічними для Windows wrapper-ами процесів/шляхів, helper-ами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цей сценарій; не пов’язані зміни в source, plugin, install-smoke і суто тестові зміни залишаються на Linux Node lanes, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/package, змін у пакеті/маніфесті bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, суто тестові зміни та зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ із кореневого Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений профіль Docker для bundled-plugin з агрегованим тайм-аутом команди 240 секунд, причому `docker run` кожного сценарію обмежується окремо. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request-ів, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge-комітами, не змушують запускати повний шлях; коли логіка changed-scope запитує повне покриття під час push, workflow залишає швидкий Docker smoke, а повний install smoke віддає нічній або релізній перевірці. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть явно його ввімкнути, але pull request-и і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` заздалегідь збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і будує два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для сценаріїв installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних сценаріїв. Визначення Docker-сценаріїв містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожного сценарію через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає сценарії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів хвостового пулу 10, чутливого до провайдерів, — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких сценаріїв за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб сценарії npm install і багатосервісні сценарії не перевантажували Docker, а легші сценарії все одно заповнювали доступні слоти. Один сценарій, важчий за ефективні ліміти, все одно може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить місткість. Запуск сценаріїв за замовчуванням розноситься на 2 секунди, щоб уникнути локальних сплесків create у Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск виконує попередню перевірку Docker, видаляє застарілі контейнери OpenClaw E2E, показує статус активних сценаріїв, зберігає тривалості сценаріїв для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планування нових сценаріїв у пулі після першої помилки, а кожен сценарій має резервний тайм-аут 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail сценарії використовують жорсткіші окремі обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні сценарії планувальника, включно зі сценаріями лише для релізу, як-от `install-e2e`, і розділеними сценаріями bundled update, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити один невдалий сценарій. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, kind image, live image, lane і credential coverage потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє склад tarball; збирає і пушить package-digest-tagged образи Docker E2E bare/functional у GHCR через Docker layer cache від Blacksmith, коли план вимагає сценаріїв із встановленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` — це високорівнева перевірка пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний workflow Docker E2E. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені коміти без checkout старого коду workflow. Release checks запускають спеціальну delta-перевірку Package Acceptance для цільового ref: bundled-channel compat, офлайн-фікстури плагінів і Telegram package QA для визначеного tarball. Набір Docker для шляху релізу запускає чотири завдання chunks із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому kind image і виконував кілька сценаріїв через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`). OpenWebUI включено до `plugins-runtime`, коли повне покриття шляху релізу цього вимагає, і окремий chunk `openwebui` зберігається лише для запусків, що стосуються тільки OpenWebUI. Chunk `package-update` розділяє installer E2E на `install-e2e-openai` і `install-e2e-anthropic`; `install-e2e` залишається агрегованим псевдонімом для ручного повторного запуску. Chunk `bundled-channels` запускає розділені сценарії `bundled-channel-*` і `bundled-channel-update-*` замість послідовного універсального сценарію `bundled-channel-deps`; `plugins-integrations` залишається застарілим агрегованим псевдонімом для ручних повторних запусків. Кожен chunk завантажує `.artifacts/docker-tests/` із журналами сценаріїв, тривалостями, `summary.json`, `failures.json`, тривалостями фаз, JSON-планом планувальника, таблицями повільних сценаріїв і командами повторного запуску для кожного сценарію. Вхід workflow `docker_lanes` запускає вибрані сценарії на підготовлених образах замість chunk jobs, що обмежує налагодження невдалого сценарію одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибраний сценарій є live Docker-сценарієм, цільове завдання локально збирає live-test image для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожного сценарію містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдалий сценарій міг повторно використати той самий пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести об’єднані/окремі цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень про повільні сценарії і критичний шлях фаз. Запланований workflow live/E2E щодня запускає повний Docker-набір шляху релізу. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair можна було шардувати разом з іншими bundled-перевірками.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широка платформна область CI: зміни у production core запускають typecheck для core prod і core test плюс core lint/guards, зміни лише в core tests запускають лише typecheck для core test плюс core lint, зміни у production extensions запускають typecheck для extension prod і extension test плюс extension lint, а зміни лише в extension tests запускають typecheck лише для extension test плюс extension lint. Публічні зміни в Plugin SDK або plugin-contract розширюють typecheck на extensions, оскільки розширення залежать від цих core-контрактів, але Vitest sweeps для extensions — це явна тестова робота. Зміни лише в метаданих релізу для version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config з міркувань безпеки призводять до запуску всіх check lanes.

Ручні запуски CI виконують `checks-node-compat-node22` як перевірку сумісності для кандидатів на реліз. Звичайні pull request-и і push у `main` пропускають цей сценарій і залишають матрицю сфокусованою на сценаріях тестів/каналів для Node 24.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим і не резервувало зайві runner-и: channel contracts запускаються у вигляді трьох зважених shards, тести bundled plugin балансуються між шістьма worker-ами для розширень, малі core unit lanes поєднані в пари, auto-reply запускається на чотирьох збалансованих worker-ах, а піддерево reply розділене на shards agent-runner, dispatch і commands/state-routing, а конфігурації agentic gateway/plugin розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin тести використовують свої окремі конфігурації Vitest замість спільного універсального набору plugin. Завдання shards для extensions запускають до двох груп plugin config одночасно з одним worker-ом Vitest на групу та більшим heap Node, щоб пакети plugin з важкими import не створювали додаткові CI jobs. Широкий сценарій agents використовує спільний file-parallel scheduler Vitest, оскільки в ньому домінують import/планування, а не один конкретний повільний тестовий файл. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний runtime shard не залишався хвостовим. Shards за include-pattern записують записи тривалості, використовуючи назву CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає compile/canary роботу package-boundary разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard core support-boundary запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі verifier jobs, водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його сценарій unit-test усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK на кожному push, пов’язаному з Android.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується збоєм. Агреговані shard checks використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shards, але не ставали в чергу після того, як увесь workflow уже було замінено новішим.

Ключ автоматичної concurrency для CI версіонований (`CI-v7-*`), щоб завислий на боці GitHub zombie у старій групі черги не міг безкінечно блокувати новіші запуски main. Ручні повні запуски використовують `CI-manual-v1-*` і не скасовують запуски, що вже тривають.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, shards `check`, крім lint, shards і агрегати `check-additional`, aggregate verifiers для Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards Linux Node-тестів, shards тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж заощаджували; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU перевищувала вигоду                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork-ів використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork-ів використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/guards за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з тривалістю по кожному етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести Vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі сценарії CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній CI run push у origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні CI run-и main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати issue/comment noise і вибрати CI push у origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні CI run-и main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
