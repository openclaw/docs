---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T19:41:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10f3e1cf27e9f02e1a1a22159c93d6a205f5ccfbcce25184f7e8349c5cd31692
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається на кожен push до `main` і на кожен pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для недрафтових push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                | Завжди для недрафтових push і PR    |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR    |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, наприклад bundled/plugin-contract/protocol checks  | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, окрім етапів каналів, bundled, contract та extension             | Зміни, релевантні для Node          |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Коли виявлено зміни в розширеннях   |
| `check`                          | Шардований еквівалент основного локального етапу перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Архітектурні перевірки, перевірки меж, guards поверхні розширень, package-boundary і шарди gateway-watch | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час старту                           | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для push з Node 22                  | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Коли змінено документацію           |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні етапи тестування                                                          | Зміни, релевантні для Windows       |
| `macos-node`                     | Етап TypeScript-тестів на macOS з використанням спільних зібраних артефактів                 | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS         |
| `android`                        | Матриця збірки й тестування Android                                                          | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань з артефактами та платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли почати роботу щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють граф Node CI разом із lint для workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформені етапи й надалі обмежуються змінами у вихідному коді відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними обгортками для процесів і шляхів, допоміжними засобами npm/pnpm/UI runner, конфігурацією пакетного менеджера та поверхнями workflow CI, які запускають цей етап; не пов’язані зміни у вихідному коді, plugins, install-smoke і тести залишаються в Linux Node-етапах, щоб не резервувати 16-vCPU Windows-воркер для покриття, яке вже виконується звичайними шардами тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей через власне завдання `preflight`. Він обчислює `run_install_smoke` за вужчим сигналом changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому перевірка встановлення все одно виконується без повторного завантаження залежностей на кожному запуску. Його gateway-network e2e повторно використовує runtime-образ, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний етап суворіший щодо архітектурних меж, ніж широка платформена область CI: зміни в production-частині ядра запускають typecheck production-коду ядра плюс тести ядра, зміни лише в тестах ядра запускають лише typecheck/tests тестів ядра, зміни в production-частині розширень запускають typecheck production-коду розширень плюс тести розширень, а зміни лише в тестах розширень запускають лише typecheck/tests тестів розширень. Зміни у публічному Plugin SDK або plugin-contract розширюють валідацію до розширень, бо розширення залежать від цих контрактів ядра. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх етапів.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних тестових етапах і етапах каналів.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести auto-reply reply розділяються за групами префіксів, а agentic gateway/plugin configs розподіляються по наявних source-only agentic Node-завданнях замість очікування на зібрані артефакти. `check-additional` тримає разом package-boundary compile/canary-роботи та відокремлює їх від runtime topology gateway/architecture-робіт; шард boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторного збирання повного набору sidecar-артефактів CI.

GitHub може позначати замінені новішим запуском завдання як `cancelled`, коли на той самий PR або ref `main` надходить новий push. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані шардовані перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже було замінено новішим.
Ключ конкурентності CI має версію (`CI-v4-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати нові запуски main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, керований GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували більше, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний етап: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний етап: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий етап із вимірюванням часу для кожної стадії
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
