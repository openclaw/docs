---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T16:20:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f98b197d68ed7991ca42b062026dc49d478b3d809c4660db7c698a587ee42523
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне обмеження області змін, щоб пропускати дорогі завдання, коли змінено лише нерелевантні частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                  | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                            | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, як-от перевірки bundled/plugin-contract/protocol            | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                            | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шардовані тести core Node, без ланок каналів, bundled, contract і extension                 | Зміни, релевантні для Node         |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugin                                          | Коли виявлено зміни розширень      |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, меж, guards поверхні розширень, package-boundary і gateway-watch         | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                             | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node-ланок: тести каналів і сумісність Node 22 лише для push                    | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірка зламаних посилань                               | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                     | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові ланки                                                        | Зміни, релевантні для Windows      |
| `macos-node`                     | Ланка тестів TypeScript на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                             | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки й тестів Android                                                             | Зміни, релевантні для Android      |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних інсталяції, пакуванню та контейнерам.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широка платформна область CI: зміни в core production запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для core test, зміни в extension production запускають typecheck extension prod плюс тести розширень, а зміни лише в тестах extension запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на розширення, оскільки розширення залежать від цих контрактів core. Підвищення версії лише в release metadata запускає точкові перевірки version/config/root-dependency. Невідомі зміни в root/config у безпечному режимі розширюються на всі ланки.

Для push матриця `checks` додає ланку `compat-node22`, яка запускається лише для push. Для pull request цю ланку пропускають, і матриця залишається зосередженою на звичайних тестових/канальних ланках.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів ділять покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply поділено на чотири шарди за include-pattern, інші великі групи префіксів відповіді auto-reply поділено на два шарди кожна, а конфігурації agentic gateway розподілено по наявних завданнях agentic Node замість одного послідовного хвоста. `check-additional` також відокремлює compile/canary-роботу package-boundary від topology-роботи gateway/architecture у runtime.

GitHub може позначати витіснені новішим запуском завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard, але не стають у чергу, якщо весь workflow уже був витіснений.
Ключ concurrency для CI має версію (`CI-v2-*`), тож zombie-процес на боці GitHub у старій групі черги не зможе безстроково блокувати новіші запуски main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, короткі агреговані завдання-перевірники (`security-fast`, `check`, `check-additional`, `checks-fast-contracts-channels`), workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `build-artifacts`, Linux-перевірки, крім `check-lint`, агреговані перевірники довгих матриць, перевірки документації, Python Skills, `android`                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж давали вигоди                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary-ланкою
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
```
