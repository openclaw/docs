---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалі перевірки GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T14:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69056ef80de9f1744b4a8ad71c0a8927307430defa2b8a21a8613525e9c5ac18
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

## Огляд завдань

| Завдання                 | Призначення                                                                                | Коли запускається                   |
| ------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| `preflight`              | Визначає зміни лише в документації, змінені межі, змінені extensions і збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-fast`          | Виявлення приватних ключів, аудит workflow через `zizmor`, аудит production-залежностей    | Завжди для push і PR, що не є draft |
| `build-artifacts`        | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`       | Швидкі Linux-перевірки коректності, як-от bundled/plugin-contract/protocol checks          | Зміни, релевантні для Node          |
| `checks-node-extensions` | Повні шарди тестів bundled-plugin для всього набору extension                              | Зміни, релевантні для Node          |
| `checks-node-core-test`  | Шарди core Node tests, за винятком channel, bundled, contract і extension lanes           | Зміни, релевантні для Node          |
| `extension-fast`         | Сфокусовані тести лише для змінених bundled plugins                                        | Коли виявлено зміни в extension     |
| `check`                  | Основна локальна перевірка в CI: `pnpm check`, `pnpm check:test-types` і `pnpm build:strict-smoke` | Зміни, релевантні для Node          |
| `check-additional`       | Захист архітектури, меж і import-cycle плюс regression harness для gateway watch           | Зміни, релевантні для Node          |
| `build-smoke`            | Smoke-тести зібраного CLI і smoke-тест стартового використання пам’яті                     | Зміни, релевантні для Node          |
| `checks`                 | Решта Linux Node lanes: channel tests і лише для push сумісність Node 22                   | Зміни, релевантні для Node          |
| `check-docs`             | Перевірки форматування документації, lint і битих посилань                                 | Змінено документацію                |
| `skills-python`          | Ruff + pytest для Skills на базі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`         | Специфічні для Windows test lanes                                                          | Зміни, релевантні для Windows       |
| `macos-node`             | Лінія TypeScript-тестів на macOS із використанням спільних зібраних артефактів            | Зміни, релевантні для macOS         |
| `macos-swift`            | Swift lint, build і tests для застосунку macOS                                             | Зміни, релевантні для macOS         |
| `android`                | Матриця збірки й тестів Android                                                            | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли почати роботу щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні й runtime-лінії: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж розташована в `scripts/ci-changed-scope.mjs` і покривається unit tests у `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт меж через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних встановленню, пакуванню й контейнерам.

Логіка локальних changed-lane розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широкі платформні межі CI: зміни в core production запускають typecheck core prod плюс core tests, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни в extension production запускають typecheck extension prod плюс extension tests, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extensions залежать від цих core-контрактів. Невідомі зміни в корені/конфігурації з міркувань безпеки запускають усі лінії.

Для push матриця `checks` додає лінію `compat-node22`, яка запускається лише для push. Для pull request цю лінію пропускають, і матриця залишається зосередженою на звичайних test/channel lanes.

## Runners

| Runner                           | Завдання                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + shard-ований lint + паралельні швидкі захисні перевірки
pnpm check:test-types
pnpm check:timed    # та сама перевірка з вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest-тести
pnpm test:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # збірка dist, коли важливі лінії CI artifact/build-smoke
```
