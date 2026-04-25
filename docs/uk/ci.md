---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі шлюзів і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-25T05:54:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані області.

QA Lab має окремі доріжки CI поза основним workflow із розумним визначенням меж. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний dispatch; він збирає приватне середовище виконання QA і порівнює agentic-набори mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він паралельно розгалужує mock parity gate, live Matrix lane і live Telegram lane. Live-завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників, призначений для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що злитий PR справді merged і що кожен дублікат має або спільну пов’язану issue, або перетин змінених hunks.

Workflow `Docs Agent` — це керована подіями доріжка обслуговування Codex для підтримання наявної документації у відповідності до нещодавно внесених змін. Вона не має окремого запуску за розкладом: її може запустити успішний небойовий push CI на `main`, а ручний dispatch може запустити її безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже змінився або якщо протягом останньої години вже було створено інший не пропущений запуск Docs Agent. Коли вона запускається, то переглядає діапазон комітів від SHA джерела попереднього не пропущеного Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни `main`, накопичені з часу останньої перевірки документації.

Workflow `Test Performance Agent` — це керована подіями доріжка обслуговування Codex для повільних тестів. Вона не має окремого запуску за розкладом: її може запустити успішний небойовий push CI на `main`, але вона пропускається, якщо інший виклик через workflow-run уже виконався або виконується в той самий день UTC. Ручний dispatch обходить цю щоденну перевірку активності. Доріжка будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex вносити лише невеликі зміни продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що не проходять, Codex може виправляти лише очевидні збої, а звіт для повного набору після роботи агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як push бота буде злитий, доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює спробу push; застарілі конфліктні патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в документації, змінених меж, змінених extensions і побудова маніфесту CI | Завжди для non-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                  | Завжди для non-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                               | Завжди для non-draft push і PR       |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для non-draft push і PR       |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані нижчі артефакти | Зміни, що стосуються Node            |
| `checks-fast-core`               | Швидкі доріжки перевірки коректності на Linux, як-от перевірки bundled/plugin-contract/protocol | Зміни, що стосуються Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, що стосуються Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                               | Зміни, що стосуються Node            |
| `checks-node-core-test`          | Шарди тестів ядра Node, без доріжок каналів, bundled, контрактів і extension                | Зміни, що стосуються Node            |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                             | Pull request із змінами extension    |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, що стосуються Node            |
| `check-additional`               | Архітектура, межі, guard-перевірки поверхні extension, меж пакетів і шарди gateway-watch    | Зміни, що стосуються Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | Зміни, що стосуються Node            |
| `checks`                         | Верифікатор для тестів каналів зі зібраними артефактами плюс сумісність Node 22 лише для push | Зміни, що стосуються Node            |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                  | Документацію змінено                 |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                          | Зміни, що стосуються Python Skills   |
| `checks-windows`                 | Специфічні для Windows доріжки тестів                                                       | Зміни, що стосуються Windows         |
| `macos-node`                     | Доріжка тестів TypeScript на macOS із використанням спільних зібраних артефактів            | Зміни, що стосуються macOS           |
| `macos-swift`                    | Swift lint, збирання і тести для застосунку macOS                                           | Зміни, що стосуються macOS           |
| `android`                        | Модульні тести Android для обох flavor плюс одна збірка debug APK                           | Зміни, що стосуються Android         |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний dispatch    |

