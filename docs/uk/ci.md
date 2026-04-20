---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються з помилкою
summary: Граф завдань CI, перевірки за охопленням і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T12:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b128a0112dbaa6449b4f2ace018939f552f99929044732d18d5bea8b46695815
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінювалися лише не пов’язані ділянки.

## Огляд завдань

| Завдання                 | Призначення                                                                            | Коли запускається                   |
| ------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Визначає зміни лише в документації, змінені охоплення, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-fast`          | Виявлення приватних ключів, аудит workflow через `zizmor`, аудит production-залежностей | Завжди для push і PR, що не є draft |
| `build-artifacts`        | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні для Node          |
| `checks-fast-core`       | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol checks | Зміни, релевантні для Node          |
| `checks-node-extensions` | Повні шарди тестів bundled-plugin для набору розширень                                 | Зміни, релевантні для Node          |
| `checks-node-core-test`  | Шарди тестів core Node, за винятком channel-, bundled-, contract- і extension-етапів  | Зміни, релевантні для Node          |
| `extension-fast`         | Цільові тести лише для змінених bundled plugins                                        | Коли виявлено зміни розширень       |
| `check`                  | Основний локальний gate у CI: `pnpm check` плюс `pnpm build:strict-smoke`              | Зміни, релевантні для Node          |
| `check-additional`       | Захисти архітектури, меж, циклів імпорту плюс regression harness для gateway watch     | Зміни, релевантні для Node          |
| `build-smoke`            | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                        | Зміни, релевантні для Node          |
| `checks`                 | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push              | Зміни, релевантні для Node          |
| `check-docs`             | Форматування документації, lint і перевірки битих посилань                             | Документацію змінено                |
| `skills-python`          | Ruff + pytest для Skills на основі Python                                              | Зміни, релевантні для Python Skills |
| `checks-windows`         | Специфічні для Windows етапи тестування                                                | Зміни, релевантні для Windows       |
| `macos-node`             | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів          | Зміни, релевантні для macOS         |
| `macos-swift`            | Lint, збірка й тести Swift для застосунку macOS                                        | Зміни, релевантні для macOS         |
| `android`                | Матриця збірки й тестування Android                                                    | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань із артефактами та платформними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли почати роботу, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка охоплення розташована в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт охоплення через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Для push матриця `checks` додає етап `compat-node22`, який виконується лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

## Runner-и

| Runner                           | Завдання                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                            |

## Локальні еквіваленти

```bash
pnpm check          # швидкий локальний gate: tsgo з project references + sharded lint + паралельні швидкі захисти
pnpm check:timed    # той самий gate із таймінгами по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
