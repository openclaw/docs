---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T00:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f58ae3956a11133d5905a3b74b638c08a0d0533651ae3a6730f8c8b45ab34c44
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                  | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для залежних завдань | Зміни, що стосуються Node           |
| `checks-fast-core`               | Швидкі Linux-перевірки коректності, зокрема bundled/plugin-contract/protocol                 | Зміни, що стосуються Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel зі стабільним агрегованим результатом перевірки       | Зміни, що стосуються Node           |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin у всьому наборі extensions                              | Зміни, що стосуються Node           |
| `checks-node-core-test`          | Шардовані core Node тести, окрім channel, bundled, contract і extension lane                | Зміни, що стосуються Node           |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Коли виявлено зміни в extensions    |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, що стосуються Node           |
| `check-additional`               | Шарди для перевірок архітектури, меж, поверхні extension, меж пакетів і gateway-watch        | Зміни, що стосуються Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | Зміни, що стосуються Node           |
| `checks`                         | Решта Linux Node lane: тести channel і сумісність Node 22 лише для push                      | Зміни, що стосуються Node           |
| `check-docs`                     | Форматування документації, lint і перевірка зламаних посилань                                | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, що стосуються Python Skills  |
| `checks-windows`                 | Специфічні для Windows test lane                                                             | Зміни, що стосуються Windows        |
| `macos-node`                     | TypeScript test lane на macOS із використанням спільних зібраних артефактів                  | Зміни, що стосуються macOS          |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, що стосуються macOS          |
| `android`                        | Матриця збірки й тестів Android                                                              | Зміни, що стосуються Android        |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань зі збіркою артефактів і платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб залежні споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформені й runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни CI workflow перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформені lane залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Windows Node перевірки обмежені Windows-специфічними обгортками process/path, хелперами runner для npm/pnpm/UI, конфігурацією пакетного менеджера та поверхнями CI workflow, які запускають цю lane; не пов’язані зміни у вихідному коді, plugins, install-smoke і тести лишаються в Linux Node lane, щоб не займати Windows worker із 16 vCPU для покриття, яке вже забезпечують звичайні test shard.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тож Docker/install smoke запускається лише для змін, пов’язаних з install, packaging і контейнерами. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож інсталяція все одно перевіряється без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тому додає реальне покриття WebSocket між контейнерами, не додаючи ще однієї Docker-збірки. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із тайм-аутом команди 120 секунд: відновлення залежностей setup-entry плюс ізоляція синтетичних збоїв bundled-loader. Повна матриця оновлення bundled і channel лишається ручною/для повного набору, бо вона виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка CI-область платформ: зміни в core production запускають core prod typecheck плюс core тести, зміни лише в core test запускають лише core test typecheck/tests, зміни в extension production запускають extension prod typecheck плюс extension тести, а зміни лише в extension test запускають лише extension test typecheck/tests. Зміни в public Plugin SDK або plugin-contract розширюють перевірку на extensions, тому що extensions залежать від цих core-контрактів. Зміни лише в release metadata version bump запускають точкові перевірки version/config/root-dependency. Невідомі зміни в root/config із міркувань безпеки запускають усі lane.

Для push матриця `checks` додає lane `compat-node22`, яка запускається лише для push. Для pull request ця lane пропускається, і матриця зосереджується на звичайних test/channel lane.

Найповільніші сімейства Node тестів розділені або збалансовані так, щоб кожне завдання лишалося невеликим: контракти channel розділяють registry і core coverage загалом на шість зважених shard, тести bundled plugin збалансовані між шістьма extension worker, auto-reply працює як три збалансовані worker замість шести крихітних worker, а конфігурації agentic gateway/plugin розподілені між наявними agentic Node jobs лише для source, а не очікують зібраних артефактів. Широкі browser, QA, media і miscellaneous тести plugin використовують свої окремі конфігурації Vitest замість спільного універсального набору plugin. Широка agents lane використовує спільний файлово-паралельний планувальник Vitest, тому що в ній домінують import/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime shard не залишався найдовшим. `check-additional` тримає разом compile/canary роботу для package-boundary і відокремлює її від runtime topology gateway/architecture; shard boundary guard виконує свої невеликі незалежні guard паралельно всередині одного завдання, а regression для gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної повної збірки набору sidecar-артефактів CI.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується збоєм. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shard, але не ставали в чергу після того, як увесь workflow уже було замінено новішим.
Ключ concurrency CI має версію (`CI-v6-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, shard `check`, окрім lint, shard і агрегати `check-additional`, агреговані верифікатори Node тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; `preflight` для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard Linux Node тестів, shard тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, так що 8 vCPU коштували дорожче, ніж давали вигоди; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                        |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за lane меж
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate із вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі lane CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі й найповільніші завдання
```