## Порядок швидкого завершення з помилкою

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими доріжками Linux, щоб нижчі споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені доріжки й доріжки середовища виконання: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж знаходиться в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені доріжки залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Зміни лише маршрутизації CI, вибрані дешеві правки фікстур core-test і вузькі правки helper/test-routing для контрактів Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних shard-ів ядра, shard-ів bundled-plugin і додаткових матриць guard-перевірок, коли змінені файли обмежуються поверхнями маршрутизації або helper, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node обмежені Windows-специфічними обгортками process/path, helper-ами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цю доріжку; не пов’язані зміни в source, Plugin, install-smoke і зміни лише в тестах залишаються на Linux Node доріжках, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними shard-ами тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт меж через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled Plugin і поверхонь core plugin/channel/Gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у source bundled Plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker profile bundled-plugin із загальним тайм-аутом команд 240 секунд, при цьому кожен сценарій `docker run` окремо обмежений. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних dispatch, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push до `main`, включно з merge commit, не примушують повний шлях; коли логіка changed-scope на push запитує повне покриття, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки. Повільний smoke Bun global install image-provider окремо контролюється через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `install-smoke` можуть увімкнути його, але pull request і push до `main` його не запускають. Тести QR та installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний образ live-test і один спільний образ built-app `scripts/e2e/Dockerfile`, а потім запускає smoke-доріжки live/E2E зі зваженим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів хвостового пулу 10, чутливого до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких доріжок за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і multi-service не перевантажували Docker, поки легші доріжки все ще займають доступні слоти. Запуски доріжок за замовчуванням зсуваються на 2 секунди, щоб уникати локальних сплесків створення контейнерів демоном Docker; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних доріжок, зберігає тривалості доріжок для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для аналізу планувальника. За замовчуванням він припиняє планувати нові pooled-доріжки після першої помилки, а кожна доріжка має запасний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail доріжки використовують жорсткіші індивідуальні обмеження. Повторно використовуваний workflow live/E2E відтворює шаблон спільного образу, збираючи й публікуючи один SHA-тегований Docker E2E image у GHCR перед Docker matrix, а потім запускаючи матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний релізний Docker suite. Матриця bundled update розбита за update target, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled checks.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформена межа CI: зміни production у core запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для core test, зміни production у extension запускають typecheck extension prod плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для extension test. Зміни публічного Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extension залежать від цих контрактів core. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі доріжки.

На push матриця `checks` додає доріжку `compat-node22`, яка запускається лише на push. У pull request ця доріжка пропускається, і матриця залишається зосередженою на звичайних доріжках test/channel.

Найповільніші сімейства тестів Node розбиті або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три зважені shard-и, тести bundled Plugin балансуються між шістьма workers для extension, невеликі модульні доріжки core поєднуються попарно, auto-reply виконується на трьох збалансованих workers замість шести дрібних workers, а конфігурації agentic Gateway/Plugin розподіляються по наявних source-only завданнях agentic Node замість очікування built artifacts. Широкі тести browser, QA, media і різних Plugin використовують власні конфігурації Vitest замість спільної універсальної конфігурації Plugin. Завдання shard для extension запускають до двох груп конфігурацій plugin одночасно з одним worker Vitest на групу і більшим heap Node, щоб batches Plugin з важкими import не створювали додаткових завдань CI. Широка доріжка agents використовує спільний file-parallel планувальник Vitest, оскільки в ній домінують import/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із shard-ом `infra core-runtime`, щоб спільний shard runtime не ставав хвостом. `check-additional` тримає разом package-boundary compile/canary і відокремлює архітектуру topology runtime від покриття gateway watch; shard boundary guard виконує свої невеликі незалежні guard-перевірки паралельно в межах одного завдання. Gateway watch, channel tests і shard support-boundary для core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви check як легкі завдання-верифікатори й водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його доріжка модульних тестів усе одно компілює цей flavor з прапорами BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK на кожен Android-relevant push.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні shard-и bundled Plugin. Це зберігає швидкий зворотний зв’язок щодо змінених Plugin для review, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard checks використовують `!cancelled() && always()`, щоб усе одно повідомляти про звичайні збої shard, але не ставати в чергу після того, як увесь workflow уже був витіснений.
Ключ concurrency CI версіонований (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard-и `check`, крім lint, shard-и й агрегатори `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и тестів Linux Node, shard-и тестів bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, так що 8 vCPU коштували дорожче, ніж давали вигоди; Docker builds для install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guard-перевірки
pnpm check:test-types
pnpm check:timed    # той самий шлюз із тривалістю кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі й найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
