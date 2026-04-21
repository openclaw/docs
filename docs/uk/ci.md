---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-21T02:32:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push у `main` і для кожного pull request. Він використовує розумне визначення області, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і будує маніфест CI | Завжди для push і PR без чернетки  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                  | Завжди для push і PR без чернетки  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо рекомендацій npm                             | Завжди для push і PR без чернетки  |
| `security-fast`                  | Обов’язковий агрегований результат для швидких завдань безпеки                              | Завжди для push і PR без чернетки  |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для залежних завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol перевірки            | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Розшардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки   | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extensions                           | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шардовані тести core Node, без ліній каналів, bundled, контрактів і extensions              | Зміни, релевантні для Node         |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                             | Коли виявлено зміни extensions     |
| `check`                          | Розшардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, меж, guard-перевірок extension-surface, package-boundary і gateway-watch | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                              | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node-ліній: тести каналів і лише для push сумісність Node 22                    | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                  | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                          | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові лінії                                                        | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія тестів TypeScript на macOS з використанням спільних зібраних артефактів               | Зміни, релевантні для macOS        |
| `macos-swift`                    | Лінтинг, збірка і тести Swift для застосунку macOS                                          | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки й тестів Android                                                             | Зміни, релевантні для Android      |

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих завдань зі створення артефактів і платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб залежні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних з install, packaging і контейнерами.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформна область CI: зміни в core production запускають typecheck core prod плюс тести core, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни в extension production запускають typecheck extension prod плюс тести extensions, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих контрактів core. Невідомі зміни в root/config безпечно розширюються до всіх ліній.

Для push матриця `checks` додає лінію `compat-node22`, яка запускається лише для push. Для pull request цю лінію пропускають, і матриця зосереджується на звичайних тестових/channel-лініях.

Найповільніші сімейства тестів Node розділено на include-file шарди, щоб кожне завдання залишалося невеликим: channel contracts розділяють покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply розділяються на чотири шарди за include-pattern, а інші великі групи префіксів відповідей auto-reply — на два шарди кожна. `check-additional` також відокремлює роботу package-boundary compile/canary від runtime topology gateway/architecture.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані шардовані перевірки явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Runners

| Runner                           | Завдання                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за граничною лінією
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі лінії CI artifact/build-smoke
```
