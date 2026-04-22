---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T13:55:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5b4da72c831d6fc643bf171fde9f3a83304f581a9d444fef372d04be996f1d
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені розширення та збирає маніфест CI | Завжди для push і PR, які не є чернетками |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                     | Завжди для push і PR, які не є чернетками |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі попереджень npm                            | Завжди для push і PR, які не є чернетками |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                             | Завжди для push і PR, які не є чернетками |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для наступних завдань | Зміни, пов’язані з Node             |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol перевірки    | Зміни, пов’язані з Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, пов’язані з Node             |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                  | Зміни, пов’язані з Node             |
| `checks-node-core-test`          | Шарди тестів core Node, за винятком каналів, bundled, контрактних і extension-етапів          | Зміни, пов’язані з Node             |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                            | Коли виявлено зміни розширень       |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node             |
| `check-additional`               | Захист архітектури, меж, поверхні розширень, меж пакетів і шарди gateway-watch                 | Зміни, пов’язані з Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                                | Зміни, пов’язані з Node             |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для push з Node 22                    | Зміни, пов’язані з Node             |
| `check-docs`                     | Форматування документації, lint і перевірки пошкоджених посилань                               | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                      | Зміни, пов’язані з Python Skills    |
| `checks-windows`                 | Етапи перевірки, специфічні для Windows                                                        | Зміни, пов’язані з Windows          |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                  | Зміни, пов’язані з macOS            |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                                | Зміни, пов’язані з macOS            |
| `android`                        | Матриця збірки і тестів Android                                                                | Зміни, пов’язані з Android          |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли почати роботу, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії розташована в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Локальна логіка змінених етапів розташована в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область дії платформ у CI: зміни в production core запускають перевірку типів core prod плюс тести core, зміни лише в тестах core запускають лише перевірку типів і тести core test, зміни в production extension запускають перевірку типів extension prod плюс тести extension, а зміни лише в тестах extension запускають лише перевірку типів і тести extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію до розширень, тому що розширення залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі етапи.

Під час push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних тестових/channel-етапах.

Найповільніші сімейства тестів Node розбиті на шарди за include-файлами, щоб кожне завдання залишалося невеликим: контракти каналів розбивають покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply розбиваються на чотири шарди за include-pattern, а інші великі групи префіксів відповіді auto-reply розбиваються на два шарди кожна. `check-additional` також розділяє compile/canary-роботу меж пакетів від runtime topology gateway/architecture-роботи.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard-перевірки явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, завдання-агрегатори перевірки (`security-fast`, `check`, `check-additional`, `checks-node-core`, `checks-node-extensions`, `checks-fast-contracts-channels`); preflight для install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла ставитися в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android`                                                                                                                             |
| `blacksmith-8vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                     |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор змінених етапів для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: змінені перевірки типів/lint/тести за граничним етапом
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка пошкоджених посилань
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
