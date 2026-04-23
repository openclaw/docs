---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмежувальні перевірки за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T19:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e250c90d9be13dc25a0b028de5d72cf821387e33c0965cac7b935579e3c6ae7
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push у `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані частини.

QA Lab має окремі смуги CI поза основним workflow з розумним обмеженням за областю змін. Workflow
`Parity gate` запускається для відповідних змін у PR і через ручний запуск; він
збирає приватне QA runtime і порівнює agentic-набори mock GPT-5.4 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний запуск; він розгалужує mock parity gate, live Matrix lane і live
Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а Telegram lane використовує Convex leases. `OpenClaw Release
Checks` також запускає ті самі смуги QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний maintainer-workflow для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і
закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub,
він перевіряє, що злитий PR справді змерджено і що кожен дублікат має або
спільну згадану issue, або перетин змінених фрагментів.

Workflow `Test Performance Agent` — це подієва службова смуга Codex
для повільних тестів. Вона не має окремого запуску лише за розкладом:
її може запустити успішний не-ботовий push CI у `main`, але вона пропускається,
якщо інший запуск workflow-run уже відбувся або виконується в той самий UTC-день.
Ручний запуск обходить це денне обмеження активності. Ця смуга будує
групований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex
вносити лише невеликі виправлення продуктивності тестів без втрати покриття, а потім
повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують
кількість базових тестів, що проходять. Якщо в базовому стані є тести, що падають,
Codex може виправляти лише очевидні збої, а звіт для повного набору після роботи агента
має пройти повністю, перш ніж щось буде закомічено.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в docs, змінені області, змінені extensions і будує маніфест CI         | Завжди для не-чернеткових push і PR  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для не-чернеткових push і PR  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для не-чернеткових push і PR  |
| `security-fast`                  | Обов’язковий агрегатор для швидких security-завдань                                          | Завжди для не-чернеткових push і PR  |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки build-артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, такі як bundled/plugin-contract/protocol перевірки           | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди core Node-тестів, окрім channel, bundled, contract та extension-смуг                   | Зміни, релевантні для Node           |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Pull request із змінами в extension  |
| `check`                          | Шардований еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Шарди для перевірок архітектури, меж, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті на старті                                | Зміни, релевантні для Node           |
| `checks`                         | Засіб перевірки для channel-тестів build-артефактів плюс сумісність Node 22 лише для push    | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування docs, lint і перевірки битих посилань                                           | Змінено docs                         |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Тестові смуги, специфічні для Windows                                                        | Зміни, релевантні для Windows        |
| `macos-node`                     | Смуга TypeScript-тестів на macOS із використанням спільних build-артефактів                 | Зміни, релевантні для macOS          |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK-збірка                                | Зміни, релевантні для Android        |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх main CI або ручний запуск      |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни в workflow CI перевіряють граф Node CI та lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені смуги й далі обмежуються змінами у вихідному коді відповідних платформ.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, допоміжними засобами для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю смугу; не пов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються на Linux Node-смугах, щоб не займати Windows worker із 16 vCPU для покриття, яке вже забезпечується звичайними шардами тестів.
Окремий workflow `install-smoke` повторно використовує той самий script області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з install, packaging, container, production-змін bundled extension і core-поверхонь plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише в тестах і лише в docs не займають Docker workers. Його QR package smoke примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому інсталяція все одно перевіряється без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах завдання, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локальна команда `test:docker:all` попередньо збирає один спільний live-test image і один спільний образ зібраного застосунку `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke-смуги паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; стандартну паралельність 4 можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор за замовчуванням припиняє планувати нові pooled-смуги після першого збою, а кожна смуга має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до старту або провайдера, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний live/E2E workflow відтворює шаблон спільного image, збираючи й публікуючи один GHCR Docker E2E image з тегом SHA перед Docker-матрицею, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний Docker-набір для release-path. Тести QR і installer Docker зберігають власні Dockerfile, зосереджені на інсталяції. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд: repair залежностей setup-entry і синтетичну ізоляцію збоїв bundled-loader. Повна матриця bundled update/channel лишається manual/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Логіка локальних changed-lanes міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широке платформене обмеження в CI: production-зміни core запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, production-зміни extension запускають typecheck extension prod плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extension залежать від цих core-контрактів. Зміни лише в release metadata version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі смуги.

Для push матриця `checks` додає смугу `compat-node22`, яка виконується лише для push. Для pull request ця смуга пропускається, і матриця залишається зосередженою на звичайних тестових/channel-смугах.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання лишалося невеликим без надмірного резервування runner-ів: channel contracts виконуються як три зважені шарди, тести bundled plugin збалансовані між шістьма extension worker-ами, малі core unit-смуги об’єднані попарно, auto-reply виконується як три збалансовані worker-и замість шести дрібних worker-ів, а конфігурації agentic gateway/plugin розподілені по наявних source-only agentic Node-завданнях замість очікування build-артефактів. Широкі browser-, QA-, media- і miscellaneous plugin-тести використовують власні конфігурації Vitest замість спільного універсального plugin catch-all. Завдання extension shard виконують групи конфігурацій plugin послідовно з одним Vitest worker і більшим Node heap, щоб import-важкі пакети plugin не перевантажували малі CI runner-и. Широка smуга agents використовує спільний файл-паралельний планувальник Vitest, оскільки в ній домінують imports/планування, а не один окремий повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime-shard не залишався найдовшим. `check-additional` тримає разом package-boundary compile/canary-роботи й відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard виконує свої малі незалежні guards паралельно в межах одного завдання. Gateway watch, channel-тести й shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи старі назви перевірок як легкі завдання-верифікатори й водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його смуга unit-тестів усе одно компілює цей flavor із прапорцями SMS/call-log у BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK при кожному push, релевантному для Android.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок для reviews щодо змінених plugin без резервування додаткового Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони й далі повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ конкурентності CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled-перевірки, шардовані перевірки channel contract, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # збірка dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
