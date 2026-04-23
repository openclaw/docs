---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T00:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d19801199a102291045bf2b2f7d9a66495c23785a1e89a953af8969e52fc0cb
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному пуші в `main` і для кожного pull request. Він використовує розумне обмеження області дії, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані ділянки.

## Огляд завдань

| Завдання                          | Призначення                                                                                | Коли запускається                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| `preflight`                       | Виявлення змін лише в документації, змінених областей, змінених розширень і побудова маніфесту CI | Завжди для нечернеткових пушів і PR  |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                | Завжди для нечернеткових пушів і PR  |
| `security-dependency-audit`       | Аудит production lockfile без залежностей на відповідність попередженням npm              | Завжди для нечернеткових пушів і PR  |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                           | Завжди для нечернеткових пушів і PR  |
| `build-artifacts`                 | Збірка `dist/` і Control UI один раз, завантаження повторно використовуваних артефактів для наступних завдань | Зміни, що стосуються Node            |
| `checks-fast-core`                | Швидкі Linux-етапи перевірки коректності, такі як bundled/plugin-contract/protocol checks  | Зміни, що стосуються Node            |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки     | Зміни, що стосуються Node            |
| `checks-node-extensions`          | Повні шарди тестів bundled-plugin для всього набору розширень                              | Зміни, що стосуються Node            |
| `checks-node-core-test`           | Шарди основних Node-тестів, за винятком етапів каналів, bundled, contract і extension      | Зміни, що стосуються Node            |
| `extension-fast`                  | Цільові тести лише для змінених bundled plugins                                            | Pull request із змінами в розширеннях |
| `check`                           | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, що стосуються Node            |
| `check-additional`                | Шарди архітектурних перевірок, перевірок меж, extension-surface guards, package-boundary і gateway-watch | Зміни, що стосуються Node            |
| `build-smoke`                     | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                         | Зміни, що стосуються Node            |
| `checks`                          | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                  | Зміни, що стосуються Node            |
| `check-docs`                      | Перевірки форматування документації, lint і перевірка битих посилань                       | Змінено документацію                 |
| `skills-python`                   | Ruff + pytest для Skills на Python                                                          | Зміни, що стосуються Python Skills   |
| `checks-windows`                  | Windows-специфічні етапи тестування                                                         | Зміни, що стосуються Windows         |
| `macos-node`                      | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів              | Зміни, що стосуються macOS           |
| `macos-swift`                     | Swift lint, збірка і тести для застосунку macOS                                             | Зміни, що стосуються macOS           |
| `android`                         | Матриця збірки і тестів Android                                                             | Зміни, що стосуються Android         |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих артефактних і платформних матричних завдань.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із lint для workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні етапи й надалі обмежуються змінами у вихідних кодах відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цей етап; не пов’язані зміни вихідного коду, plugin, install-smoke та зміни лише тестів залишаються на Linux Node-етапах, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з установленням, пакуванням, контейнерами, production-змін bundled extension, а також для поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише тестів і лише документації не резервують Docker workers. Його QR package smoke примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи при цьому кеш сховища BuildKit pnpm, тож він усе одно перевіряє встановлення без повторного завантаження залежностей у кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тому додає реальне покриття WebSocket між контейнерами, не додаючи ще одну Docker-збірку. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна матриця оновлень bundled і каналів залишається ручною/для повного набору, оскільки вона виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка область дії платформ у CI: production-зміни core запускають core prod typecheck плюс core tests, зміни лише core tests запускають лише core test typecheck/tests, production-зміни extension запускають extension prod typecheck плюс extension tests, а зміни лише extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension, тому що розширення залежать від цих core-контрактів. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі етапи.

Під час push матриця `checks` додає етап `compat-node22`, який виконується лише для push. У pull request цей етап пропускається, і матриця лишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання лишалося невеликим: контракти каналів розділяють покриття registry і core загалом на шість зважених шардів, тести bundled plugin збалансовані між шістьма workers для extension, auto-reply виконується як три збалансовані workers замість шести крихітних workers, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. Широкі browser, QA, media і miscellaneous plugin tests використовують свої окремі конфігурації Vitest замість спільного універсального набору plugin-тестів. Широкий етап agents використовує спільний file-parallel scheduler у Vitest, оскільки в ньому домінують імпорт і планування, а не один повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime-shard не тягнув хвіст виконання. `check-additional` тримає разом compile/canary-роботи для package-boundary і відокремлює їх від gateway/architecture-робіт runtime topology; шард boundary guard виконує свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної повної перебудови всього набору sidecar-артефактів CI.
`extension-fast` існує лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це дає швидкий зворотний зв’язок щодо змінених plugin під час рев’ю, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардiв, але не стають у чергу після того, як увесь workflow уже було замінено новішим.
Ключ concurrency у CI має версію (`CI-v6-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати нові запуски main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди та агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, решта споживачів built-artifact, `android`                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і надалі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU була вищою за виграш                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
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
