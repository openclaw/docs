---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областями змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T17:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a59adfb2c9b8c0bed3c2b72a7f76387c67dee21190f0294efdce6e3672781ff
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне обмеження за областями змін, щоб пропускати дорогі завдання, коли змінилися лише нерелевантні ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення і збирає маніфест CI  | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                     | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                    | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-перевірки коректності, як-от bundled/plugin-contract/protocol checks              | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                               | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шардовані core Node тести, без урахування channel, bundled, contract і extension lane          | Зміни, релевантні для Node          |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugin                                                 | Коли виявлено зміни розширень       |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Шарди для architecture, boundary, extension-surface guards, package-boundary і gateway-watch   | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                            | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node lane: channel tests і сумісність Node 22 лише для push                        | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірка битих посилань                                     | Коли змінено документацію           |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                             | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові lane                                                            | Зміни, релевантні для Windows       |
| `macos-node`                     | Лінія тестів TypeScript на macOS з використанням спільних зібраних артефактів                  | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                                | Зміни, релевантні для macOS         |
| `android`                        | Матриця збірки й тестів Android                                                                | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі platform і runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областями змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування CI workflow перевіряє граф Node CI разом із linting workflow, але саме по собі не примушує виконувати нативні збірки для Windows, Android або macOS; ці platform lane, як і раніше, залежать лише від змін у коді відповідних платформ.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних встановленню, пакуванню й контейнерам. Його smoke для QR package примусово перезапускає Docker-шар `pnpm install`, водночас зберігаючи кеш BuildKit pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей під час кожного запуску.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо меж архітектури, ніж широке CI-обмеження за платформами: зміни у core production запускають core prod typecheck плюс core тести, зміни лише в core tests запускають тільки core test typecheck/tests, зміни в extension production запускають extension prod typecheck плюс extension тести, а зміни лише в extension tests запускають тільки extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих core-контрактів. Зміни лише в release metadata, пов’язані з version bump, запускають точкові перевірки version/config/root-dependency. Невідомі зміни в root/config для безпеки запускають усі lane.

Для push матриця `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, а матриця залишається зосередженою на звичайних test/channel lane.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів ділять перевірки registry і core coverage на вісім вагових shard для кожного, тести auto-reply reply поділяються за групою префіксів, а agentic gateway/plugin configs розподіляються по наявних source-only agentic Node jobs замість очікування зібраних артефактів. `check-additional` тримає package-boundary compile/canary-роботи разом і відокремлює їх від gateway/architecture-робіт топології runtime; shard boundary guard паралельно виконує свої невеликі незалежні guards в межах одного завдання, а gateway watch regression використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.

GitHub може позначати витіснені новішим запуском завдання як `cancelled`, коли новий push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був витіснений новішим.
Ключ concurrency у CI версіонований (`CI-v2-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати нові запуски в main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, шардовані перевірки контрактів каналів, shard-и `check`, окрім lint, shard-и й агрегатори `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node-тестів, shard-и тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і надалі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж давали користі                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                           |

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
