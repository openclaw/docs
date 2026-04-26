---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-26T21:05:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6ea2a56e4dddf5fde825868c03783c9e1f241010ebe6165890b7355b45aafd3
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише нерелевантні ділянки.

QA Lab має окремі доріжки CI поза основним робочим процесом із розумним обмеженням за областю змін. Робочий процес `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне QA-середовище виконання та порівнює агентні набори mock GPT-5.5 і Opus 4.6. Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгалужує mock parity gate, живу доріжку Matrix і живу доріжку Telegram як паралельні завдання. Живі завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед затвердженням релізу.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для супровідників, призначений для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно вказані PR, коли `apply=true`. Перш ніж змінювати стан на GitHub, він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільний пов’язаний issue, або перекривні змінені hunks.

Робочий процес `Docs Agent` — це керована подіями доріжка супроводу Codex для підтримання наявної документації у відповідності до нещодавно внесених змін. Він не має окремого запуску за розкладом: його може запустити успішний небoтовий CI-запуск push на `main`, а ручний запуск може виконати його безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже змінився або якщо протягом останньої години вже було створено інший непропущений запуск Docs Agent. Під час запуску він переглядає діапазон комітів від SHA джерела попереднього непропущеного Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в `main`, накопичені з часу останнього проходу документації.

Робочий процес `Test Performance Agent` — це керована подіями доріжка супроводу Codex для повільних тестів. Він не має окремого запуску за розкладом: його може запустити успішний небoтовий CI-запуск push на `main`, але він пропускається, якщо інший виклик через workflow-run уже виконався або виконується в ту саму добу UTC. Ручний запуск обходить це денне обмеження активності. Доріжка створює згрупований звіт про продуктивність Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі зміни продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують кількість тестів базового рівня, що проходять. Якщо в базовому рівні є тести, що не проходять, Codex може виправляти лише очевидні збої, і звіт для повного набору після роботи агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде застосовано, ця доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати таку саму безпечну модель drop-sudo, як і агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Job                              | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та формує маніфест CI | Завжди для non-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                                | Завжди для non-draft push і PR       |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для non-draft push і PR       |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node |
| `checks-fast-core`               | Швидкі Linux-доріжки коректності, як-от перевірки bundled/plugin-contract/protocol            | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                 | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди основних Node-тестів, крім доріжок channel, bundled, contract і extension               | Зміни, релевантні для Node           |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                               | Pull request зі змінами в розширеннях |
| `check`                          | Шардований еквівалент основного локального gate: production-типи, lint, guards, test types і strict smoke | Зміни, релевантні для Node |
| `check-additional`               | Шарди архітектури, меж, guard для поверхні розширень, меж пакетів і gateway-watch             | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                                | Зміни, релевантні для Node           |
| `checks`                         | Верифікатор для тестів каналів зі зібраними артефактами плюс сумісність Node 22 лише для push | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування документації, lint і перевірки на биті посилання                                 | Документацію змінено                 |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                     | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows тестові доріжки                                                        | Зміни, релевантні для Windows        |
| `macos-node`                     | Доріжка тестів TypeScript на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні для macOS          |
| `macos-swift`                    | Swift lint, збирання та тести для застосунку macOS                                            | Зміни, релевантні для macOS          |
| `android`                        | Android unit-тести для обох варіантів плюс одне збирання debug APK                            | Зміни, релевантні для Android        |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                          | Успішний CI на main або ручний запуск |

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно буде готове спільне збирання.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін розміщена в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни в CI workflow перевіряють граф Node CI та linting workflow, але самі по собі не примушують запускати нативні збирання для Windows, Android або macOS; ці платформні доріжки й надалі обмежуються змінами у вихідному коді відповідних платформ.
Зміни лише в маршрутизації CI, окремі дешеві зміни фікстур core-test, а також вузькі зміни helper/test-routing для контрактів Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів channel, повних шардів core, шардів bundled-plugin і додаткових матриць guard, коли змінені файли обмежуються поверхнями маршрутизації або helper, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node обмежені Windows-специфічними wrapper для process/path, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями CI workflow, які виконують цю доріжку; нерелевантні зміни вихідного коду, Plugin, install-smoke і зміни лише в тестах залишаються в Linux Node-доріжках, щоб не резервувати Windows worker з 16 vCPU для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/Gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збирання bundled extension і запускає обмежений Docker profile bundled-plugin з агрегованим тайм-аутом команд 240 секунд, де `docker run` для кожного сценарію також обмежений окремо. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних запусків, перевірок релізу через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke — для нічної або релізної валідації. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `install-smoke` можуть його ввімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальна команда `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, потім запускає live/E2E smoke-доріжки зі зваженим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, також 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких доріжок за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і multi-service не перевантажували Docker, поки легші доріжки все ще заповнюють доступні слоти. Запуски доріжок за замовчуванням зсуваються на 2 секунди, щоб уникнути локальних сплесків створення контейнерів Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат спочатку перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних доріжок, зберігає таймінги доріжок для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для аналізу планувальника. За замовчуванням він припиняє планувати нові pooled-доріжки після першої помилки, а кожна доріжка має запасний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail-доріжки мають жорсткіші індивідуальні обмеження. Повторно використовуваний live/E2E workflow збирає і публікує один SHA-тегований GHCR Docker E2E image, а потім запускає Docker suite релізного шляху максимум у трьох chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk один раз завантажував спільний image і виконував кілька доріжок через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). Кожен chunk завантажує `.artifacts/docker-tests/` із логами доріжок, таймінгами та `summary.json`. Коли Open WebUI запитується разом із suite релізного шляху, він виконується всередині chunk plugins/integrations замість резервування четвертого Docker worker; Open WebUI зберігає окреме standalone-завдання лише для запусків openwebui-only. Запланований live/E2E workflow щодня запускає повний Docker suite релізного шляху. Матрицю bundled update розбито за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled-перевірками.

