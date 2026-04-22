---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T13:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe3faf46d7716ad0385e8f804d5deed202ac1a0e842ee5d0528712d9f5606c5
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані області.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisory                                  | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, зокрема bundled/plugin-contract/protocol перевірки           | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, окрім каналів, bundled, контрактних і extension-етапів           | Зміни, релевантні для Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни розширень       |
| `check`                          | Шардований еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Шарди для архітектури, меж, extension-surface guards, package-boundary і gateway-watch       | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові етапи                                                         | Зміни, релевантні для Windows       |
| `macos-node`                     | Етап TypeScript-тестів на macOS із використанням спільно зібраних артефактів                 | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS         |
| `android`                        | Матриця збірки й тестів Android                                                              | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних до встановлення, пакування та контейнерів.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широка платформна область дії CI: зміни в core production запускають core prod typecheck плюс core-тести, зміни лише в core tests запускають тільки core test typecheck/tests, зміни в extension production запускають extension prod typecheck плюс extension-тести, а зміни лише в extension tests запускають тільки extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension validation, оскільки розширення залежать від цих контрактів core. Зміни лише в release metadata version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config у безпечному режимі запускають усі етапи.

Для push матриця `checks` додає етап `compat-node22`, що виконується лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів поділено на include-file шарди, щоб кожне завдання залишалося невеликим: контракти каналів ділять покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply діляться на чотири шарди include-pattern, а інші великі групи префіксів відповіді auto-reply діляться на два шарди кожна. `check-additional` також окремо розділяє compile/canary-роботу package-boundary від runtime topology gateway/architecture-роботи.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Runners

| Runner                           | Завдання                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; preflight для install-smoke також використовує Ubuntu на GitHub-hosted, щоб матриця Blacksmith могла стати в чергу раніше    |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-8vcpu-windows-2025`  | `checks-windows`                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; для fork використовується `macos-latest`                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; для fork використовується `macos-latest`                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидка локальна перевірка: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
