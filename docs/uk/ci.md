---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, пороги охоплення та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-26T22:39:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: da03ca18ec9d3cc7057ce33d22fc692a2e0735e5bc88fedec7cfc1e144d49cd6
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі доріжки CI поза основним робочим процесом із розумним визначенням охоплення. Робочий процес
`Parity gate` запускається для PR зі відповідними змінами та через ручний запуск; він
збирає приватне середовище виконання QA і порівнює агентні набори mock GPT-5.5 і Opus 4.6.
Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний запуск; він розгалужує mock parity gate, live-доріжку Matrix і live-доріжку
Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а доріжка Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі доріжки QA Lab перед погодженням релізу.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно
вказані PR, коли `apply=true`. Перш ніж змінювати стан у GitHub, він перевіряє,
що злитий PR справді змерджено і що кожен дублікат має або спільну згадану issue,
або перетин змінених фрагментів.

Робочий процес `Docs Agent` — це керована подіями доріжка обслуговування Codex для підтримання
наявної документації у відповідності до нещодавно злитих змін. Він не має суто планового запуску:
його може запустити успішний неботовий запуск CI після push у `main`, а
ручний запуск може виконати його безпосередньо. Запуски через workflow-run пропускаються,
коли `main` уже просунувся вперед або коли за останню годину вже було створено
інший непропущений запуск Docs Agent. Коли він виконується, він
переглядає діапазон комітів від SHA джерела попереднього непропущеного Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені
з моменту останнього проходу документації.

Робочий процес `Test Performance Agent` — це керована подіями доріжка обслуговування Codex
для повільних тестів. Він не має суто планового запуску: його може запустити
успішний неботовий запуск CI після push у `main`, але він пропускається, якщо
інший запуск через workflow-run уже виконався або виконується в той UTC-день.
Ручний запуск обходить це денне обмеження активності. Доріжка збирає звіт про продуктивність
Vitest для повного набору тестів із групуванням, дозволяє Codex вносити лише невеликі
виправлення продуктивності тестів без зменшення покриття замість широких рефакторингів, потім
повторно запускає звіт для повного набору і відхиляє зміни, які зменшують
кількість тестів базової лінії, що проходять. Якщо в базовій лінії є тести, що падають,
Codex може виправляти лише очевидні збої, а звіт для повного набору після роботи агента
має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того,
як push бота буде злитий, доріжка перебазовує перевірений патч, повторно запускає
`pnpm check:changed` і повторює спробу push; застарілі конфліктні патчі пропускаються.
Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла
зберігати ту саму безпечну політику без `sudo`, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                    |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                       | Визначає зміни лише в документації, змінені області охоплення, змінені extensions і формує маніфест CI | Завжди для недрафтових push і PR     |
| `security-scm-fast`               | Виявлення приватних ключів і аудит робочих процесів через `zizmor`                            | Завжди для недрафтових push і PR     |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisory npm                                   | Завжди для недрафтових push і PR     |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для недрафтових push і PR     |
| `build-artifacts`                 | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node           |
| `checks-fast-core`                | Швидкі доріжки перевірки коректності на Linux, як-от bundled/plugin-contract/protocol checks  | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                  | Зміни, релевантні для Node           |
| `checks-node-extensions`          | Повні шарди тестів bundled plugins для всього набору extensions                               | Зміни, релевантні для Node           |
| `checks-node-core-test`           | Шарди core Node тестів, окрім доріжок channel, bundled, contract і extension                  | Зміни, релевантні для Node           |
| `extension-fast`                  | Цільові тести лише для змінених bundled plugins                                               | Pull request зі змінами в extension  |
| `check`                           | Шардований еквівалент основного локального порогу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`                | Шарди для архітектури, меж, захисту поверхні extension, меж пакетів і gateway-watch           | Зміни, релевантні для Node           |
| `build-smoke`                     | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                                | Зміни, релевантні для Node           |
| `checks`                          | Верифікатор для тестів каналів на зібраних артефактах плюс сумісність Node 22 лише для push   | Зміни, релевантні для Node           |
| `check-docs`                      | Форматування документації, lint і перевірки битих посилань                                    | Документацію змінено                 |
| `skills-python`                   | Ruff + pytest для Skills на Python                                                            | Зміни, релевантні для Python Skills  |
| `checks-windows`                  | Специфічні для Windows доріжки тестів                                                         | Зміни, релевантні для Windows        |
| `macos-node`                      | Доріжка тестів TypeScript на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні для macOS          |
| `macos-swift`                     | Swift lint, збірка і тести для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                         | Android unit-тести для обох flavor плюс одна debug APK-збірка                                 | Зміни, релевантні для Android        |
| `test-performance-agent`          | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх main CI або ручний запуск      |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко з помилкою, не чекаючи важчих завдань для артефактів і платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування робочих процесів CI перевіряють граф Node CI та lint робочих процесів, але самі по собі не змушують запускати нативні збірки для Windows, Android або macOS; ці платформні доріжки, як і раніше, обмежуються змінами у вихідному коді відповідної платформи.
Редагування лише маршрутизації CI, окремі дешеві зміни фікстур core-тестів і вузькі зміни helper/test-routing для контрактів plugins використовують швидкий шлях маніфесту лише для Node: preflight, security і єдине завдання `checks-fast-core`. Цей шлях обходить build artifacts, сумісність Node 22, контракти каналів, повні шарди core, шарди bundled plugins і додаткові матриці guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежуються специфічними для Windows обгортками process/path, helper для запуску npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями робочих процесів CI, які виконують цю доріжку; нерелевантні зміни у вихідному коді, plugins, install-smoke та зміни лише в тестах залишаються на Linux Node-доріжках, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними шардами тестів.
Окремий робочий процес `install-smoke` повторно використовує той самий script для охоплення через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugins і core-поверхонь plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді bundled plugins, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ із root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker profile bundled-plugin з агрегованим timeout команди у 240 секунд, де для кожного сценарію окремо обмежено `docker run`. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запусків за розкладом, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge-комітами, не примушують повний шлях; коли логіка changed-scope запитує повне покриття для push, робочий процес залишає швидкий Docker smoke, а повний install smoke віддає нічній або релізній валідації. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається в нічному розкладі та з робочого процесу release checks, а ручні запуски `install-smoke` можуть явно його увімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для доріжок installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних доріжок. Визначення Docker-доріжок містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для доріжки через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1`; типову кількість слотів основного пулу 10 можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу 10, чутливого до provider, — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких доріжок за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і багатосервісні доріжки не перевантажували Docker, поки легші доріжки все ще заповнюють доступні слоти. Запуск доріжок за замовчуванням зсувається на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; це можна перевизначити через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних доріжок, зберігає час виконання доріжок для впорядкування за принципом longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планувати нові pooled-доріжки після першої помилки, і кожна доріжка має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail-доріжки використовують жорсткіші обмеження для кожної доріжки. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні доріжки планувальника, включно з доріжками лише для релізу, як-от `install-e2e`, і розділеними доріжками оновлення bundled, як-от `bundled-channel-update-acpx`, водночас пропускаючи cleanup smoke, щоб агенти могли відтворити одну зламану доріжку. Повторно використовуваний робочий процес live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, тип образу, live-образ, доріжка та покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summary. Він пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, збирає та пушить один bare GHCR Docker E2E image із тегом SHA, коли план потребує доріжок install/update/plugin-dependency, і збирає один functional GHCR Docker E2E image із тегом SHA, коли план потребує функціональних доріжок із встановленим package. Docker-набір для релізного шляху запускається максимум як три chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька доріжок через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). Кожен chunk завантажує `.artifacts/docker-tests/` із логами доріжок, таймінгами, `summary.json`, таймінгами фаз, JSON-планом планувальника та командами повторного запуску для кожної доріжки. Вхід `docker_lanes` робочого процесу запускає вибрані доріжки на підготовлених образах замість трьох chunked jobs, що обмежує налагодження зламаної доріжки одним цільовим Docker job; якщо вибрана доріжка є live Docker-доріжкою, цільове завдання локально збирає live-test image для такого повторного запуску. Коли для release-path suite запитується Open WebUI, він виконується всередині chunk plugins/integrations замість резервування четвертого Docker worker; Open WebUI зберігає окреме завдання лише для dispatch, призначених тільки для openwebui. Запланований робочий процес live/E2E щодня запускає повний release-path Docker suite. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled-перевірками.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний поріг суворіший щодо архітектурних меж, ніж широке CI-охоплення платформ: зміни в core production запускають typecheck core prod плюс core-тести, зміни лише в core-тестах запускають лише typecheck/tests для core-тестів, зміни в extension production запускають typecheck extension prod плюс extension-тести, а зміни лише в extension-тестах запускають лише typecheck/tests для extension-тестів. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extensions, оскільки extensions залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі доріжки.

