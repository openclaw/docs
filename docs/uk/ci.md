---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T17:13:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5480c1f9f6f77639be2767df88cdb4eb5e91b49f60bd4d6730c6fe3e16f34918
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                  |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди основних тестів Node, за винятком ланок каналів, bundled, контрактів і розширень       | Зміни, релевантні для Node         |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни в розширеннях  |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, меж, захисту поверхні розширень, меж пакетів і gateway-watch              | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                               | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node-ланок: тести каналів і сумісність лише для push з Node 22                   | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові ланки                                                         | Зміни, релевантні для Windows      |
| `macos-node`                     | Ланка тестів TypeScript на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки й тестів Android                                                              | Зміни, релевантні для Android      |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` визначає, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань з артефактами та платформними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб наступні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф CI для Node і Windows, а також lint workflow, але самі по собі не примушують запускати нативні збірки Android або macOS; ці платформні ланки й надалі обмежені змінами у нативних вихідних файлах.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних до встановлення, пакування та контейнерів.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни в core production запускають typecheck core prod плюс тести core, зміни лише в core tests запускають лише typecheck/tests core test, зміни в extension production запускають typecheck extension prod плюс тести extension, а зміни лише в extension tests запускають лише typecheck/tests extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на розширення, оскільки розширення залежать від цих контрактів core. Зміни лише в метаданих релізу для підвищення версії запускають цільові перевірки версії/конфігурації/кореневих залежностей. Невідомі зміни в root/config у безпечному режимі спрямовуються в усі ланки.

Під час push матриця `checks` додає ланку `compat-node22`, яка запускається лише для push. Для pull request ця ланка пропускається, і матриця залишається зосередженою на звичайних тестових ланках/ланках каналів.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести auto-reply reply розділяються за групою префікса, а agentic gateway/plugin configs розподіляються по наявних Node-завданнях лише для source, замість очікування на зібрані артефакти. `check-additional` тримає compile/canary-роботи для меж пакетів разом і відділяє їх від runtime topology gateway/architecture-робіт; регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторного збирання повного набору sidecar-артефактів CI.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Розглядайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні помилки шардів, але не ставали в чергу після того, як увесь workflow уже був замінений новішим.
Ключ concurrency для CI має версію (`CI-v2-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски в main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж давали вигоду                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` в `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` в `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за граничною ланкою
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
```
