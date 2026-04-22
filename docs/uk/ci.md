---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, бар’єри областей змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T18:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 302deb5128fa734b69380f272d648dd3259afa74a2b7754fbb7389779349297e
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                                | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, такі як перевірки bundled/plugin-contract/protocol            | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel зі стабільним агрегованим результатом перевірки        | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                              | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди core Node тестів, без channel, bundled, contract і extension ланок                      | Зміни, релевантні для Node         |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                               | Коли виявлено зміни розширень      |
| `check`                          | Шардований еквівалент основного локального бар’єра: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектурних перевірок, перевірок меж, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                           | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node ланок: тести channel і сумісність Node 22 лише для push                      | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                            | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові ланки                                                          | Зміни, релевантні для Windows      |
| `macos-node`                     | Ланка TypeScript тестів на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки і тестів Android                                                               | Зміни, релевантні для Android      |

## Порядок швидкого завершення з помилкою

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` визначає, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань із артефактами та платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб наступні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють граф Node CI разом із lint перевірок workflow, але самі по собі не примушують запускати native-збірки для Windows, Android або macOS; ці платформені ланки й надалі обмежуються змінами у вихідному коді відповідних платформ.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних до встановлення, пакування та контейнерів. Його QR package smoke примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому він усе одно перевіряє встановлення без повторного завантаження залежностей при кожному запуску.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний бар’єр суворіший щодо архітектурних меж, ніж широка платформена область CI: зміни у production-коді core запускають core prod typecheck разом із core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни у production-коді extension запускають extension prod typecheck разом із extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension validation, оскільки розширення залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх ланок.

Для push матриця `checks` додає ланку `compat-node22`, яка запускається лише для push. Для pull request ця ланка пропускається, і матриця зосереджується на звичайних test/channel ланках.

Найповільніші сімейства Node тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти channel розділяють покриття registry і core на вісім зважених шардів для кожного, тести auto-reply reply поділено за групами префіксів, а agentic gateway/plugin configs розподілено по наявних source-only agentic Node jobs замість очікування на зібрані артефакти. `check-additional` тримає compile/canary роботу package-boundary разом і відокремлює її від runtime topology gateway/architecture роботи; шард boundary guard виконує свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже було витіснено.
Ключ concurrency CI має версіонування (`CI-v2-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски для main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та їхні агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, окрім lint, шарди й агрегати `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node тестів, шарди bundled plugin тестів, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, яке й далі настільки чутливе до CPU, що 8 vCPU коштували дорожче, ніж давали вигоду; Docker-збірки install-smoke, де витрати часу на чергу для 32 vCPU були вищими за вигоду                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                 |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний бар’єр: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний бар’єр: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий бар’єр із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
```
