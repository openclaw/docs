---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions.
summary: Граф завдань CI, ворота областей дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T20:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному пуші в `main` і для кожного pull request. Він використовує розумне визначення областей дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані між собою частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені extensions і будує маніфест CI | Завжди для non-draft пушів і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft пушів і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                   | Завжди для non-draft пушів і PR    |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для non-draft пушів і PR    |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, вивантажує повторно використовувані артефакти для downstream-завдань | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, такі як bundled/plugin-contract/protocol перевірки            | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, пов’язані з Node            |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin у всьому наборі extensions                               | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди тестів core Node, без урахування каналів, bundled, contract і extension-етапів         | Зміни, пов’язані з Node            |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                               | Коли виявлено зміни в extensions   |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Шарди архітектури, меж, guards поверхні extensions, меж пакетів і gateway-watch              | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke стартового використання пам’яті                             | Зміни, пов’язані з Node            |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                     | Зміни, пов’язані з Node            |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                 | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                     | Зміни, пов’язані з Python Skills   |
| `checks-windows`                 | Специфічні для Windows етапи тестування                                                       | Зміни, пов’язані з Windows         |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільно зібраних артефактів                  | Зміни, пов’язані з macOS           |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                               | Зміни, пов’язані з macOS           |
| `android`                        | Матриця збірки й тестів Android                                                               | Зміни, пов’язані з Android         |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань із артефактами та платформених матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей дії знаходиться в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тож Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Логіка локальних changed-lanes знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка платформена область дії в CI: зміни в core production запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише core test typecheck/tests, зміни в extension production запускають typecheck extension prod плюс тести extensions, а зміни лише в тестах extensions запускають лише extension test typecheck/tests. Публічні зміни Plugin SDK або plugin-contract розширюються до валідації extensions, тому що extensions залежать від цих контрактів core. Невідомі зміни в root/config безпечно переводять до всіх етапів.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця лишається зосередженою на звичайних етапах tests/channel.

Найповільніші сімейства тестів Node розділені на include-file шарди, щоб кожне завдання лишалося невеликим: контракти каналів ділять покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply діляться на чотири шарди include-pattern, а інші великі групи префіксів відповіді auto-reply діляться на два шарди кожна. `check-additional` також відокремлює compile/canary-роботи меж пакетів від runtime topology-робіт gateway/architecture.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref теж не падає. Агреговані шардовані перевірки явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                           |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lanes для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
