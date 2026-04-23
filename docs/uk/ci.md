---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, перевірки за областю змін і локальні еквіваленти команд
title: CI pipeline
x-i18n:
    generated_at: "2026-04-23T20:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f06d3bec8a44402afb3aeec252105d3e3c985307deb3fcc0859c2d1df50f2612
    source_path: ci.md
    workflow: 15
---

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

QA Lab має окремі lane-и CI поза основним smart-scoped workflow. Workflow
`Parity gate` запускається для відповідних змін у PR і через manual dispatch; він
збирає приватне runtime QA і порівнює agentic pack-и mock GPT-5.4 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
manual dispatch; він розпаралелює mock parity gate, live lane Matrix і live
lane Telegram як паралельні завдання. Live-завдання використовують environment
`qa-live-shared`, а lane Telegram використовує lease-и Convex. `OpenClaw Release
Checks` також запускає ті самі lane-и QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow супровідника для
очищення дублікатів після приземлення змін. За замовчуванням він працює в режимі dry-run і
закриває лише явно вказані PR, коли `apply=true`. Перш ніж змінювати GitHub,
він перевіряє, що приземлений PR уже merged, і що кожен дублікат має або спільну
issue, на яку є посилання, або перекривані змінені hunks.

Workflow `Test Performance Agent` — це event-driven lane супроводу Codex
для повільних тестів. Він не має суто планового запуску: його може запустити
успішний небоговий запуск push CI на `main`, але він пропускається, якщо того UTC-дня
інше workflow-run викликання вже виконалося або ще виконується.
Manual dispatch обходить це денне обмеження активності. Цей lane будує grouped report
продуктивності Vitest для повного набору тестів, дозволяє Codex вносити лише
невеликі виправлення продуктивності тестів без втрати покриття, потім повторно запускає
повний report і відхиляє зміни, які зменшують базову кількість тестів, що проходять.
Якщо в базовому стані є тести, що не проходять, Codex може виправляти лише очевидні
помилки, а підсумковий повний report після агента має пройти повністю, перш ніж
щось буде закомічено. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла
зберігати ту саму безпечну політику drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені extensions і будує CI manifest           | Завжди для non-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для non-draft push і PR       |
| `security-fast`                  | Обов’язковий aggregate для швидких завдань безпеки                                           | Завжди для non-draft push і PR       |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні Node               |
| `checks-fast-core`               | Швидкі lane-и коректності Linux, як-от bundled/plugin-contract/protocol перевірки            | Зміни, релевантні Node               |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним aggregate результатом перевірки           | Зміни, релевантні Node               |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extension                             | Зміни, релевантні Node               |
| `checks-node-core-test`          | Шарди core Node tests, за винятком lane-ів channel, bundled, contract і extension            | Зміни, релевантні Node               |
| `extension-fast`                 | Фокусні тести лише для змінених bundled plugin                                               | Pull request-и зі змінами в extension |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні Node               |
| `check-additional`               | Architecture, boundary, guards поверхні extension, package-boundary і шарди gateway-watch    | Зміни, релевантні Node               |
| `build-smoke`                    | Smoke-тести built-CLI і smoke перевірка пам’яті під час запуску                              | Зміни, релевантні Node               |
| `checks`                         | Верифікатор для channel tests built-artifact плюс compat з Node 22 лише для push             | Зміни, релевантні Node               |
| `check-docs`                     | Форматування docs, lint і перевірки битих посилань                                           | Змінено docs                         |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Специфічні для Windows test lane-и                                                           | Зміни, релевантні Windows            |
| `macos-node`                     | Lane тестів TypeScript на macOS з використанням спільних built artifacts                     | Зміни, релевантні macOS              |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | Зміни, релевантні macOS              |
| `android`                        | Android unit tests для обох flavor-ів плюс одна debug APK build                              | Зміни, релевантні Android            |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх main CI або manual dispatch    |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які lane-и взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих matrix-завдань для artifacts і platform.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane-ами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі lane-и platform і runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують запускати native build-и Windows, Android або macOS; ці platform lane-и залишаються прив’язаними до змін у платформному коді.
Перевірки Windows Node обмежені специфічними для Windows wrapper-ами process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цей lane; непов’язані зміни вихідного коду, plugin, install-smoke і test-only зміни залишаються в Linux Node lane-ах, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shard-ами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` з вужчого сигналу changed-smoke, тож Docker/install smoke запускається для змін, пов’язаних із встановленням, пакуванням, контейнерами, production-змін bundled extension, а також для основних поверхонь plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише в tests і docs не резервують Docker workers. Його QR package smoke примушує шар Docker `pnpm install` перезапускатися, зберігаючи кеш BuildKit pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей у кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах того самого завдання, тож додає реальне покриття WebSocket між контейнерами без ще однієї Docker build. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, а потім паралельно запускає live/E2E smoke lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1`; стандартний рівень паралелізму 4 можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний aggregate за замовчуванням припиняє планувати нові pooled lane-и після першого збою, а кожен lane має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane-и, чутливі до запуску або provider-а, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E віддзеркалює шаблон shared-image: він збирає та пушить один GHCR Docker E2E image з тегом SHA перед Docker matrix, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Плановий workflow live/E2E щодня запускає повний набір Docker suite для шляху релізу. Docker-тести QR та installer зберігають власні Dockerfile, сфокусовані на встановленні. Окреме завдання `docker-e2e-fast` запускає обмежений Docker profile bundled-plugin під тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляцію synthetic bundled-loader failure. Повна matrix для bundled update/channel залишається ручною/повного набору, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо architecture boundary, ніж широка CI-область платформ: production-зміни core запускають typecheck core prod плюс core tests, зміни лише в core tests запускають лише typecheck/tests для core test, production-зміни extension запускають typecheck extension prod плюс extension tests, а зміни лише в extension tests запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extension залежать від цих core contract. Version bump-и лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх lane-ів.

