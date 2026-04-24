---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, ворота охоплення та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-24T01:35:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e4e679ce5f1d0406f34255ac2de55011210fdb60fe42eb355b5351685c56a
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінено лише не пов’язані області.

QA Lab має виділені гілки CI поза основним робочим процесом із розумним визначенням охоплення. Робочий процес
`Parity gate` запускається для відповідних змін у PR та через manual dispatch; він
збирає приватне середовище виконання QA і порівнює агентні пакети mock GPT-5.4 та Opus 4.6.
Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через
manual dispatch; він розгалужує mock parity gate, live Matrix lane і live
Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а lane Telegram використовує Convex leases. `OpenClaw Release
Checks` також запускає ті самі гілки QA Lab перед погодженням релізу.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для мейнтейнерів для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що злитий PR дійсно merged і що кожен дублікат має або спільний referenced issue,
або перетин змінених hunks.

Робочий процес `Docs Agent` — це керована подіями гілка технічного обслуговування Codex для підтримання
наявної документації у відповідності до нещодавно злитих змін. У нього немає окремого розкладу: його може запустити
успішний CI-run небота після push на `main`, а manual dispatch може
запустити його напряму. Запуски через workflow-run пропускаються, якщо `main` уже пішов далі або якщо
інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він
перевіряє діапазон комітів від source SHA попереднього непропущеного Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені з
моменту останнього проходу документації.

Робочий процес `Test Performance Agent` — це керована подіями гілка технічного обслуговування Codex
для повільних тестів. У нього немає окремого розкладу: його може запустити
успішний CI-run небота після push на `main`, але він пропускається, якщо інший запуск через workflow-run
уже виконався або виконується в цю дату UTC. Manual dispatch обходить цю щоденну
перевірку активності. Гілка будує звіт про продуктивність Vitest для повного набору тестів, згрупований за категоріями,
дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає звіт для повного набору і відхиляє зміни, що зменшують
базову кількість тестів, які проходять. Якщо в базовому стані є тести, що падають,
Codex може виправляти лише очевидні збої, а після-агентний звіт для повного набору
має пройти перед будь-яким комітом. Коли `main` змінюється до того, як bot push потрапить у репозиторій,
гілка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія
Codex могла зберігати ту саму безпечну політику drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в docs, змінені області, змінені extensions і будує маніфест CI         | Завжди для non-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для non-draft push і PR       |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для non-draft push і PR       |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні Node         |
| `checks-fast-core`               | Швидкі Linux-гілки коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, релевантні Node               |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, релевантні Node               |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extension                             | Зміни, релевантні Node               |
| `checks-node-core-test`          | Шардовані core Node тести, без channel, bundled, contract і extension-гілок                  | Зміни, релевантні Node               |
| `extension-fast`                 | Цілеспрямовані тести лише для змінених bundled plugins                                       | Pull request зі змінами extension    |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node      |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні Node               |
| `build-smoke`                    | Built-CLI smoke-тести та smoke-тест пам’яті під час запуску                                  | Зміни, релевантні Node               |
| `checks`                         | Перевірник для built-artifact channel тестів плюс сумісність Node 22 лише для push           | Зміни, релевантні Node               |
| `check-docs`                     | Форматування docs, lint і перевірки зламаних посилань                                        | Docs змінено                         |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Специфічні для Windows тестові гілки                                                         | Зміни, релевантні Windows            |
| `macos-node`                     | Гілка тестів TypeScript на macOS з використанням спільних built artifacts                    | Зміни, релевантні macOS              |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні macOS              |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                               | Зміни, релевантні Android            |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний CI на main або manual dispatch |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які гілки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-гілками, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-гілки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` лише для PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни робочих процесів CI перевіряють граф Node CI разом із lint робочих процесів, але самі по собі не змушують запускати нативні збірки Windows, Android або macOS; ці платформні гілки й далі визначаються лише змінами у вихідному коді відповідних платформ.
Перевірки Windows Node прив’язані до специфічних для Windows обгорток process/path, npm/pnpm/UI runner helpers, конфігурації package manager і поверхонь CI workflow, які запускають цю гілку; не пов’язані зміни вихідного коду, Plugin, install-smoke і зміни лише в тестах залишаються на Linux Node-гілках, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення охоплення через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled Plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled Plugin, зміни лише в тестах і зміни лише в docs не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає e2e container gateway-network, перевіряє build arg для bundled extension і запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд. Повний шлях зберігає покриття встановлення QR package і installer Docker/update для нічних запланованих запусків, manual dispatch, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не змушують запускати повний шлях; коли логіка changed-scope вимагала б повного покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки. Повільний smoke-тест глобального встановлення Bun image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а manual dispatch `install-smoke` може явно його ввімкнути, але pull request і push у `main` його не запускають. QR і installer Docker тести зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний образ live-test і один спільний образ built-app із `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke-гілки паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; стандартний паралелізм 4 можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор за замовчуванням припиняє планувати нові pooled-гілки після першого збою, а кожна гілка має тайм-аут 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Гілки, чутливі до запуску або provider, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний live/E2E workflow віддзеркалює шаблон зі спільним образом: він збирає й публікує один SHA-tagged GHCR Docker E2E image перед Docker-матрицею, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Повна матриця bundled update/channel залишається manual/full-suite, оскільки вона виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіше ставиться до архітектурних меж, ніж широке платформне охоплення CI: зміни core production запускають core prod typecheck плюс core тести, зміни лише в core tests запускають лише core test typecheck/tests, зміни extension production запускають extension prod typecheck плюс extension тести, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, бо extension залежать від цих core contracts. Зміни лише в release metadata version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірку на всі гілки.

Для push матриця `checks` додає lane `compat-node22`, що запускається лише для push. Для pull request цей lane пропускається, і матриця залишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування раннерів: channel contracts запускаються як три зважені шарди, тести bundled Plugin збалансовані між шістьма workers для extension, невеликі core unit lanes об’єднані попарно, auto-reply виконується як три збалансовані workers замість шести крихітних workers, а agentic-конфігурації gateway/Plugin розподілені по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser-, QA-, media- та різні тести Plugin використовують свої виділені конфігурації Vitest замість спільного універсального набору для Plugin. Завдання shard для extension запускають групи конфігурацій Plugin послідовно з одним worker Vitest і більшим heap Node, щоб batch-набори Plugin з інтенсивними import не перевантажували невеликі CI runners. Широка agents lane використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують import/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime shard не залишався єдиним довгим хвостом. `check-additional` тримає разом роботу package-boundary compile/canary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel тести та core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі імена перевірок як легкі завдання-перевірники та уникаючи двох додаткових workers Blacksmith і другої черги споживачів artifacts.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. У flavor third-party немає окремого source set чи manifest; його lane unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK для кожного push, релевантного Android.
`extension-fast` доступний лише для PR, оскільки push-запуски вже виконують повні shard-набори bundled Plugin. Це зберігає швидкий зворотний зв’язок для змінених plugins під час review без резервування додаткового worker Blacksmith на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref теж не падає. Агреговані перевірки shard використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було замінено новішим.
Ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані перевірники Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше стати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled Plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, так що 8 vCPU коштували дорожче, ніж зекономили; Docker-збірки install-smoke, де час очікування в черзі для 32-vCPU коштував дорожче, ніж давав користь                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

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
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі CI-гілки artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
