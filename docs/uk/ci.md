---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-10T23:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca7e355b7f73bfe8ea8c6971e78164b8b2e68cbb27966964955e267fed89fce6
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані між собою частини.

## Огляд завдань

| Завдання                 | Призначення                                                                            | Коли запускається                   |
| ------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Визначає зміни лише в документації, змінені області, змінені розширення та будує маніфест CI | Завжди для push і PR, що не є чернетками |
| `security-fast`          | Виявлення приватних ключів, аудит workflow через `zizmor`, аудит production-залежностей | Завжди для push і PR, що не є чернетками |
| `build-artifacts`        | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для залежних завдань | Зміни, релевантні для Node          |
| `checks-fast-core`       | Швидкі Linux-ланцюжки коректності, такі як перевірки bundled/plugin-contract/protocol | Зміни, релевантні для Node          |
| `checks-node-extensions` | Повні шарди тестів bundled-plugin для всього набору розширень                         | Зміни, релевантні для Node          |
| `checks-node-core-test`  | Шарди основних тестів Node, за винятком ланцюжків channel, bundled, contract і extension | Зміни, релевантні для Node          |
| `extension-fast`         | Сфокусовані тести лише для змінених bundled plugins                                   | Коли виявлено зміни в розширеннях   |
| `check`                  | Основний локальний шлюз у CI: `pnpm check` плюс `pnpm build:strict-smoke`             | Зміни, релевантні для Node          |
| `check-additional`       | Захист архітектури, меж модулів, циклів імпорту, а також regression harness для спостереження gateway | Зміни, релевантні для Node          |
| `build-smoke`            | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                        | Зміни, релевантні для Node          |
| `checks`                 | Решта Linux-ланцюжків Node: тести channel і сумісність Node 22 лише для push          | Зміни, релевантні для Node          |
| `check-docs`             | Форматування документації, lint і перевірки зламаних посилань                         | Коли змінено документацію           |
| `skills-python`          | Ruff + pytest для Skills на основі Python                                             | Зміни, релевантні для Python Skills |
| `checks-windows`         | Специфічні для Windows ланцюжки тестів                                                | Зміни, релевантні для Windows       |
| `macos-node`             | Ланцюжок тестів TypeScript на macOS з використанням спільних зібраних артефактів      | Зміни, релевантні для macOS         |
| `macos-swift`            | Swift lint, збірка і тести для застосунку macOS                                       | Зміни, релевантні для macOS         |
| `android`                | Матриця збірки і тестів Android                                                       | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які ланцюжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланцюжками, щоб залежні споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-ланцюжки: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Для push матриця `checks` додає ланцюжок `compat-node22`, який запускається лише для push. Для pull request цей ланцюжок пропускається, а матриця залишається зосередженою на звичайних тестових/channel-ланцюжках.

## Runner-и

| Runner                           | Завдання                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Локальні еквіваленти

```bash
pnpm check          # типи + lint + форматування
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # збірка dist, коли важливі ланцюжки CI для артефактів/build-smoke
```
