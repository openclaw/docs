---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областями та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T01:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f50aec8600006363b3e84184d6ccafcfdcc2e68c5a078013795336972412b7b4
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за областями, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і будує маніфест CI | Завжди для non-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для non-draft push і PR      |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для non-draft push і PR      |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, такі як bundled/plugin-contract/protocol перевірки          | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel із стабільним агрегованим результатом перевірки      | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extensions                           | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шардовані core Node тести, без channel, bundled, contract та extension етапів              | Зміни, релевантні для Node          |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Pull request-и зі змінами extensions |
| `check`                          | Шардований еквівалент основного локального gate: prod типи, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch шарди     | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                         | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node етапів: channel тести і лише для push сумісність Node 22                   | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                  | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Етапи тестування, специфічні для Windows                                                     | Зміни, релевантні для Windows       |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS         |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                               | Зміни, релевантні для Android       |

## Порядок швидкого завершення з помилкою

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються з помилкою швидко, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областями міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені етапи й далі обмежуються змінами у вихідному коді платформи.
Перевірки Windows Node обмежені обгортками process/path, специфічними для Windows, допоміжними засобами запуску npm/pnpm/UI, конфігурацією package manager і поверхнями workflow CI, що запускають цей етап; не пов’язані зміни у вихідному коді, plugins, install-smoke і лише в тестах залишаються на Linux Node етапах, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними шардованими тестами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт обмеження за областями через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, релевантних для встановлення, пакування, контейнерів, production-змін у bundled extension, а також для core поверхонь plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише в тестах і лише в документації не резервують Docker workers. Його smoke перевірка QR package змушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому вона все одно перевіряє встановлення без повторного завантаження залежностей на кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із тайм-аутом команди 120 секунд: відновлення залежностей setup-entry плюс синтетична ізоляція збоїв bundled-loader. Повна матриця bundled update/channel залишається ручною/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Логіка локальних changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широке платформене обмеження CI: production-зміни core запускають core prod typecheck плюс core тести, зміни лише в core tests запускають тільки core test typecheck/tests, production-зміни extension запускають extension prod typecheck плюс extension тести, а зміни лише в extension tests запускають тільки extension test typecheck/tests. Зміни у публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають точкові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel етапах.

Найповільніші сімейства Node-тестів поділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти channel ділять покриття registry і core загалом на шість зважених шардів, тести bundled plugin розподіляються між шістьма extension workers, auto-reply виконується як три збалансовані workers замість шести крихітних workers, а agentic-конфігурації gateway/plugin розподілені між наявними source-only agentic Node jobs замість очікування зібраних артефактів. Широкі browser-, QA-, media- та різні plugin-тести використовують свої окремі конфігурації Vitest, а не спільний універсальний набір для plugins. Широкий етап agents використовує спільний файлово-паралельний планувальник Vitest, оскільки тут домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із шардом infra core-runtime, щоб спільний runtime-шард не залишався власником хвоста. `check-additional` тримає разом compile/canary роботу package-boundary і відокремлює її від gateway/architecture роботи з runtime topology; шард boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його етап unit-тестів усе одно компілює цей flavor із прапорцями SMS/call-log BuildConfig, при цьому уникаючи дубльованого завдання пакування debug APK для кожного Android-релевантного push.
`extension-fast` доступний лише для PR, оскільки для push уже виконуються повні шардовані тести bundled plugins. Це зберігає швидкий зворотний зв’язок для reviews щодо змінених plugins, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані шардовані перевірки використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як весь workflow уже був витіснений.
Ключ concurrency для CI має версію (`CI-v6-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски для main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали економію; Docker-збірки install-smoke, де час очікування в черзі на 32 vCPU коштував дорожче, ніж давав економію                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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
pnpm check:docs     # docs format + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
