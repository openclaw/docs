---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте перевірки GitHub Actions, що завершилися з помилкою
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-21T21:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                               | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, вивантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol перевірки   | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди основних Node-тестів, без каналів, bundled, contract і extension-етапів               | Зміни, релевантні для Node         |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни в extension    |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, меж, guards поверхні extension, package-boundary і gateway-watch         | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                               | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для push із Node 22                | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows етапи тестування                                                      | Зміни, релевантні для Windows      |
| `macos-node`                     | Етап TypeScript-тестів на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки і тестів Android                                                              | Зміни, релевантні для Android      |

## Порядок швидкого завершення з помилкою

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не очікуючи важчих завдань з артефактами й платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформені й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт обмеження області через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних до install, packaging і container.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широке платформене обмеження області в CI: зміни core production запускають core prod typecheck плюс core tests, зміни лише core tests запускають лише core test typecheck/tests, зміни extension production запускають extension prod typecheck плюс extension tests, а зміни лише extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх етапів.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів розбиті на include-file шарди, щоб кожне завдання залишалося невеликим: контракти каналів розділяють registry і core coverage на вісім зважених шардів кожен, тести команд відповіді auto-reply розділяються на чотири шарди за include-pattern, а інші великі групи префіксів відповідей auto-reply — на два шарди кожна. `check-additional` також відокремлює compile/canary-роботи package-boundary від gateway/architecture-робіт топології runtime.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані шардові перевірки явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Runners

| Runner                           | Завдання                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                        |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за граничним етапом
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
