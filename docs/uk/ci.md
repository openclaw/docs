---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions.
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T03:28:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60f5d91f151cde13442e09341f75de6f3a2a325d467527e1f4aa33bad894a2b5
    source_path: ci.md
    workflow: 15
---

CI запускається після кожного push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області змін і розгортають повний стандартний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, відправляє
ручний workflow `CI` із цією ціллю та відправляє `OpenClaw Release Checks`
для інсталяційного smoke, Docker-наборів для шляху релізу, live/E2E, OpenWebUI, QA Lab
parity, а також lane для Matrix і Telegram. Він також може запускати post-publish workflow `NPM
Telegram Beta E2E`, якщо надано специфікацію опублікованого пакета.

`Package Acceptance` — це side-run workflow для валідації артефакту пакета
без блокування workflow релізу. Він визначає одного кандидата з довіреного
ref, опублікованої npm-специфікації, HTTPS tarball URL із SHA-256 або tarball-артефакту
з іншого запуску GitHub Actions, завантажує його як `package-under-test`,
а потім повторно використовує планувальник Docker release/E2E з цим tarball замість
пакування вибраного ref. Профілі охоплюють smoke, package, product, full і
власні вибори Docker lane. Необов’язковий lane для Telegram доступний лише для published-npm
і повторно використовує workflow `NPM Telegram Beta E2E`.

QA Lab має окремі lane CI поза основним workflow з розумним визначенням області змін. Workflow
`Parity gate` запускається для відповідних змін у PR і через ручний dispatch; він
збирає приватне QA runtime і порівнює агентні пакети mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний dispatch; він розгортає mock parity gate, live lane для Matrix і live
lane для Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а lane для Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі lane QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для maintainer після злиття
для очищення дублікатів. За замовчуванням він використовує dry-run і закриває лише явно
вказані PR, коли `apply=true`. Перед зміною стану на GitHub він перевіряє, що
злитий PR справді merged і що кожен дублікат має або спільне пов’язане issue,
або перекриття змінених hunk.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримання
наявної документації у відповідності до нещодавно влитих змін. У нього немає окремого розкладу: успішний запуск CI після push не від бота на `main` може його запустити,
а ручний dispatch може запустити його безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже пішов далі або якщо
інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він
переглядає діапазон комітів від SHA джерела попереднього непропущеного Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни `main`, накопичені
з часу останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex
для повільних тестів. У нього немає окремого розкладу: успішний запуск CI після push не від бота на
`main` може його запустити, але він пропускається, якщо інший виклик через workflow-run уже
виконався або виконується в ту саму добу UTC. Ручний dispatch обходить цей денний
шлюз активності. Lane будує звіт про продуктивність Vitest для повного набору тестів,
дозволяє Codex вносити лише невеликі зміни до продуктивності тестів без зниження покриття замість широких
рефакторингів, потім повторно запускає звіт для повного набору і відхиляє зміни,
які зменшують кількість тестів базової лінії, що проходять. Якщо в базовій лінії є тести, що падають,
Codex може виправляти лише очевидні збої, і звіт для повного набору після роботи агента
має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як push бота буде влитий, lane
перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберігати ту саму безпечну модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                 |
| --------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                       | Визначає зміни лише в документації, області змін, змінені extensions і формує маніфест CI   | Завжди для недрафтових push і PR  |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR  |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для недрафтових push і PR  |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR  |
| `build-artifacts`                 | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream-артефакти | Зміни, релевантні для Node        |
| `checks-fast-core`                | Швидкі Linux lane коректності, як-от bundled/plugin-contract/protocol checks                 | Зміни, релевантні для Node        |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node        |
| `checks-node-extensions`          | Повні shard bundled-plugin тестів для всього набору extension                                | Зміни, релевантні для Node        |
| `checks-node-core-test`           | Shard основних тестів Node, без lane каналів, bundled, контрактів і extension                | Зміни, релевантні для Node        |
| `check`                           | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node        |
| `check-additional`                | Архітектура, межі, guards поверхні extension, package-boundary і shard gateway-watch         | Зміни, релевантні для Node        |
| `build-smoke`                     | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                          | Зміни, релевантні для Node        |
| `checks`                          | Верифікатор для built-artifact тестів каналів                                                | Зміни, релевантні для Node        |
| `checks-node-compat-node22`       | Lane сумісності Node 22 для збірки та smoke                                                  | Ручний dispatch CI для релізів    |
| `check-docs`                      | Перевірки форматування документації, lint і битих посилань                                   | Документацію змінено              |
| `skills-python`                   | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                  | Специфічні для Windows lane тестів                                                           | Зміни, релевантні для Windows     |
| `macos-node`                      | Lane тестів TypeScript на macOS із використанням спільних built artifacts                    | Зміни, релевантні для macOS       |
| `macos-swift`                     | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS       |
| `android`                         | Модульні тести Android для обох flavor плюс одна debug APK-збірка                            | Зміни, релевантні для Android     |
| `test-performance-agent`          | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх CI на main або ручний dispatch |

