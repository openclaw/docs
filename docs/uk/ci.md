---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, брами області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T19:38:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0df7f296bff684a61f86eae1ba683c1fb9297092476ef0d404c77097fcf7845
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для нечернеткових push і PR  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                   | Завжди для нечернеткових push і PR  |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для нечернеткових push і PR  |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-перевірки коректності, як-от bundled/plugin-contract/protocol checks             | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                              | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шардовані тести core Node, крім каналів, bundled, contract і extension lanes                  | Зміни, релевантні для Node          |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                               | Коли виявлено зміни в розширеннях   |
| `check`                          | Шардований еквівалент основної локальної брами: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Шарди архітектури, меж, guards поверхні розширень, меж пакетів і gateway-watch                | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                          | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node lanes: тести каналів і сумісність Node 22 тільки для push                    | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Коли змінено документацію           |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                            | Зміни, релевантні для Skills на Python |
| `checks-windows`                 | Специфічні для Windows тестові lanes                                                          | Зміни, релевантні для Windows       |
| `macos-node`                     | Лінія тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                                | Зміни, релевантні для macOS         |
| `android`                        | Матриця збирання і тестів Android                                                             | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань із артефактами та платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб наступні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують запускати native builds для Windows, Android або macOS; ці платформені лінії залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Перевірки Windows Node прив’язані до специфічних для Windows wrappers для process/path, helper-ів npm/pnpm/UI runner, конфігурації менеджера пакетів і поверхонь workflow CI, які запускають цю лінію; непов’язані зміни вихідного коду, plugin, install-smoke і зміни лише в тестах залишаються в Linux Node lanes, щоб не займати 16-vCPU Windows worker заради покриття, яке вже перевіряється звичайними шардами тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тож Docker/install smoke запускається лише для змін, релевантних до встановлення, пакування та контейнерів. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож перевірка встановлення все одно відбувається без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket контейнер-до-контейнера без додавання ще однієї Docker-збірки.

Логіка локальних changed-lanes міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна брама суворіша щодо архітектурних меж, ніж широка платформена область CI: зміни core production запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для core test, зміни extension production запускають typecheck extension prod плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до рівня extension, оскільки extensions залежать від цих контрактів core. Підвищення версій лише в release metadata запускають точкові перевірки версії/конфігурації/кореневих залежностей. Невідомі зміни root/config безпечно переводять у всі лінії.

Для push матриця `checks` додає лінію `compat-node22`, яка запускається лише для push. Для pull request ця лінія пропускається, і матриця зосереджується на звичайних test/channel lanes.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести auto-reply reply розділені за групою префіксів, а agentic gateway/plugin configs розподілені по наявних source-only agentic Node jobs замість очікування на зібрані артефакти. `check-additional` тримає разом package-boundary compile/canary роботу та відокремлює її від gateway/architecture роботи з топологією runtime; шард boundary guard запускає свої малі незалежні guards паралельно в межах одного завдання, а gateway watch regression використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard checks використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ concurrency для CI має версію (`CI-v3-*`), щоб zombie-процес у старій групі черги на боці GitHub не міг безкінечно блокувати новіші запуски для main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали виграш; Docker-збірки install-smoke, де вартість часу очікування для 32-vCPU була більшою, ніж отримана вигода                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна брама: змінені typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна брама: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама брама з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли мають значення артефакти CI / build-smoke lanes
```
