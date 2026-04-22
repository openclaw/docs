---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T19:15:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a64acddb097a2d4b7fbba5c79c1fdf1ad3dd67d37bdd623ece82fc5e6fda670
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному пуші до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише нерелевантні ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI | Завжди для нечернеткових пушів і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflows через `zizmor`                                  | Завжди для нечернеткових пушів і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для нечернеткових пушів і PR |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для нечернеткових пушів і PR |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні Node              |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, релевантні Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні Node              |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, релевантні Node              |
| `checks-node-core-test`          | Шарди core Node тестів, без урахування каналів, bundled, контрактних і extension-етапів      | Зміни, релевантні Node              |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Коли виявлено зміни в extension     |
| `check`                          | Шардований еквівалент основного локального шлюзу: production-типи, lint, guards, типи тестів і строгий smoke | Зміни, релевантні Node              |
| `check-additional`               | Шарди архітектури, меж, guards поверхні extension, меж пакунків і gateway-watch              | Зміни, релевантні Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                          | Зміни, релевантні Node              |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для пушів з Node 22                 | Зміни, релевантні Node              |
| `check-docs`                     | Перевірки форматування документації, lint і зламаних посилань                                | Коли змінено документацію           |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні Python Skills     |
| `checks-windows`                 | Специфічні для Windows тестові етапи                                                         | Зміни, релевантні Windows           |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні macOS             |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні macOS             |
| `android`                        | Матриця збірки і тестів Android                                                              | Зміни, релевантні Android           |

## Порядок швидкого падіння

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж почнуть виконуватися дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань з артефактами та платформними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін розміщена в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряють граф Node CI разом із linting workflows, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні етапи залишаються прив’язаними до змін у коді відповідних платформ.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, допоміжними засобами запуску npm/pnpm/UI, конфігурацією package manager і поверхнями workflow CI, які запускають цей етап; нерелевантні зміни в коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node-етапах, щоб не займати 16-vCPU Windows worker для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних встановленню, пакуванню та контейнерам. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах цього завдання, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Логіка локальних changed-lanes розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформна область CI: зміни в production core запускають перевірку типів core prod плюс тести core, зміни лише в тестах core запускають тільки перевірку типів/тести core test, зміни в production extension запускають перевірку типів extension prod плюс тести extension, а зміни лише в тестах extension запускають тільки перевірку типів/тести extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension, оскільки extensions залежать від цих core-контрактів. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі етапи.

Для пушів матриця `checks` додає етап `compat-node22`, що виконується лише для пушів. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних тестових/channel-етапах.

Найповільніші сімейства Node тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести auto-reply reply розділено за групами префіксів, а конфігурації agentic gateway/plugin розподілені по наявних source-only agentic Node jobs замість очікування зібраних артефактів. `check-additional` тримає разом роботи compile/canary для меж пакунків і відокремлює їх від runtime-topology робіт gateway/architecture; шард boundary guard виконує свої невеликі незалежні guards паралельно всередині одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної повної збірки sidecar-набору артефактів CI.

GitHub може позначати витіснені новішим запуском завдання як `cancelled`, коли новіший пуш потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо лише найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ конкурентності CI має версіонування (`CI-v3-*`), щоб zombie-елемент у старій групі черги на боці GitHub не міг безстроково блокувати новіші запуски на `main`.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node тестів, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу очікування 32-vCPU була вищою за виграш                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local gate: changed typecheck/lint/tests by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
```