Ручні dispatch-запуски CI виконують той самий граф завдань, що й звичайний CI, але
примусово вмикають кожен lane з визначенням області змін: Linux Node shard, bundled-plugin shard, контракти каналів,
сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS, Android і i18n для Control UI. Ручні запуски використовують
унікальну групу concurrency, щоб повний набір для кандидата на реліз не був скасований
іншим запуском push або PR на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному виклику виконати цей граф для гілки, тегу або повного SHA коміту, водночас
використовуючи файл workflow з вибраного ref dispatch.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж почнуть виконуватися дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформені та runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує маніфест preflight
працювати так, ніби змінилася кожна область із визначенням області змін.
Зміни workflow CI перевіряють граф Node CI та linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені lane і далі визначаються змінами у вихідному коді платформи.
Зміни лише в маршрутизації CI, окремі дешеві зміни фікстур core-test і вузькі зміни helper/test-routing для контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних shard core, shard bundled-plugin і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node визначаються змінами в специфічних для Windows обгортках process/path, helper для npm/pnpm/UI runner, конфігурації package manager і поверхнях workflow CI, що запускають цей lane; непов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються на lane Linux Node, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними shard тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker-профіль bundled-plugin з сумарним тайм-аутом команд 240 секунд, де `docker run` для кожного сценарію окремо також обмежений. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запланованих запусків, ручних dispatch, перевірок релізу через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push до `main`, включно з merge-комітами, не примушують повний шлях; коли логіка changed-scope запросила б повне покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke переносить на нічну перевірку або валідацію релізу. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `install-smoke` можуть його увімкнути, але pull request і push до `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для lane installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lane. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів 10 для основного пулу через `OPENCLAW_DOCKER_ALL_PARALLELISM` і типову кількість слотів 10 для tail-пулу, чутливого до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Ліміти для важких lane за замовчуванням — `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lane з npm install і кількома сервісами не перевантажували Docker, тоді як легші lane все ще заповнюють доступні слоти. Запуски lane за замовчуванням зсуваються на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск перед перевіркою готує Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних lane, зберігає таймінги lane для порядку від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планувати нові lane в пулі після першої помилки, а кожен lane має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lane використовують жорсткіші обмеження для кожного lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane планувальника, зокрема lane лише для релізу, такі як `install-e2e`, і розділені lane оновлення bundled, такі як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити один невдалий lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, тип образу, live image, lane і покриття credential потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує наданий викликачем артефакт пакета, перевіряє inventory tarball, збирає й публікує образи GHCR Docker E2E типів bare/functional із тегом digest пакета, коли плану потрібні lane зі встановленням пакета, і повторно використовує ці образи, коли той самий digest пакета вже підготовлено. Docker-набір для шляху релізу запускається максимум як три chunk-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише той тип образу, який йому потрібен, і виконував кілька lane через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). Кожен chunk завантажує `.artifacts/docker-tests/` із журналами lane, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника і командами повторного запуску для кожного lane. Вхід workflow `docker_lanes` запускає вибрані lane проти підготовлених образів замість трьох chunk-завдань, що обмежує налагодження невдалого lane одним цільовим Docker-завданням і готує або завантажує артефакт пакета для цього запуску; якщо вибраний lane є live Docker lane, цільове завдання локально збирає образ live-test для цього повторного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести комбіновані/цільові команди повторного запуску для кожного lane; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lane і критичного шляху фаз. Коли Open WebUI запитується разом із набором шляху релізу, він запускається всередині chunk plugins/integrations замість резервування четвертого Docker worker; Open WebUI зберігає окреме завдання лише для dispatch лише openwebui. Запланований workflow live/E2E щодня запускає повний Docker-набір шляху релізу. Матриця оновлення bundled розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими перевірками bundled.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірок суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни в production-коді core запускають typecheck core prod і core test разом із core lint/guards, зміни лише в тестах core запускають лише typecheck core test разом із core lint, зміни в production-коді extension запускають typecheck extension prod і extension test разом із extension lint, а зміни лише в тестах extension запускають typecheck extension test разом із extension lint. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до typecheck extension, оскільки extension залежать від цих контрактів core, але повні прогони Vitest для extension — це явна тестова робота. Версійні підвищення лише в метаданих релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірки на всі lane.

Ручні dispatch-запуски CI виконують `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request і push до `main` пропускають цей lane і тримають матрицю зосередженою на lane тестів/каналів Node 24.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим і не резервувало зайві runner: контракти каналів працюють у трьох зважених shard, тести bundled plugin балансуються між шістьма workers extension, малі lane модульних тестів core об’єднуються в пари, auto-reply виконується на чотирьох збалансованих workers із поділом піддерева reply на shard agent-runner, dispatch і commands/state-routing, а агентні конфігурації gateway/plugin розподіляються по наявних agentic Node-завданнях лише для вихідного коду замість очікування built artifacts. Широкі тести browser, QA, media і різних plugin використовують свої окремі конфігурації Vitest замість спільного універсального набору plugin. Shard-завдання extension запускають до двох груп конфігурацій plugin одночасно з одним worker Vitest на групу і більшим heap Node, щоб пакети plugin з важкими імпортами не створювали додаткових завдань CI. Широкий lane agents використовує спільний планувальник файлового паралелізму Vitest, бо в ньому домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard infra core-runtime, щоб спільний runtime shard не залишався «хвостом». Shard із include-pattern записують таймінги, використовуючи назву shard CI, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає разом compile/canary роботу для package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guard паралельно в межах одного завдання. Gateway watch, тести каналів і shard support-boundary core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі завдання-верифікатори та уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає debug APK для Play. Flavor third-party не має окремого source set або manifest; його lane модульних тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK на кожному push, релевантному для Android.
GitHub може позначати застарілі завдання як `cancelled`, коли новіший push приходить у той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref теж не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні помилки shard, але не стають у чергу після того, як увесь workflow уже був витіснений новішим.
Автоматичний ключ concurrency CI має версію (`CI-v7-*`), щоб «зомбі» на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`. Ручні повні набори використовують `CI-manual-v1-*` і не скасовують виконувані запуски.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard `check`, окрім lint, shard і агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard тестів Linux Node, shard тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали економію; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав економію                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за архітектурними lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести Vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # збірка dist, коли важливі lane CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній запуск push CI для origin/main
pnpm ci:timings:recent                        # порівняти останні успішні запуски CI для main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти останні успішні запуски CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