Локальна логіка changed-lane розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широкий платформний scope у CI: зміни в core production запускають typecheck core prod плюс core tests, зміни лише в core tests запускають лише typecheck/tests core test, зміни в extension production запускають typecheck extension prod плюс extension tests, а зміни лише в extension tests запускають лише typecheck/tests extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extensions, оскільки extensions залежать від цих контрактів core. Оновлення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config із міркувань безпеки спрямовуються на всі доріжки.

Для push матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request ця доріжка пропускається, і матриця залишається зосередженою на звичайних test/channel-доріжках.

Найповільніші сімейства Node-тестів розбиті або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runners: контракти channel запускаються трьома зваженими shards, тести bundled plugin балансуються між шістьма workers для extension, невеликі core unit-доріжки об’єднуються в пари, auto-reply запускається на чотирьох збалансованих workers із розбиттям піддерева reply на shards agent-runner, dispatch і commands/state-routing, а конфігурації agentic Gateway/Plugin розподіляються між наявними Node-завданнями agentic лише для source без очікування built artifacts. Широкі browser-, QA-, media- і miscellaneous Plugin-тести використовують свої окремі конфігурації Vitest замість спільного catch-all для plugins. Завдання shard для extension запускають до двох груп конфігурацій plugin одночасно з одним Vitest worker на групу і більшим Node heap, щоб важкі щодо імпорту пакети plugins не створювали додаткові CI jobs. Широка доріжка agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують import/scheduling, а не один повільний test file. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime-shard не залишався найдовшим. Shards за include-pattern записують entries таймінгів, використовуючи ім’я CI shard, тож `.artifacts/vitest-shard-timings.json` може розрізняти цілу конфігурацію і відфільтрований shard. `check-additional` тримає compile/canary-роботи package-boundary разом і відокремлює архітектуру topology runtime від покриття gateway watch; shard boundary guard виконує свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard support-boundary для core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі імена перевірок як легкі verifier-завдання, але уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Варіант third-party не має окремого source set або manifest; його доріжка unit-тестів усе одно компілює цей варіант із прапорами BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK на кожному Android-релевантному push.
`extension-fast` є лише для PR, оскільки push-запуски вже виконують повні shards bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugins для review без резервування додаткового Blacksmith worker у `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref теж не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні збої shards, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ concurrency для CI має версію (`CI-v7-*`), тож zombie на боці GitHub у старій queue group не може безкінечно блокувати новіші запуски `main`.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані verifier-завдання Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збирання install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж заощаджував                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks використовують `macos-latest` як резервний варіант                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks використовують `macos-latest` як резервний варіант                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # формат документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній CI-запуск push у origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні CI-запуски main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати issue/comment noise і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні CI-запуски main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
