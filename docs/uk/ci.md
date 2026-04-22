---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T14:46:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99a68c738cbb171aee91aa1242f733090fd7dd551af07a1e87c38edfbbf0687d
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне обмеження за областю дії, щоб пропускати дорогі завдання, коли змінювалися лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених розширень і побудова маніфесту CI | Завжди для push і PR, що не є чернетками |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є чернетками |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                   | Завжди для push і PR, що не є чернетками |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для push і PR, що не є чернетками |
| `build-artifacts`                | Зібрати `dist/` і Control UI один раз, завантажити повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol checks      | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди основних тестів Node без етапів каналів, bundled, контрактів і розширень               | Зміни, релевантні для Node         |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни розширень      |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди перевірок архітектури, меж, поверхні розширень, package-boundary і gateway-watch       | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                           | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Документація змінена               |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                            | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні етапи тестування                                                           | Зміни, релевантні для Windows      |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні для macOS        |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки і тестів Android                                                               | Зміни, релевантні для Android      |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань з артефактами та платформенних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформенні й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних встановленню, пакуванню та контейнерам.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформенна область дії CI: зміни у production-коді ядра запускають core prod typecheck плюс core tests, зміни лише в core tests запускають тільки core test typecheck/tests, зміни у production-коді розширень запускають extension prod typecheck плюс extension tests, а зміни лише в extension tests запускають тільки extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на розширення, оскільки розширення залежать від цих контрактів ядра. Підвищення версії лише в release metadata запускає цільові перевірки version/config/root-dependency. Невідомі зміни root/config у безпечному режимі спрямовуються в усі етапи.

Для push матриця `checks` додає етап `compat-node22`, який виконується лише для push. Для pull request цей етап пропускається, і матриця лишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства тестів Node розбиті на шарди за include-файлами, щоб кожне завдання залишалося невеликим: контракти каналів розбивають покриття registry і core на вісім зважених шардів для кожного, тести команд reply для auto-reply розбиті на чотири шарди за include-pattern, а інші великі групи префіксів reply для auto-reply розбиті на два шарди кожна. `check-additional` також відокремлює compile/canary-роботу package-boundary від runtime topology-роботи gateway/architecture.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані шардовані перевірки явно вказують на цей випадок скасування, щоб його було легше відрізнити від помилки тесту.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, короткі агреговані завдання-перевірки (`security-fast`, `check`, `check-additional`, `checks-fast-contracts-channels`), workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `build-artifacts`, Linux-перевірки, окрім `check-lint`, довгі агреговані перевірки матриці, перевірки документації, Python Skills, `android`                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається настільки чутливим до CPU, що 8 vCPU коштували більше, ніж заощаджували                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                       |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із вимірюванням часу по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
