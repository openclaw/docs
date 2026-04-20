---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмежувальні перевірки за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T14:13:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd4ffb6986739ee6f4fca6e8b1f40baee7e47a8387e8d06c722881ebe78b4766
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

## Огляд завдань

| Завдання                 | Призначення                                                                               | Коли запускається                    |
| ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`              | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft  |
| `security-fast`          | Виявлення приватних ключів, аудит workflow через `zizmor`, аудит production-залежностей   | Завжди для push і PR, що не є draft  |
| `build-artifacts`        | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node           |
| `checks-fast-core`       | Швидкі Linux-перевірки коректності, як-от bundled/plugin-contract/protocol checks         | Зміни, релевантні для Node           |
| `checks-node-extensions` | Повні шарди тестів bundled-plugin для всього набору розширень                             | Зміни, релевантні для Node           |
| `checks-node-core-test`  | Шарди основних Node-тестів, без channel, bundled, contract і extension-ланів              | Зміни, релевантні для Node           |
| `extension-fast`         | Сфокусовані тести лише для змінених bundled plugins                                       | Коли виявлено зміни розширень        |
| `check`                  | Основна локальна перевірка в CI: `pnpm check`, `pnpm check:test-types` і `pnpm build:strict-smoke` | Зміни, релевантні для Node           |
| `check-additional`       | Перевірки архітектури, меж, циклів імпорту, а також regression harness для gateway watch  | Зміни, релевантні для Node           |
| `build-smoke`            | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                           | Зміни, релевантні для Node           |
| `checks`                 | Решта Linux Node-ланів: channel-тести та сумісність лише для push з Node 22               | Зміни, релевантні для Node           |
| `check-docs`             | Форматування документації, lint і перевірки битих посилань                                | Документацію змінено                 |
| `skills-python`          | Ruff + pytest для Skills на Python                                                        | Зміни, релевантні для Python Skills  |
| `checks-windows`         | Специфічні для Windows тестові лани                                                       | Зміни, релевантні для Windows        |
| `macos-node`             | Лан тестів TypeScript на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні для macOS          |
| `macos-swift`            | Swift lint, збірка та тести для застосунку macOS                                          | Зміни, релевантні для macOS          |
| `android`                | Матриця збірки й тестів Android                                                           | Зміни, релевантні для Android        |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які лани взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань з артефактами та матрицями платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланами, щоб downstream-споживачі могли почати роботу, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-лани: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю змін знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу `changed-smoke`, тому Docker/install smoke запускається лише для змін, пов’язаних зі встановленням, пакуванням і контейнерами.

Для push матриця `checks` додає лан `compat-node22`, який запускається лише для push. Для pull request цей лан пропускається, і матриця зосереджується на звичайних тестових/channel-ланах.

## Runners

| Runner                           | Завдання                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Локальні еквіваленти

```bash
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі перевірки
pnpm check:test-types
pnpm check:timed    # та сама перевірка з помітками часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest-тести
pnpm test:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # збірка dist, коли важливі CI-лани artifact/build-smoke
```
