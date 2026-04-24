---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions.
summary: Граф завдань CI, обмеження області перевірок і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-24T19:39:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8890c5e518bcc98d4980018b3bb3f67eb131cb5781c0b5c7251b2d8e75d9b19e
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

QA Lab має окремі доріжки CI поза основним workflow з розумним обмеженням області. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне QA runtime і порівнює агентні набори mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує Convex leases. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для післямержевого очищення дублікатів. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що замержений PR дійсно злитий, і що кожен дублікат має або спільне пов’язане issue, або перетин змінених фрагментів.

Workflow `Docs Agent` — це керована подіями доріжка обслуговування Codex для підтримання наявної документації у відповідності до нещодавно злитих змін. Вона не має окремого запуску за розкладом: її може запустити успішний небoтовий CI-run після push у `main`, а також її можна запустити напряму вручну. Виклики через workflow-run пропускаються, якщо `main` уже пішов далі або якщо протягом останньої години вже було створено інший непроґавлений запуск Docs Agent. Коли вона виконується, вона переглядає діапазон комітів від source SHA попереднього непроґавленого запуску Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни `main`, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це керована подіями доріжка обслуговування Codex для повільних тестів. Вона не має окремого запуску за розкладом: її може запустити успішний небoтовий CI-run після push у `main`, але вона пропускається, якщо інший виклик через workflow-run уже виконався або виконується того самого дня за UTC. Ручний запуск обходить це денне обмеження активності. Доріжка будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex робити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що не проходять, Codex може виправляти лише очевидні збої, а після цього повний звіт має пройти, перш ніж щось буде закомічено. Коли `main` просувається далі до того, як bot push буде застосовано, доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначення змін лише в документації, змінених областей, змінених extensions і побудова CI manifest | Завжди для недрафтових push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                | Завжди для недрафтових push і PR     |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для недрафтових push і PR     |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні Node               |
| `checks-fast-core`               | Швидкі Linux-доріжки коректності, як-от перевірки bundled/plugin-contract/protocol           | Зміни, релевантні Node               |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, релевантні Node               |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extensions                               | Зміни, релевантні Node               |
| `checks-node-core-test`          | Шарди core Node tests, без channel, bundled, contract і extension-доріжок                    | Зміни, релевантні Node               |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request із змінами в extensions |
| `check`                          | Шардований еквівалент головної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node               |
| `check-additional`               | Архітектурні, boundary, extension-surface guards, package-boundary і gateway-watch шарди     | Зміни, релевантні Node               |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка стартової пам’яті                                | Зміни, релевантні Node               |
| `checks`                         | Верифікатор для channel tests на зібраних артефактах плюс сумісність Node 22 тільки для push | Зміни, релевантні Node               |
| `check-docs`                     | Форматування docs, lint і перевірки битих посилань                                           | Змінено docs                         |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Специфічні для Windows тестові доріжки                                                       | Зміни, релевантні Windows            |
| `macos-node`                     | Доріжка TypeScript-тестів на macOS із використанням спільних зібраних артефактів             | Зміни, релевантні macOS              |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | Зміни, релевантні macOS              |
| `android`                        | Android unit tests для обох flavor плюс одна debug APK build                                 | Зміни, релевантні Android            |
| `test-performance-agent`         | Щоденна Codex-оптимізація повільних тестів після довіреної активності                        | Успіх Main CI або ручний запуск      |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих matrix-завдань для артефактів і платформ.
3. `build-artifacts` перекривається з швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише PR-ове `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Редагування CI workflow перевіряє Node CI graph плюс linting workflow, але саме по собі не примушує запускати нативні збірки Windows, Android або macOS; ці платформні доріжки залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Windows Node checks обмежені Windows-специфічними обгортками для process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями CI workflow, що запускають цю доріжку; непов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються на Linux Node lanes, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest у bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і лише в docs не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений Docker profile bundled-plugin з тайм-аутом команди 120 секунд. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запусків за розкладом, ручних запусків, workflow-call release checks і pull request, які справді зачіпають installer/package/Docker surface. Push у `main`, включно з merge commit, не примушують повний шлях; коли логіка changed-scope хотіла б вимагати повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть за бажанням його ввімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартний паралелізм основного пулу 8 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і паралелізм tail-пулу 8, чутливого до провайдерів, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Запуски доріжок за замовчуванням розносяться на 2 секунди, щоб уникати локальних бур створення в Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегатор за замовчуванням припиняє планувати нові pooled lanes після першої помилки, а кожна доріжка має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Повторно використовуваний live/E2E workflow віддзеркалює шаблон спільного image, збираючи й пушачи один Docker E2E image у GHCR з SHA-тегом перед Docker matrix, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний Docker suite релізного шляху. Повна матриця bundled update/channel лишається manual/full-suite, оскільки виконує повторні справжні проходи npm update і doctor repair.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широка платформна область CI: зміни в core production запускають core prod typecheck плюс core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни в extension production запускають extension prod typecheck плюс extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extensions, тому що extensions залежать від цих core contracts. Зміни лише в release metadata зі збільшенням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірку на всі доріжки.

Під час push матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request цю доріжку пропущено, і матриця залишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені шарди, bundled plugin tests балансуються між шістьма workers для extensions, малі core unit lanes поєднуються в пари, auto-reply запускається як три збалансовані workers замість шести крихітних workers, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. Широкі browser-, QA-, media- та інші plugin tests використовують свої спеціалізовані конфігурації Vitest замість спільного універсального набору plugin. Завдання shard для extensions запускають до двох груп конфігурацій plugin одночасно з одним worker Vitest на групу та більшим heap Node, щоб batch-набори plugin з важкими import не створювали додаткових CI jobs. Широка доріжка agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують import/планування, а не один окремий повільний тестовий файл. `runtime-config` запускається разом із шардом infra core-runtime, щоб спільний runtime-shard не залишався найдовшим. `check-additional` тримає разом compile/canary-роботи для package-boundary і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного job. Gateway watch, channel tests і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви checks як легкі jobs-верифікатори й водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його доріжка unit-test однаково компілює цей flavor із прапорцями SMS/call-log у BuildConfig, водночас уникаючи дубльованого job пакування debug APK на кожен Android-релевантний push.
`extension-fast` доступний лише для PR, оскільки push-запуски вже виконують повні shard-и bundled plugin. Це зберігає зворотний зв’язок щодо змінених plugin для рев’ю, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ concurrency CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, shard-и `check`, окрім lint, shard-и й агрегати `check-additional`, aggregate-верифікатори Node tests, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node tests, shard-и bundled plugin tests, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж економили; Docker-збірки install-smoke, де витрати часу в черзі для 32-vCPU були вищими за виграш                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks переходять на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks переходять на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # зібрати dist, коли важливі CI-доріжки artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші jobs
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
