---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T00:25:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff20444a58e039b3a036d3b7413afb142b306eb28fd49375bc2ddb3484e8cd06
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного пушу в `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                | Коли запускається                    |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI | Завжди для недрафтових пушів і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                | Завжди для недрафтових пушів і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                            | Завжди для недрафтових пушів і PR    |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                          | Завжди для недрафтових пушів і PR    |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для залежних завдань | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, такі як перевірки bundled/plugin-contract/protocol        | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом              | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extensions                         | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди базових Node-тестів, без каналів, bundled, contract і extension-етапів              | Зміни, релевантні для Node           |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                           | Pull request зі змінами extensions   |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Архітектурні, межові, extension-surface guards, package-boundary і шардовані gateway-watch перевірки | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                        | Зміни, релевантні для Node           |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                 | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                   | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Windows-специфічні тестові етапи                                                          | Зміни, релевантні для Windows        |
| `macos-node`                     | Етап TypeScript-тестів на macOS із використанням спільних зібраних артефактів             | Зміни, релевантні для macOS          |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                           | Зміни, релевантні для macOS          |
| `android`                        | Матриця збірки і тестів Android                                                           | Зміни, релевантні для Android        |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж стартують дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи важчих завдань із артефактами та платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб залежні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю змін знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряє граф Node CI разом із linting workflow, але саме по собі не змушує запускати нативні збірки Windows, Android або macOS; ці платформені етапи залишаються прив’язаними до змін у коді відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними process/path wrappers, допоміжними засобами для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цей етап; не пов’язані зміни в source, plugin, install-smoke і лише тестах залишаються на Linux Node-етапах, щоб не займати 16-vCPU Windows worker заради покриття, яке вже забезпечують звичайні тестові шарди.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних для встановлення, пакування й контейнерів. Його smoke для QR package змушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому перевірка встановлення все одно виконується без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах цього завдання, тому додає реальне покриття WebSocket між контейнерами без ще однієї Docker-збірки. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із таймаутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичних збоїв bundled-loader. Повна матриця bundled update/channel залишається manual/full-suite, оскільки вона виконує повторювані реальні проходи npm update і doctor repair.

Логіка локальних changed-lanes знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка платформена область CI: зміни core production запускають core prod typecheck плюс core тести, зміни лише в core tests запускають лише core test typecheck/tests, зміни extension production запускають extension prod typecheck плюс extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Публічні зміни Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих core-контрактів. Зміни лише в метаданих релізу з підвищенням версії запускають точкові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх етапів.

Під час push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на шість зважених шардів загалом, bundled plugin tests балансуються між шістьма extension workers, auto-reply виконується на трьох збалансованих workers замість шести дрібних, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. Широкі browser, QA, media і miscellaneous plugin tests використовують свої окремі конфігурації Vitest замість спільного plugin catch-all. Широкий етап agents використовує спільний планувальник file-parallel у Vitest, оскільки в ньому домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime-шард не залишався найдовшим. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює її від runtime topology gateway/architecture роботи; шард boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.
`extension-fast` є лише для PR, оскільки під час push уже виконуються повні шарди bundled plugin. Це дає швидкий зворотний зв’язок щодо changed-plugin для рев’ю, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані шардовані перевірки використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні збої в шардах, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ concurrency у CI має версію (`CI-v6-*`), щоб GitHub-side zombie у старій групі черги не міг безстроково блокувати новіші запуски для main.

## Runners

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди bundled plugin tests, решта споживачів built-artifacts, `android`                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали економію; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lanes для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