Для push матриця `checks` додає доріжку `compat-node22`, що запускається лише для push. Для pull request ця доріжка пропускається, і матриця залишається зосередженою на звичайних тестових доріжках і доріжках каналів.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три зважені шарди, тести bundled plugins балансуються між шістьма workers для extension, малі unit-доріжки core попарно поєднуються, auto-reply виконується на чотирьох збалансованих workers із розбиттям піддерева reply на шарди agent-runner, dispatch і commands/state-routing, а конфігурації agentic gateway/plugin розподіляються між наявними Node-завданнями agentic лише для source, замість очікування на build artifacts. Широкі browser-, QA-, media- і miscellaneous plugin-тести використовують свої окремі конфігурації Vitest замість спільного універсального набору для plugins. Завдання шардів extension одночасно запускають до двох груп конфігурацій plugins з одним worker Vitest на групу і більшим heap Node, щоб batch-набори plugins з важкими import не створювали додаткових завдань CI. Широка доріжка agents використовує спільний file-parallel scheduler Vitest, оскільки її визначають imports/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із шардом infra core-runtime, щоб спільний runtime-shard не залишався хвостовим. Шарди за include-pattern записують таймінги з використанням назви CI-shard, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає разом compile/canary-роботи для package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard виконує свої невеликі незалежні guard-перевірки паралельно в межах одного завдання. Gateway watch, тести каналів і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої попередні назви перевірок як легкі завдання-верифікатори та уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його доріжка unit-тестів усе одно компілює цей flavor з прапорцями SMS/call-log у BuildConfig, водночас уникаючи дубльованого пакування debug APK для кожного push, релевантного для Android.
`extension-fast` є лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugins. Це зберігає швидкий зворотний зв’язок для перевірки змінених plugins без резервування додаткового Blacksmith worker у `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь робочий процес уже було витіснено.
Ключ concurrency для CI має версіювання (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugins, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоди; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується резервний перехід на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується резервний перехід на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний поріг: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний поріг: production tsgo + шардований lint + паралельні швидкі guard-перевірки
pnpm check:test-types
pnpm check:timed    # той самий поріг із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # збірка dist, коли важливі доріжки CI artifact/build-smoke
pnpm ci:timings                               # підсумок останнього запуску push CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # підсумок wall time, queue time і найповільніших завдань
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум від issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
