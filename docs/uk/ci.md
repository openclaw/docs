---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області видимості та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T16:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d17eb446976a5433ff14ef954b455a7041afe1563e9c8bb59bc54682324dbd23
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                               | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для наступних завдань | Зміни, що стосуються Node          |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, такі як bundled/plugin-contract/protocol перевірки           | Зміни, що стосуються Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, що стосуються Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, що стосуються Node          |
| `checks-node-core-test`          | Шарди тестів core Node, без каналів, bundled, contract і extension-етапів                    | Зміни, що стосуються Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни в extension    |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, що стосуються Node          |
| `check-additional`               | Шарди для архітектурних, граничних, extension-surface guards, package-boundary і gateway-watch | Зміни, що стосуються Node          |
| `build-smoke`                    | Smoke-тести для зібраного CLI і перевірка пам’яті під час запуску                            | Зміни, що стосуються Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, що стосуються Node          |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Якщо змінено документацію          |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, що стосуються Python Skills |
| `checks-windows`                 | Windows-специфічні тестові етапи                                                             | Зміни, що стосуються Windows       |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, що стосуються macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, що стосуються macOS         |
| `android`                        | Матриця збірки й тестів Android                                                              | Зміни, що стосуються Android       |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи важчих завдань з артефактами та платформними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряє граф CI для Node і Windows, а також linting workflow, але саме по собі не примушує запускати нативні збірки Android або macOS; ці платформні етапи залишаються прив’язаними до змін у нативних вихідних кодах.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, що стосуються встановлення, пакування та контейнерів.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни у production core запускають typecheck production core плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, зміни у production extension запускають typecheck production extension плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension, оскільки extensions залежать від цих контрактів core. Зміни лише в metadata релізу з підвищенням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять запуск на всі етапи.

Під час push матриця `checks` додає етап `compat-node22`, який виконується лише для push. Для pull request цей етап пропускається, і матриця лишається зосередженою на звичайних тестових/channel-етапах.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести відповідей auto-reply розділено за групами префіксів, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування зібраних артефактів. `check-additional` тримає разом роботу package-boundary compile/canary і відокремлює її від роботи runtime topology gateway/architecture.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Ставтеся до цього як до шуму CI, якщо тільки найновіший запуск для того самого ref також не завершується помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже було витіснено.
Ключ конкурентності CI має версію (`CI-v2-*`), щоб zombie-запуск на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски `main`.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували більше, ніж дали вигоди                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary-етапами
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі артефакти CI/етапи build-smoke
```
