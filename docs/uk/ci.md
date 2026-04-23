---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи областей дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T18:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8cca997a1606bafc08c904bf5527cf6aefb2a0428c2cb7668c757c7a1a08c4e1
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається на кожен push до `main` і на кожен pull request. Він використовує розумне визначення областей дії, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані ділянки.

QA Lab має окремі смуги CI поза основним робочим процесом із розумним визначенням областей дії. Робочий процес
`Parity gate` запускається для відповідних змін у PR і при ручному запуску; він
збирає приватний runtime QA і порівнює агентні набори mock GPT-5.4 та Opus 4.6.
Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і при
ручному запуску; він розгалужує mock parity gate, live Matrix lane і live
Telegram lane як паралельні завдання. Live-завдання використовують середовище
`qa-live-shared`, а Telegram lane використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі смуги QA Lab перед погодженням релізу.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для мейнтейнерів для очищення дублікатів після приземлення змін. Типово він працює в режимі dry-run і закриває лише явно вказані PR, коли `apply=true`. Перед змінами на GitHub він перевіряє, що приземлений PR уже злитий, і що кожен дублікат має або спільне згадане issue, або перетин змінених фрагментів.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені extensions і будує маніфест CI | Завжди для нечернеткових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                               | Завжди для нечернеткових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, що стосуються Node            |
| `checks-fast-core`               | Швидкі смуги коректності Linux, такі як перевірки bundled/plugin-contract/protocol           | Зміни, що стосуються Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, що стосуються Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled Plugin для всього набору extension                                | Зміни, що стосуються Node            |
| `checks-node-core-test`          | Шарди core Node тестів, без смуг каналів, bundled, контрактів і extensions                   | Зміни, що стосуються Node            |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request-и зі змінами в extensions |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, що стосуються Node            |
| `check-additional`               | Перевірки архітектури, меж, поверхні extensions, меж пакетів і шардів gateway-watch          | Зміни, що стосуються Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                          | Зміни, що стосуються Node            |
| `checks`                         | Верифікатор для built-artifact тестів каналів плюс сумісність Node 22 лише для push          | Зміни, що стосуються Node            |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Специфічні для Windows тестові смуги                                                         | Зміни, релевантні Windows            |
| `macos-node`                     | Смуга тестів TypeScript на macOS із використанням спільних built artifacts                   | Зміни, релевантні macOS              |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні macOS              |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні Android            |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` визначає, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань із артефактами та платформними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни CI workflow перевіряють Node CI graph плюс lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні смуги й надалі обмежені змінами у платформному коді.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, допоміжними засобами runner для npm/pnpm/UI, конфігурацією package manager і поверхнями CI workflow, які запускають цю смугу; не пов’язані зміни в source, Plugin, install-smoke і лише тестах залишаються на Linux Node smугам, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з install, packaging, container, production-змінами bundled extension і поверхнями core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише в тестах і лише в документації не резервують Docker workers. Його QR package smoke примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе ще перевіряє встановлення без повторного завантаження залежностей на кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах завдання, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте типову паралельність 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегат типово припиняє планувати нові pooled lanes після першої помилки, а кожна смуга має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний live/E2E workflow віддзеркалює шаблон спільного image, збираючи й публікуючи один Docker E2E image з тегом SHA у GHCR перед Docker matrix, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний Docker-набір для шляху релізу. Docker-тести QR та installer зберігають власні install-орієнтовані Dockerfiles. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled Plugin під тайм-аутом команди 120 секунд: відновлення залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна матриця bundled update/channel залишається ручною/для повного набору, оскільки виконує повторні реальні проходи `npm update` і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка CI-область дії платформ: production-зміни core запускають core prod typecheck плюс core tests, зміни лише в core tests запускають тільки core test typecheck/tests, production-зміни extension запускають extension prod typecheck плюс extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни у публічному Plugin SDK або plugin-contract розширюють валідацію на extensions, оскільки extensions залежать від цих core-контрактів. Зміни лише в метаданих релізу зі збільшенням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі смуги.

Для push матриця `checks` додає смугу `compat-node22`, що запускається лише для push. Для pull request ця смуга пропускається, і матриця залишається зосередженою на звичайних test/channel смугах.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання лишалося невеликим без надмірного резервування runner-ів: контракти каналів запускаються у трьох зважених шардах, тести bundled Plugin збалансовані між шістьма extension workers, невеликі core unit-смуги поєднані попарно, auto-reply запускається на трьох збалансованих workers замість шести дрібних workers, а конфігурації agentic gateway/plugin розподілені по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous тести Plugin використовують свої спеціальні конфігурації Vitest замість спільного універсального набору plugin. Завдання шардів extension запускають групи конфігурацій plugin послідовно з одним Vitest worker і більшим heap Node, щоб import-важкі пакети plugin не перевантажували малі CI runner-и. Широка agents lane використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують import/scheduling, а не один повільний тестовий файл. `runtime-config` запускається разом із шардом infra core-runtime, щоб спільний runtime shard не залишався останнім. `check-additional` тримає разом compile/canary роботу меж пакетів і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. У third-party flavor немає окремого source set або manifest; його смуга unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK на кожен Android-релевантний push.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні шарди bundled Plugin. Це зберігає зворотний зв’язок для змінених plugins під час review, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був замінений новішим.

Ключ конкурентності CI має версіонування (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщену на GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тому 8 vCPU коштували дорожче, ніж зекономили; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU перевищувала виграш                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за граничною смугою
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
```
