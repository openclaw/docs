---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі охоплення, і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T05:20:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                          | Призначення                                                                                   | Коли запускається                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                       | Виявлення змін лише в документації, змінених меж охоплення, змінених extensions і побудова маніфесту CI | Завжди для push і PR, які не є draft |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для push і PR, які не є draft |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisory з npm                                 | Завжди для push і PR, які не є draft |
| `security-fast`                   | Обов’язковий агрегований результат для швидких завдань безпеки                                | Завжди для push і PR, які не є draft |
| `build-artifacts`                 | Зібрати `dist/` і Control UI один раз, завантажити повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`                | Швидкі Linux-ланки коректності, такі як bundled/plugin-contract/protocol перевірки            | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні для Node          |
| `checks-node-extensions`          | Повні шарди тестів bundled-plugin для всього набору extensions                                | Зміни, релевантні для Node          |
| `checks-node-core-test`           | Шарди основних Node-тестів, без каналів, bundled, contract і extension-ланок                  | Зміни, релевантні для Node          |
| `extension-fast`                  | Сфокусовані тести лише для змінених bundled plugins                                           | Коли виявлено зміни в extensions    |
| `check`                           | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`                | Шарди архітектурних перевірок, перевірок меж, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні для Node          |
| `build-smoke`                     | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                           | Зміни, релевантні для Node          |
| `checks`                          | Решта Linux Node-ланок: тести каналів і сумісність лише для push з Node 22                    | Зміни, релевантні для Node          |
| `check-docs`                      | Форматування документації, lint і перевірки непрацюючих посилань                              | Коли змінено документацію           |
| `skills-python`                   | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                  | Специфічні для Windows ланки тестування                                                       | Зміни, релевантні для Windows       |
| `macos-node`                      | Ланка тестів TypeScript на macOS з використанням спільних зібраних артефактів                 | Зміни, релевантні для macOS         |
| `macos-swift`                     | Swift lint, build і тести для застосунку macOS                                                | Зміни, релевантні для macOS         |
| `android`                         | Матриця збірки і тестування Android                                                           | Зміни, релевантні для Android       |

## Порядок швидкого завершення при помилках

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж почнуть виконуватися дорогі:

1. `preflight` вирішує, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань артефактів і платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення охоплення через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних з установленням, пакуванням і контейнерами.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широке платформне охоплення CI: зміни core production запускають typecheck core prod плюс тести core, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни extension production запускають typecheck extension prod плюс тести extensions, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію до extensions, оскільки extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно спрямовуються в усі ланки.

Для push матриця `checks` додає ланку `compat-node22`, яка запускається лише для push. Для pull request ця ланка пропускається, і матриця залишається зосередженою на звичайних test/channel-ланках.

Найповільніші сімейства Node-тестів поділяються на шарди за include-файлами, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести команди reply для auto-reply поділяються на чотири шарди за include-pattern, а інші великі групи префіксів reply для auto-reply поділяються на два шарди кожна. `check-additional` також відокремлює package-boundary compile/canary роботу від runtime topology gateway/architecture роботи.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Виконавці

| Виконавець                        | Завдання                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                    | `preflight`; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставитися в чергу раніше |
| `blacksmith-16vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025`  | `checks-windows`                                                                                                                          |
| `blacksmith-12vcpu-macos-latest`  | `macos-node`, `macos-swift` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary-ланкою
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка непрацюючих посилань
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
```
