---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі перевірок та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T05:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 345fd6200405e8b3f4ba9baadbbd491aa506f889c38631685aa5a8392e082109
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного пушу в `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише нерелевантні частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявляє зміни лише в документації, змінені межі, змінені extensions і збирає маніфест CI    | Завжди для нечернеткових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                | Завжди для нечернеткових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, такі як перевірки bundled/plugin-contract/protocol           | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Розшардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки    | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extensions                               | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди основних Node-тестів, за винятком ланок каналів, bundled, contracts і extensions       | Зміни, релевантні для Node           |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request зі змінами extensions   |
| `check`                          | Розшардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Шарди архітектурних, boundary, extension-surface guards, package-boundary і gateway-watch    | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                               | Зміни, релевантні для Node           |
| `checks`                         | Верифікатор для тестів каналів на зібраних артефактах плюс сумісність Node 22 лише для push  | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Ланки тестів, специфічні для Windows                                                         | Зміни, релевантні для Windows        |
| `macos-node`                     | Ланка тестів TypeScript на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS          |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS          |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android        |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені й runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення меж знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із lint для workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформені ланки й надалі визначаються лише змінами у вихідному коді відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними обгортками process/path, допоміжними засобами для npm/pnpm/UI runner, конфігурацією package manager і поверхнями CI workflow, які запускають цю ланку; нерелевантні зміни в коді, plugins, install-smoke і зміни лише в тестах залишаються в Linux Node-ланках, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення меж через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних зі встановленням, пакуванням, контейнерами, production-змін bundled extensions, а також для поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише в тестах і лише в документації не резервують Docker workers. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому перевірка встановлення все одно відбувається без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime-образ, зібраний раніше в межах завдання, тому додає реальне покриття WebSocket між контейнерами без додаткової Docker-збірки. Локальна команда `test:docker:all` попередньо збирає один спільний образ built-app з `scripts/e2e/Dockerfile` і повторно використовує його в smoke runners контейнерів E2E; повторно використовуваний live/E2E workflow віддзеркалює цей шаблон, збираючи та публікуючи один Docker E2E-образ GHCR з тегом SHA перед Docker-матрицею, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Тести Docker для QR та installer зберігають власні Dockerfile, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна матриця bundled update/channel залишається manual/full-suite, оскільки виконує повторні реальні проходи `npm update` і `doctor repair`.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж ширші межі платформ у CI: production-зміни в core запускають перевірку типів core prod плюс core-тести, зміни лише в core-тестах запускають тільки перевірку типів і тести для core test, production-зміни в extensions запускають перевірку типів extension prod плюс тести extensions, а зміни лише в extension-тестах запускають тільки перевірку типів і тести для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих контрактів core. Зміни лише в release metadata, як-от version bumps, запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються на всі ланки.

Для push матриця `checks` додає ланку `compat-node22`, яка запускається лише для push. Для pull request ця ланка пропускається, і матриця зосереджується на звичайних ланках тестів/каналів.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють registry і core-покриття на шість зважених шардів загалом, тести bundled plugins збалансовані між шістьма extension workers, auto-reply працює як три збалансовані workers замість шести дрібних, а agentic-конфігурації gateway/plugin розподіляються по наявних source-only agentic Node-завданнях замість очікування на зібрані артефакти. Широкі тести браузера, QA, медіа та різних plugins використовують свої спеціалізовані конфігурації Vitest замість спільного catch-all для plugins. Широка ланка agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують імпорти й планування, а не один повільний тестовий файл. `runtime-config` запускається разом із infra core-runtime shard, щоб спільний runtime shard не ставав найдовшим. `check-additional` тримає разом compile/canary-роботи для package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guards паралельно в межах одного завдання. Gateway watch, тести каналів і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі завдання-верифікатори та уникаючи двох додаткових workers Blacksmith і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його ланка unit-тестів усе одно компілює цей flavor з прапорцями SMS/call-log у BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK для кожного Android-релевантного push.
`extension-fast` доступне лише для PR, оскільки для push уже виконуються повні шарди bundled plugin. Це дає швидкий зворотний зв’язок щодо змінених plugins під час review, не резервуючи додатковий worker Blacksmith у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новий push надходить у той самий PR або ref `main`. Сприймайте це як шум CI, якщо лише найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було замінено новішим.
Ключ concurrency у CI має версіонування (`CI-v7-*`), тому zombie-процес на боці GitHub у старій групі черги не може безстроково блокувати нові запуски для main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, розшардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugins, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і надалі достатньо чутливий до CPU, тому 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + розшардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
