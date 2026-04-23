---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, гейти за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T17:53:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1de796d57e79eda0328f20172f9029af485a57a3996bc8615e3a7bce281b7d85
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push у `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

QA Lab має окремі гілки CI поза основним workflow з розумним визначенням області змін. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватний runtime QA і порівнює агентні пакети mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгалужує mock parity gate, live lane Matrix і live lane Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а lane Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі lane QA Lab перед погодженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно вказані PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злитий PR справді об’єднано і що кожен дублікат має або спільну згадану issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, області змін, змінені extensions і будує CI-маніфест    | Завжди для push і PR не в draft     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в draft     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для push і PR не в draft     |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR не в draft     |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і перевикористовувані downstream-артефакти | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux lane коректності, як-от bundled/plugin-contract/protocol перевірки              | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                 | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled plugin у всьому наборі extensions                                 | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди core Node тестів, окрім lane каналів, bundled, контрактів і extensions                 | Зміни, релевантні для Node          |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugin                                           | Pull request зі змінами в extensions |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Архітектурні, boundary, guards поверхні extensions, package-boundary і shard gateway-watch   | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час старту                           | Зміни, релевантні для Node          |
| `checks`                         | Верифікатор для built-artifact тестів каналів плюс lane сумісності Node 22 лише для push     | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено docs                        |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows lane тестів                                                           | Зміни, релевантні для Windows       |
| `macos-node`                     | Lane TypeScript тестів на macOS з використанням спільних built artifacts                     | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS         |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK збірка                                | Зміни, релевантні для Android       |

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих artifact- і platform-matrix-завдань.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі platform і runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін живе в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування CI workflow перевіряє Node CI graph разом із lint перевіркою workflow, але саме по собі не примушує запускати нативні збірки Windows, Android або macOS; ці platform lane залишаються прив’язаними до змін у platform source.
Перевірки Windows Node прив’язані до специфічних для Windows обгорток process/path, helper-ів npm/pnpm/UI runner, конфігурації package manager і поверхонь CI workflow, які запускають цей lane; непов’язані зміни в source, plugin, install-smoke і лише тестові зміни залишаються в Linux Node lane, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже забезпечують звичайні шарди тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` з вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з install, packaging, контейнерами, production changes у bundled extension, а також для поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Лише тестові та лише docs-редагування не резервують Docker workers. Його QR package smoke примушує шар Docker `pnpm install` виконатися повторно, зберігаючи cache сховища BuildKit pnpm, тому інсталяція все одно перевіряється без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах цього завдання, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локально `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lane паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; стандартний рівень паралелізму 4 можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор за замовчуванням припиняє планувати нові pooled lane після першої помилки, а кожен lane має таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane, чутливі до startup або provider, запускаються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E віддзеркалює шаблон shared-image: він збирає і пушить один Docker E2E image у GHCR з тегом SHA перед Docker matrix, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний релізний Docker suite. Docker-тести QR та installer зберігають власні install-орієнтовані Dockerfile. Окреме завдання `docker-e2e-fast` запускає обмежений Docker profile для bundled plugin з таймаутом команди 120 секунд: repair залежностей setup-entry плюс синтетична ізоляція збоїв bundled-loader. Повна matrix оновлення bundled і каналів залишається manual/full-suite, тому що вона виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних boundary, ніж широка CI-область платформ: зміни в core production запускають core prod typecheck плюс core тести, лише зміни в core tests запускають лише core test typecheck/tests, зміни в extension production запускають extension prod typecheck плюс extension тести, а лише зміни в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, тому що extensions залежать від цих core-контрактів. Зміни лише в release metadata для version bump запускають точкові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх lane.

Для push matrix `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, а matrix залишається зосередженою на звичайних test/channel lane.

Найповільніші сімейства Node тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів запускаються у трьох зважених shard, тести bundled plugin збалансовані між шістьма workers для extensions, невеликі core unit lane об’єднано попарно, auto-reply запускається в трьох збалансованих workers замість шести дрібних, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin тести використовують свої окремі конфігурації Vitest замість спільного універсального plugin-набору. Широкий lane agents використовує спільний file-parallel scheduler Vitest, тому що в ньому домінують імпорт і планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard infra core-runtime, щоб спільний runtime shard не залишався найдовшим. `check-additional` тримає разом роботу package-boundary compile/canary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, тести каналів і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи їхні попередні назви перевірок як легкі завдання-верифікатори, водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane unit-тестів усе одно компілює цей flavor з прапорами SMS/call-log у BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK під час кожного Android-релевантного push.
`extension-fast` запускається лише для PR, тому що push-запуски вже виконують повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugin для review, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені новішими запусками завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref теж не падає. Агреговані shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні помилки shard, але не стають у чергу після того, як увесь workflow уже було замінено новішим.
Ключ concurrency у CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard `check`, окрім lint, shard `check-additional` і агрегати, aggregate verifier-и Node тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; `preflight` для install-smoke також використовує GitHub-hosted Ubuntu, щоб matrix Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard Node тестів на Linux, shard тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж заощаджував                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                 |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: typecheck/lint/tests для змін за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # зібрати dist, коли важливі CI lane artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час очікування в черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти останні успішні запуски main CI
```
