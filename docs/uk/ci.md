---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T19:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8c90ba88b3b08f87407e3b1cd90c13b1a2b2b6cb3c0e23b4f4f367614c97cc2
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінювалися лише нерелевантні ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                | Коли запускається                   |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені межі, змінені розширення та будує маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                              | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                           | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні Node              |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, такі як перевірки bundled/plugin-contract/protocol         | Зміни, релевантні Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки     | Зміни, релевантні Node              |
| `checks-node-extensions`         | Повні тестові шарди bundled-plugin для всього набору розширень                             | Зміни, релевантні Node              |
| `checks-node-core-test`          | Шарди основних тестів Node, за винятком каналів, bundled, контрактних і extension-етапів   | Зміни, релевантні Node              |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                        | Коли виявлено зміни розширень       |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні Node              |
| `check-additional`               | Архітектурні перевірки, перевірки меж, extension-surface guards, package-boundary і шарди gateway-watch | Зміни, релевантні Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-тест використання пам’яті під час запуску                | Зміни, релевантні Node              |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для push із Node 22               | Зміни, релевантні Node              |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                 | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                  | Зміни, релевантні Python Skills     |
| `checks-windows`                 | Специфічні для Windows тестові етапи                                                       | Зміни, релевантні Windows           |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні macOS             |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                            | Зміни, релевантні macOS             |
| `android`                        | Матриця збірки й тестів Android                                                            | Зміни, релевантні Android           |

## Порядок швидкого завершення з помилкою

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань зі збирання артефактів і платформених матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж знаходиться в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені етапи залишаються прив’язаними до змін у вихідному коді відповідної платформи.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цей етап; нерелевантні зміни вихідного коду, plugin, install-smoke і лише тестові зміни залишаються на Linux Node-етапах, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт меж через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних встановленню, пакуванню та контейнерам. Його QR package smoke примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе ще перевіряє встановлення без повторного завантаження залежностей у кожному запуску. Його gateway-network e2e повторно використовує runtime-образ, зібраний раніше в межах цього завдання, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широкі платформені межі CI: зміни core production запускають core prod typecheck разом із core tests, зміни лише core test запускають тільки core test typecheck/tests, зміни extension production запускають extension prod typecheck разом із extension tests, а зміни лише extension test запускають тільки extension test typecheck/tests. Зміни публічного Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки розширення залежать від цих контрактів core. Зміни лише в release metadata із підвищенням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх етапів.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства тестів Node розбиті або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, auto-reply працює у вигляді трьох збалансованих worker замість шести крихітних, а agentic gateway/plugin configs розподілені по наявних source-only agentic Node-завданнях замість очікування на зібрані артефакти. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює її від runtime topology gateway/architecture роботи; шард boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання, а regression для gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторного збирання повного набору sidecar-артефактів CI.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref теж не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ concurrency для CI має версію (`CI-v5-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тому 8 vCPU коштували дорожче, ніж давали вигоди; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
