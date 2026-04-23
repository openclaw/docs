---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T13:33:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 730bba64e0867f41b47e4896f8255b6d23e6530bb91d349abb25b35a43152e9e
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі доріжки CI поза основним workflow з розумним визначенням меж. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному запуску; він
збирає приватне середовище виконання QA і порівнює агентні набори mock GPT-5.4 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі для `main` і при
ручному запуску; він розгалужує mock parity gate, live Matrix lane і live
Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а Telegram lane використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі доріжки QA Lab перед погодженням релізу.

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                    |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                       | Виявляє зміни лише в документації, змінені межі, змінені extensions і будує маніфест CI     | Завжди для недрафтових push і PR     |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR     |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для недрафтових push і PR     |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR     |
| `build-artifacts`                 | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні до Node            |
| `checks-fast-core`                | Швидкі Linux-доріжки коректності, такі як перевірки bundled/plugin-contract/protocol         | Зміни, релевантні до Node            |
| `checks-fast-contracts-channels`  | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, релевантні до Node            |
| `checks-node-extensions`          | Повні шардовані тести bundled-plugin для всього набору extension                             | Зміни, релевантні до Node            |
| `checks-node-core-test`           | Шарди core Node test, за винятком channel, bundled, contract і extension доріжок             | Зміни, релевантні до Node            |
| `extension-fast`                  | Сфокусовані тести лише для змінених bundled plugins                                          | Pull request зі змінами в extension  |
| `check`                           | Шардований еквівалент основної локальної перевірки: production типи, lint, guard, test types і strict smoke | Зміни, релевантні до Node            |
| `check-additional`                | Шарди архітектури, меж, guard для extension-surface, package-boundary і gateway-watch        | Зміни, релевантні до Node            |
| `build-smoke`                     | Smoke-тести built-CLI і smoke перевірка пам’яті під час запуску                              | Зміни, релевантні до Node            |
| `checks`                          | Верифікатор для channel test built-artifact плюс сумісність Node 22 лише для push            | Зміни, релевантні до Node            |
| `check-docs`                      | Форматування документації, lint і перевірки на биті посилання                                | Змінено документацію                 |
| `skills-python`                   | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні до Python Skills   |
| `checks-windows`                  | Windows-специфічні тестові доріжки                                                           | Зміни, релевантні до Windows         |
| `macos-node`                      | Доріжка TypeScript test для macOS з використанням спільних built artifacts                   | Зміни, релевантні до macOS           |
| `macos-swift`                     | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні до macOS           |
| `android`                         | Android unit tests для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні до Android         |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються з помилкою швидко, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` лише для PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряє граф Node CI разом із lint для workflow, але саме по собі не примушує виконувати нативні збірки Windows, Android або macOS; ці платформні доріжки й далі залежать від змін у платформному коді.
Перевірки Windows Node обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями workflow CI, які запускають цю доріжку; не пов’язані зміни в коді, plugin, install-smoke і зміни лише в тестах залишаються на Linux Node доріжках, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт меж через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, релевантних до install, packaging, container, production changes у bundled extension і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише в тестах і документації не резервують Docker workers. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе ще перевіряє встановлення без повторного завантаження залежностей у кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локально `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім паралельно запускає доріжки live/E2E smoke з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартний паралелізм 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Доріжки, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E наслідує шаблон спільного image, збираючи й публікуючи один Docker E2E image у GHCR з тегом SHA перед Docker matrix, а потім запускаючи матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений bundled-plugin Docker profile з тайм-аутом команди 120 секунд: відновлення залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна bundled update/channel matrix залишається ручною/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широка платформна межа CI: зміни core production запускають core prod typecheck плюс core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни extension production запускають extension prod typecheck плюс extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extension, тому що extension залежать від цих core contract. Version bumps лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх доріжок.

Для push матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request ця доріжка пропускається, і матриця залишається зосередженою на звичайних test/channel доріжках.

Найповільніші сімейства Node test розділені або збалансовані так, щоб кожне завдання залишалося невеликим: channel contracts розділяють покриття registry і core на шість зважених shard загалом, bundled plugin tests балансуються між шістьма extension workers, auto-reply працює як три збалансовані workers замість шести маленьких workers, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої окремі конфігурації Vitest, а не спільний plugin catch-all. Широка доріжка agents використовує спільний file-parallel scheduler Vitest, оскільки для неї домінують імпорти/планування, а не один повільний test file. `runtime-config` запускається разом із shard infra core-runtime, щоб спільний runtime shard не утримував хвіст. `check-additional` тримає compile/canary-роботи package-boundary разом і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard паралельно в межах одного завдання. Gateway watch, channel tests і shard core support-boundary запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори й уникаючи двох додаткових Blacksmith workers та другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. У flavor third-party немає окремого source set або manifest; його доріжка unit-test усе одно компілює цей flavor із прапорцями SMS/call-log BuildConfig, уникаючи при цьому дубльованого завдання пакування debug APK для кожного Android-релевантного push.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні шарди bundled plugin. Це дає швидкий зворотний зв’язок для changed-plugin під час review, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref теж не завершується з помилкою. Агреговані shard checks використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні помилки shard, але не ставали в чергу після того, як увесь workflow уже було витіснено.
Ключ конкурентності CI версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій групі черги не міг безкінечно блокувати новіші запуски main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node test, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node test, шарди bundled plugin test, `android`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тому 8 vCPU коштували дорожче, ніж давали вигоду; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU перевищувала отриману користь                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guard
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
