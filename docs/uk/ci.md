---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T19:12:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 200ba554de3a82826b3bd1709455dc4709e03e3f994f821a7590b7337215babd
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                | Коли запускається                  |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області дії, змінені розширення та збирає маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                             | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                        | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для подальших завдань | Зміни, що стосуються Node          |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, такі як перевірки bundled/plugin-contract/protocol | Зміни, що стосуються Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки    | Зміни, що стосуються Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                             | Зміни, що стосуються Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, без каналів, bundled, contract і extension-етапів             | Зміни, що стосуються Node          |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                       | Коли виявлено зміни в розширеннях  |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, що стосуються Node          |
| `check-additional`               | Шарди для архітектури, меж, extension-surface guards, package-boundary і gateway-watch    | Зміни, що стосуються Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                      | Зміни, що стосуються Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для push з Node 22               | Зміни, що стосуються Node          |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                             | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                        | Зміни, що стосуються Python Skills |
| `checks-windows`                 | Windows-специфічні етапи тестування                                                       | Зміни, що стосуються Windows       |
| `macos-node`                     | Етап TypeScript-тестів на macOS з використанням спільних зібраних артефактів              | Зміни, що стосуються macOS         |
| `macos-swift`                    | Lint, збірка та тести Swift для застосунку macOS                                          | Зміни, що стосуються macOS         |
| `android`                        | Матриця збірки й тестування Android                                                       | Зміни, що стосуються Android       |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж почнуть виконуватися дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб подальші споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни в workflow CI перевіряють граф Node CI та lint workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформні етапи й надалі обмежені змінами у вихідному коді відповідної платформи.
Перевірки Windows Node обмежені поверхнями runtime, package, config і workflow; зміни лише в тестах залишаються на Linux Node-етапах, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними шардами тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, що стосуються інсталяції, пакування та контейнерів. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися знову, зберігаючи кеш BuildKit pnpm store, тому інсталяція все одно перевіряється без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому ж завданні, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформна область дії в CI: зміни в core production запускають перевірку типів core prod плюс core-тести, зміни лише в core tests запускають лише перевірку типів і тести core test, зміни в extension production запускають перевірку типів extension prod плюс extension-тести, а зміни лише в extension tests запускають лише перевірку типів і тести extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію до розширень, оскільки розширення залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних етапах test/channel.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести auto-reply reply розділяються за групою префіксів, а конфігурації agentic gateway/plugin розподіляються по наявних agentic Node-завданнях, які працюють лише з вихідним кодом, замість очікування зібраних артефактів. `check-additional` тримає разом package-boundary compile/canary і відокремлює це від runtime topology gateway/architecture; шард boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору побічних артефактів CI.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того ж ref також не завершується помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні помилки шардів, але не стають у чергу після того, як увесь workflow уже був витіснений новішим запуском.
Ключ concurrency для CI має версію (`CI-v3-*`), щоб «зомбі»-запуск на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски для main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди та агрегати `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight у install-smoke також використовує Ubuntu, розміщену на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Node-тестів Linux, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування для 32-vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local gate: changed typecheck/lint/tests by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
```
