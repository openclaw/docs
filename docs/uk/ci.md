---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, перевірки областей дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-25T17:32:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

QA Lab має окремі смуги CI поза основним workflow з розумним визначенням області дії. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний dispatch; він збирає приватне середовище виконання QA та порівнює mock agentic pack для GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а смуга Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі смуги QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злита PR справді об’єднана, і що кожен дублікат має або спільну згадану issue, або перетин змінених фрагментів.

Workflow `Docs Agent` — це event-driven смуга технічного обслуговування Codex для підтримання наявної документації у відповідності до нещодавно злитих змін. Вона не має окремого розкладу: її може запустити успішний запуск CI після push у `main` не від бота, а також її можна запустити безпосередньо через ручний dispatch. Виклики через workflow-run пропускаються, якщо `main` уже змінився або якщо за останню годину вже було створено інший не пропущений запуск Docs Agent. Коли вона запускається, вона переглядає діапазон комітів від попереднього вихідного SHA не пропущеного Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven смуга технічного обслуговування Codex для повільних тестів. Вона не має окремого розкладу: її може запустити успішний запуск CI після push у `main` не від бота, але вона пропускається, якщо інший виклик через workflow-run уже виконувався або виконується в той самий день UTC. Ручний dispatch обходить це денне обмеження активності. Смуга будує згрупований звіт про продуктивність Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що не проходять, Codex може виправляти лише очевидні збої, а звіт для повного набору тестів після роботи агента має пройти перед будь-яким комітом. Коли `main` просувається вперед до того, як push бота буде доставлено, смуга перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює спробу push; застарілі патчі з конфліктами пропускаються. Вона використовує Ubuntu, розміщену на GitHub, щоб дія Codex могла зберігати ту саму безпечну модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в docs, змінені області дії, змінені extensions і будує маніфест CI     | Завжди для нечернеткових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для нечернеткових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built artifacts і повторно використовувані downstream artifacts | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі смуги коректності Linux, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled plugins для всього набору extensions                              | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди основних тестів Node, за винятком channel, bundled, contract і extension смуг          | Зміни, релевантні для Node           |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Pull request зі змінами в extensions |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Шарди перевірок архітектури, меж, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні для Node           |
| `checks`                         | Верифікатор для built-artifact channel tests плюс сумісність Node 22 лише для push           | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування docs, lint і перевірки зламаних посилань                                        | Docs змінено                         |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows тестові смуги                                                         | Зміни, релевантні для Windows        |
| `macos-node`                     | Смуга тестів TypeScript на macOS із використанням спільних built artifacts                   | Зміни, релевантні для macOS          |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK build                                 | Зміни, релевантні для Android        |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний main CI або ручний dispatch |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні смуги залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Зміни лише в маршрутизації CI, окремі вибрані дешеві зміни у фікстурах core-test і вузькі зміни в helper/test-routing для контрактів plugins використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних shard core, shard bundled plugins і додаткових матриць перевірок, коли змінені файли обмежуються поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю смугу; не пов’язані зміни у вихідному коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node smugi, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest у bundled plugins і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugins, зміни лише в тестах і зміни лише в docs не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає e2e для container gateway-network, перевіряє build arg для bundled extension і запускає обмежений Docker profile для bundled-plugin із сукупним timeout команди 240 секунд, де для кожного сценарію `docker run` обмежується окремо. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних dispatch, workflow-call перевірок релізу і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge-комітами, не примушують повний шлях; коли логіка changed-scope запитує повне покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke переносить на нічну або релізну валідацію. Повільний smoke для Bun global install image-provider окремо контролюється через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `install-smoke` можуть увімкнути його, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на інсталяцію. Локальний `test:docker:all` попередньо збирає один спільний образ live-test і один спільний образ built-app з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes із ваговим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких смуг за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб смуги npm install і multi-service не перевантажували Docker, поки легші смуги заповнюють доступні слоти. Запуски смуг за замовчуванням зміщуються на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; змініть через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат перед запуском перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, показує стан активних смуг, зберігає час виконання смуг для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перегляду планувальника. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна смуга має резервний timeout 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші обмеження для конкретної смуги. Повторно використовуваний workflow live/E2E віддзеркалює шаблон спільного образу, збираючи й публікуючи один SHA-tagged образ Docker E2E у GHCR перед Docker-матрицею, а потім запускаючи матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір релізного шляху. Матриця bundled update поділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair можна було шардити разом з іншими bundled checks.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широка платформна область дії CI: production-зміни core запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, production-зміни extension запускають typecheck extension prod плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extensions, оскільки extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускає цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірку на всі смуги.

Для push матриця `checks` додає смугу `compat-node22`, яка виконується лише для push. Для pull request ця смуга пропускається, і матриця зосереджується на звичайних test/channel lanes.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів працюють як три вагові shard, тести bundled plugins балансуються між шістьма extension workers, малі core unit lanes об’єднані в пари, auto-reply працює як три збалансовані workers замість шести крихітних workers, а конфігурації agentic gateway/plugin розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser-, QA-, media- і miscellaneous plugin-тести використовують власні конфігурації Vitest замість спільного універсального набору для plugins. Завдання shard extension запускають до двох груп конфігурацій plugins одночасно з одним worker Vitest на групу і більшим heap Node, щоб import-heavy пакети plugins не створювали додаткових CI jobs. Широка смуга agents використовує спільний file-parallel планувальник Vitest, оскільки в ній домінують import/scheduling, а не один повільний test file. `runtime-config` виконується разом зі shard infra core-runtime, щоб спільний runtime shard не залишався в хвості. `check-additional` тримає разом compile/canary-роботи package-boundary і відокремлює архітектуру топології runtime від покриття gateway watch; shard boundary guard виконує свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard меж core support виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи старі назви перевірок як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого набору вихідного коду чи manifest; його смуга unit-тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дублювання завдання пакування debug APK для кожного push, релевантного для Android.
`extension-fast` виконується лише для PR, тому що push-запуски вже виконують повні shard bundled plugins. Це зберігає швидкий зворотний зв’язок щодо змінених plugins для рев’ю, не резервуючи зайвий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shard, але не ставали в чергу після того, як увесь workflow уже було витіснено.
Ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie в старій групі черги на боці GitHub не міг безстроково блокувати новіші запуски `main`.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard-и `check`, окрім lint, shard-и та агрегати `check-additional`, aggregate verifier-и тестів Node, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщену на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и тестів Linux Node, shard-и тестів bundled plugins, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоди; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з тривалістю для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # зібрати dist, коли мають значення смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні main-запуски CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
