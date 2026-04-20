---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions.
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T19:19:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2145c62257d4c2584677b97943304c9c76cfd5d77de29508e39931258cc71e89
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному пуші в `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                     | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                    | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                               | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для наступних завдань | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, наприклад перевірки bundled/plugin-contract/protocol          | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, пов’язані з Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                  | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди основних Node-тестів, окрім етапів каналів, bundled, контрактів і extension             | Зміни, пов’язані з Node            |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                                | Коли виявлено зміни в extension    |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Шарди для архітектури, меж, extension-surface guards, package-boundary і gateway-watch        | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                            | Зміни, пов’язані з Node            |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                     | Зміни, пов’язані з Node            |
| `check-docs`                     | Форматування документації, lint і перевірка битих посилань                                     | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                      | Зміни, релевантні Python Skills    |
| `checks-windows`                 | Етапи тестів, специфічні для Windows                                                           | Зміни, релевантні Windows          |
| `macos-node`                     | Етап TypeScript-тестів на macOS із використанням спільних зібраних артефактів                 | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                                | Зміни, релевантні macOS            |
| `android`                        | Матриця збірки й тестів Android                                                                | Зміни, релевантні Android          |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих завдань із артефактами та платформною матрицею.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформна область CI: зміни в core production запускають typecheck core prod плюс тести core, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни в extension production запускають typecheck extension prod плюс тести extension, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extension, тому що extension залежать від цих контрактів core. Невідомі зміни в root/config у безпечному режимі призводять до запуску всіх етапів.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних етапах test/channel.

Найповільніші сімейства Node-тестів розбиті на include-file shards, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім збалансованих шардів кожне, тести команд відповіді auto-reply розбиті на чотири шарди include-pattern, а інші великі групи префіксів відповідей auto-reply — на два шарди кожна. `check-additional` також відокремлює compile/canary роботу package-boundary від runtime topology робіт gateway/architecture.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
