---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі застосування шлюзів і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T21:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5e620ed273ff8532186081c7876590a816e31d8e27571a2871f1de48436bfe
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push у `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені межі, змінені розширення та збирає маніфест CI   | Завжди для нечернеткових push і PR  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі advisory npm                             | Завжди для нечернеткових push і PR  |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR  |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, пов’язані з Node             |
| `checks-fast-core`               | Швидкі Linux-доріжки коректності, як-от перевірки bundled/plugin-contract/protocol           | Зміни, пов’язані з Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, пов’язані з Node             |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, пов’язані з Node             |
| `checks-node-core-test`          | Шарди тестів core Node, без доріжок каналів, bundled, контрактів і розширень                 | Зміни, пов’язані з Node             |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugin                                               | Коли виявлено зміни розширень       |
| `check`                          | Шардований еквівалент основного локального шлюзу: production-типи, lint, guards, test types і суворий smoke | Зміни, пов’язані з Node             |
| `check-additional`               | Архітектура, межі, guards поверхні розширень, межі пакетів і шарди gateway-watch             | Зміни, пов’язані з Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                           | Зміни, пов’язані з Node             |
| `checks`                         | Решта Linux Node-доріжок: тести каналів і сумісність Node 22 лише для push                   | Зміни, пов’язані з Node             |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, пов’язані з Python Skills    |
| `checks-windows`                 | Специфічні для Windows тестові доріжки                                                       | Зміни, пов’язані з Windows          |
| `macos-node`                     | Доріжка TypeScript-тестів на macOS із використанням спільних зібраних артефактів             | Зміни, пов’язані з macOS            |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, пов’язані з macOS            |
| `android`                        | Матриця збірки й тестів Android                                                              | Зміни, пов’язані з Android          |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж почнуть виконуватися дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань артефактів і платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення меж розміщена в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні доріжки залишаються прив’язаними до змін у вихідному коді платформи.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями workflow CI, які запускають цю доріжку; не пов’язані зміни у вихідному коді, plugin, install-smoke і лише тестах залишаються на Linux Node-доріжках, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення меж через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних з інсталяцією, пакуванням і контейнерами. Його QR package smoke примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit для pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей у кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широке платформне визначення меж у CI: зміни в production core запускають перевірку типів core prod плюс тести core, зміни лише в тестах core запускають тільки перевірку типів/тести core test, зміни в production розширень запускають перевірку типів extension prod плюс тести розширень, а зміни лише в тестах розширень запускають тільки перевірку типів/тести extension test. Зміни в публічному Plugin SDK або plugin-contract розширюються до валідації розширень, оскільки розширення залежать від цих контрактів core. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переводять виконання на всі доріжки.

Для push матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request ця доріжка пропускається, і матриця зосереджується на звичайних test/channel-доріжках.

Найповільніші сімейства Node-тестів поділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів ділять покриття registry і core на вісім зважених shard для кожного, тести bundled plugin балансовано розподіляються між шістьма extension worker, auto-reply виконується як три збалансовані worker замість шести дрібних worker, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. `check-additional` тримає compile/canary-роботи для меж пакетів разом і відокремлює їх від gateway/architecture-робіт топології runtime; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони й далі повідомляли про звичайні збої shard, але не ставали в чергу після того, як увесь workflow уже було замінено.
Ключ concurrency CI версіонується (`CI-v6-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агрегатні верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщену на GitHub, щоб матриця Blacksmith могла потрапити в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, решта споживачів built-artifact, `android`                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж заощаджував                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
```