Для push matrix `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, і matrix зосереджується на звичайних test/channel lane-ах.

Найповільніші сімейства Node tests поділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contract-и запускаються у трьох зважених shard-ах, bundled plugin tests балансуються між шістьма worker-ами extension, невеликі core unit lane-и об’єднуються в пари, auto-reply запускається у трьох збалансованих worker-ах замість шести крихітних worker-ів, а agentic gateway/plugin config-и розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та різні plugin tests використовують свої окремі конфігурації Vitest замість спільного універсального plugin catch-all. Завдання shard-ів extension запускають групи конфігурацій plugin послідовно з одним worker-ом Vitest і більшим heap Node, щоб import-heavy пакети plugin-ів не перевантажували малі CI runner-и. Широкий lane agents використовує спільний file-parallel scheduler Vitest, оскільки в ньому домінують import/scheduling, а не один повільний test file. `runtime-config` запускається разом із shard-ом infra core-runtime, щоб спільний runtime shard не залишався найдовшим. `check-additional` тримає compile/canary-роботи package-boundary разом і відокремлює архітектуру topology runtime від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard-и паралельно всередині одного завдання. Gateway watch, channel tests і shard support-boundary core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі імена перевірок як легкі завдання-верифікатори й водночас уникаючи двох додаткових worker-ів Blacksmith і другої черги споживачів artifact-ів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane unit-test усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK при кожному Android-релевантному push.
`extension-fast` виконується лише для PR, оскільки push-запуски вже виконують повні shard-и bundled plugin. Це зберігає зворотний зв’язок для reviews щодо змінених plugin-ів, не резервуючи додатковий worker Blacksmith на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже був замінений.
Ключ concurrency CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запускі `main`.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та aggregate-и (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, shard-и `check`, крім lint, shard-и й aggregate-и `check-additional`, aggregate-верифікатори Node tests, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб matrix Blacksmith могла раніше ставати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node tests, shard-и bundled plugin tests, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоду; Docker build-и install-smoke, де час очікування в черзі на 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate з вимірюванням часу по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # формат docs + lint + биті посилання
pnpm build          # зібрати dist, коли важливі lane-и CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запускі main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
