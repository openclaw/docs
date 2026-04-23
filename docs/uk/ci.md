---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, перевірки за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T14:40:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9ab8559ab9ac781ae87f94374840a21a0c588e7cd289c6bb8a8cd07e8df6083
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінювалися лише не пов’язані між собою частини.

QA Lab має окремі смуги CI поза основним робочим процесом із розумним визначенням області змін. Робочий процес `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.4 і Opus 4.6. Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а смуга Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі смуги QA Lab перед погодженням релізу.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і формує CI-маніфест | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin у всьому наборі extension                               | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, без смуг каналів, bundled, контрактів і extension                | Зміни, релевантні для Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request зі змінами в extension |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Архітектурні перевірки, перевірки меж, surface guards для extension, package-boundary і шарди gateway-watch | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                              | Зміни, релевантні для Node          |
| `checks`                         | Верифікатор для тестів каналів на зібраних артефактах плюс лише для push — сумісність із Node 22 | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки на зламані посилання                             | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові смуги                                                         | Зміни, релевантні для Windows       |
| `macos-node`                     | Смуга TypeScript-тестів на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS         |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android       |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж почнуть працювати дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи на важчі завдання з артефактами та платформними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR — `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не змушують виконувати нативні збірки для Windows, Android або macOS; ці платформні смуги й далі визначаються лише змінами у платформному коді.
Перевірки Windows Node обмежені Windows-специфічними обгортками для process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю смугу; не пов’язані зміни вихідного коду, plugin, install-smoke і зміни лише в тестах залишаються в Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже проходить у звичайних тестових шардах.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з інсталяцією, пакуванням, контейнерами, production-змінами bundled extension і поверхнями core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише в тестах і лише в документації не резервують Docker workers. Його QR package smoke примусово повторно запускає шар Docker `pnpm install`, зберігаючи кеш BuildKit pnpm store, тож він і далі перевіряє встановлення без повторного завантаження залежностей на кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тож додає реальне WebSocket-покриття container-to-container без додавання ще однієї Docker-збірки. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний image зібраного застосунку `scripts/e2e/Dockerfile`, а потім паралельно запускає live/E2E smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартний рівень паралелізму 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегат за замовчуванням припиняє планувати нові pooled lanes після першого збою, а кожна смуга має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний live/E2E workflow віддзеркалює шаблон shared-image: він збирає й публікує один SHA-tagged GHCR Docker E2E image перед Docker matrix, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. QR і installer Docker-тести зберігають власні Dockerfile, зосереджені на інсталяції. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна bundled update/channel matrix залишається ручною/для повного набору, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широка CI-область платформ: production-зміни в core запускають core prod typecheck плюс core-тести, зміни лише в core-тестах запускають лише core test typecheck/tests, production-зміни в extension запускають extension prod typecheck плюс extension-тести, а зміни лише в extension-тестах запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, тому що extension залежать від цих core-контрактів. Зміни лише в release metadata під час version bump запускають цільові перевірки версії, конфігурації та root-залежностей. Невідомі зміни в root/config безпечно розширюються до всіх смуг.

Для push матриця `checks` додає смугу `compat-node22`, яка виконується лише для push. Для pull request ця смуга пропускається, і матриця зосереджується на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим і не резервувало зайві ранери: channel contracts запускаються як три зважені шарди, bundled plugin tests балансуються між шістьма workers для extension, невеликі core unit lanes об’єднуються в пари, auto-reply працює на трьох збалансованих workers замість шести дрібних, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування зібраних артефактів. Широкі browser, QA, media і miscellaneous plugin tests використовують свої окремі конфігурації Vitest замість спільного plugin catch-all. Широка agents lane використовує спільний планувальник file-parallel Vitest, оскільки в ній домінують імпорт і планування, а не один повільний тестовий файл. `runtime-config` запускається разом із шардом infra core-runtime, щоб спільний runtime shard не утримував найдовший хвіст. `check-additional` тримає разом роботу package-boundary compile/canary і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легковагі завдання-верифікатори та водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе одно компілює цей flavor з прапорцями SMS/call-log BuildConfig, водночас уникаючи дубльованого пакування debug APK для кожного Android-релевантного push.
`extension-fast` виконується лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це дає швидкий зворотний зв’язок щодо змінених plugins під час review без резервування додаткового Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані шардові перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шард, але не стають у чергу після того, як увесь workflow уже був замінений новішим запуском.
Ключ конкурентності CI версіонований (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати нові запуски на main.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди bundled plugin tests, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який досі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоди; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # зібрати dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі й найповільніші завдання
```
