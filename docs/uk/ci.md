---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи областей дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T20:05:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 601bd170afc217e7e9841c3cc358b941c9706b2cec57f568c0b583888ac0b4e7
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного пушу до `main` і кожного pull request. Він використовує розумне обмеження за областю дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі доріжки CI поза основним workflow з розумним обмеженням за областю дії. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному запуску; він
збирає приватне середовище виконання QA та порівнює агентні набори mock GPT-5.4 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при
ручному запуску; він розгалужує mock parity gate, живу доріжку Matrix і живу
доріжку Telegram як паралельні завдання. Живі завдання використовують середовище `qa-live-shared`,
а доріжка Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі доріжки QA Lab перед погодженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для очищення дублікатів після приземлення змін. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами на GitHub він перевіряє, що
приземлений PR змерджено, і що кожен дублікат має або спільне пов’язане issue,
або перетин змінених фрагментів.

Workflow `Test Performance Agent` — це керована подіями службова доріжка Codex
для повільних тестів. Вона не має окремого розкладу: її може запустити
успішний запуск CI після пушу не від бота на `main`, але вона пропускається, якщо того UTC-дня вже був або виконується інший запуск цього workflow.
Ручний запуск оминає це денне обмеження активності. Доріжка будує згрупований звіт про продуктивність Vitest для повного набору тестів, дозволяє Codex
вносити лише невеликі зміни продуктивності тестів без втрати покриття, потім повторно запускає звіт для повного набору
і відхиляє зміни, які зменшують базову кількість тестів, що проходять.
Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт для повного набору після роботи агента має проходити, перш ніж щось буде закомічено.
Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпекову модель drop-sudo,
що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в документації, змінених областей дії, змінених розширень і побудова маніфесту CI | Завжди для нечернеткових пушів і PR  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових пушів і PR  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                               | Завжди для нечернеткових пушів і PR  |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для нечернеткових пушів і PR  |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, пов’язані з Node              |
| `checks-fast-core`               | Швидкі доріжки коректності на Linux, як-от перевірки bundled/plugin-contract/protocol        | Зміни, пов’язані з Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, пов’язані з Node              |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, пов’язані з Node              |
| `checks-node-core-test`          | Шарди основних Node-тестів, без доріжок channel, bundled, contract і extension               | Зміни, пов’язані з Node              |
| `extension-fast`                 | Прицільні тести лише для змінених bundled plugins                                            | Pull request зі змінами в розширеннях |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node              |
| `check-additional`               | Шарди перевірок архітектури, меж, поверхні розширень, меж пакетів і gateway-watch            | Зміни, пов’язані з Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                         | Зміни, пов’язані з Node              |
| `checks`                         | Верифікатор для channel-тестів зібраних артефактів плюс сумісність з Node 22 лише для пушів | Зміни, пов’язані з Node              |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено                 |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Специфічні для Windows тестові доріжки                                                       | Зміни, релевантні Windows            |
| `macos-node`                     | Доріжка тестів TypeScript на macOS із використанням спільних зібраних артефактів             | Зміни, релевантні macOS              |
| `macos-swift`                    | Swift lint, збірка та тести для застосунку macOS                                             | Зміни, релевантні macOS              |
| `android`                        | Android unit-тести для обох варіантів плюс одна debug APK-збірка                             | Зміни, релевантні Android            |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний main CI або ручний запуск   |

## Порядок швидкого завершення з помилкою

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж стартують дорогі:

1. `preflight` визначає, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені доріжки та доріжки середовища виконання: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені доріжки залишаються обмеженими змінами у вихідному коді платформи.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які виконують цю доріжку; не пов’язані зміни вихідного коду, plugins, install-smoke та лише тестів залишаються на Linux Node-доріжках, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` з вужчого сигналу changed-smoke, тож Docker/install smoke запускається для змін, пов’язаних із встановленням, пакуванням, контейнерами, production-змін bundled extension і поверхнями core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише тестів і лише документації не резервують Docker workers. Його QR package smoke примушує Docker-шар `pnpm install` запускатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе ще перевіряє встановлення без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує образ runtime, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локальна команда `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, потім запускає доріжки live/E2E smoke паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте типове значення паралелізму 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор за замовчуванням припиняє планувати нові pooled-доріжки після першої помилки, а кожна доріжка має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Доріжки, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E відтворює шаблон спільного образу, збираючи й публікуючи один SHA-тегований образ Docker E2E у GHCR перед матрицею Docker, а потім запускаючи матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір для шляху релізу. Docker-тести QR та installer зберігають власні Dockerfile, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із тайм-аутом команди 120 секунд: відновлення залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна матриця bundled update/channel залишається ручною/для повного набору, оскільки вона виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широке платформене обмеження CI: зміни core production запускають перевірку типів core prod плюс core-тести, зміни лише core-тестів запускають лише перевірку типів/тести core test, зміни extension production запускають перевірку типів extension prod плюс extension-тести, а зміни лише extension-тестів запускають лише перевірку типів/тести extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію до extension, оскільки розширення залежать від цих core-контрактів. Оновлення версій лише в метаданих релізу запускають прицільні перевірки version/config/root-dependency. Невідомі зміни root/config у безпечному режимі призводять до запуску всіх доріжок.

Під час пушів матриця `checks` додає доріжку `compat-node22`, що запускається лише для пушів. Для pull request ця доріжка пропускається, і матриця залишається зосередженою на звичайних доріжках тестів/каналів.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування раннерів: channel contracts виконуються у трьох зважених шардах, тести bundled plugin збалансовані між шістьма workers розширень, невеликі core unit-доріжки спарені, auto-reply виконується у трьох збалансованих workers замість шести дрібних workers, а agentic gateway/plugin configs розподілені між наявними Node-завданнями agentic лише з вихідним кодом замість очікування зібраних артефактів. Широкі browser-, QA-, media- та різні plugin-тести використовують власні конфігурації Vitest замість спільного універсального plugin-набору. Завдання шардів розширень запускають групи конфігурацій plugin послідовно з одним Vitest worker і більшим heap Node, щоб важкі за імпортами пакети plugin не перевантажували малі CI-раннери. Широка доріжка agents використовує спільний файлово-паралельний планувальник Vitest, тому що в ній домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime-шард не тримав хвіст. `check-additional` тримає разом роботу compile/canary для package-boundary і відокремлює архітектуру топології runtime від покриття gateway watch; шард boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, channel-тести та core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори, але без двох додаткових Blacksmith workers і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Варіант third-party не має окремого набору вихідного коду чи маніфесту; його доріжка unit-тестів усе одно компілює цей варіант із прапорцями SMS/call-log у BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK при кожному Android-релевантному пуші.
`extension-fast` працює лише для PR, оскільки запуски для push уже виконують повні шарди bundled plugin. Це зберігає зворотний зв’язок щодо змінених plugins для рев’ю без резервування додаткового Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший пуш потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ конкурентності CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Раннери

| Раннер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається настільки чутливим до CPU, що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу очікування в черзі на 32 vCPU перевищувала виграш                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: змінені typecheck/lint/тести за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти недавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
