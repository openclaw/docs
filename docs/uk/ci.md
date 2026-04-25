---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-25T00:01:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03105fd06cf6a913ef0fb8cbe84c64ed89edbc09652f347b4508552a2f33bb71
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

QA Lab має окремі доріжки CI поза основним workflow з розумним обмеженням за областю змін. Workflow `Parity gate` запускається для відповідних змін у PR і через manual dispatch; він збирає приватне середовище виконання QA і порівнює agentic packs mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує Convex leases. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників, призначений для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільну пов’язану issue, або перетин змінених hunk-ів.

Workflow `Docs Agent` — це подієва доріжка обслуговування Codex для підтримання наявної документації у відповідності до нещодавно злитих змін. Він не має чистого розкладу: його може запустити успішний неблокований push CI на `main`, а manual dispatch може запускати його безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже пішла вперед або якщо інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, то переглядає діапазон комітів від попереднього вихідного SHA непропущеного Docs Agent до поточної `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це подієва доріжка обслуговування Codex для повільних тестів. Він не має чистого розкладу: його може запустити успішний неблокований push CI на `main`, але він пропускається, якщо інший виклик через workflow-run уже виконався або виконується того ж дня за UTC. Manual dispatch обходить цю добову перевірку активності. Доріжка будує звіт продуктивності Vitest для повного набору тестів із групуванням, дозволяє Codex вносити лише невеликі правки продуктивності тестів без зниження покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, що зменшують кількість тестів базової лінії, які проходять. Якщо в базовій лінії є тести зі збоями, Codex може виправляти лише очевидні проблеми, а підсумковий звіт для повного набору після роботи агента має пройти повністю, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде злитий, доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених extensions і побудова маніфесту CI | Завжди для недрафтових push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для недрафтових push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR     |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і багаторазово використовувані downstream-артефакти | Зміни, пов’язані з Node              |
| `checks-fast-core`               | Швидкі Linux-доріжки перевірки коректності, як-от bundled/plugin-contract/protocol checks    | Зміни, пов’язані з Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, пов’язані з Node              |
| `checks-node-extensions`         | Шардовані тести повного набору bundled-plugin для всього набору extensions                   | Зміни, пов’язані з Node              |
| `checks-node-core-test`          | Шарди базових Node-тестів, без доріжок channel, bundled, contract і extension                | Зміни, пов’язані з Node              |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Pull request із змінами в extensions |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node              |
| `check-additional`               | Архітектура, перевірки меж, extension-surface guards, package-boundary і шардовані gateway-watch | Зміни, пов’язані з Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест використання пам’яті під час запуску                  | Зміни, пов’язані з Node              |
| `checks`                         | Верифікатор для тестів каналів на зібраних артефактах плюс сумісність Node 22 лише для push  | Зміни, пов’язані з Node              |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Якщо змінено документацію            |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, пов’язані з Python Skills     |
| `checks-windows`                 | Специфічні для Windows доріжки тестування                                                    | Зміни, пов’язані з Windows           |
| `macos-node`                     | Доріжка тестів TypeScript на macOS із використанням спільних зібраних артефактів             | Зміни, пов’язані з macOS             |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, пов’язані з macOS             |
| `android`                        | Модульні тести Android для обох flavor плюс одна збірка debug APK                            | Зміни, пов’язані з Android           |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх CI в main або manual dispatch  |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи важчих завдань артефактів і платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю змін міститься в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI і lint workflow, але самі по собі не примушують виконувати нативні збірки для Windows, Android або macOS; ці платформні доріжки й надалі обмежуються змінами у вихідному коді відповідних платформ.
Перевірки Windows Node обмежені специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями workflow CI, які запускають цю доріжку; не пов’язані зміни у вихідному коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними шардованими тестами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт обмеження за областю через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest у bundled plugins і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують завдання Docker smoke. Зміни лише у вихідному коді bundled plugins, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, manual dispatch, workflow-call release checks і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не примушують виконувати повний шлях; коли логіка changed-scope намагалася б запросити повне покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke — для нічної або релізної валідації. Повільний smoke для глобальної інсталяції Bun image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а manual dispatch `install-smoke` може явно його ввімкнути, але pull request і push до `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний агрегат `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes зі зваженим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; стандартну кількість слотів основного пулу, рівну 10, можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, теж рівну 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких доріжок за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і multi-service не перевантажували Docker, поки легші доріжки все ще заповнюють доступні слоти. Запуски доріжок за замовчуванням зсуваються на 2 секунди, щоб уникнути локальних сплесків create-операцій Docker daemon; це можна змінити через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних доріжок, зберігає таймінги доріжок для впорядкування за принципом longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перегляду роботи планувальника. За замовчуванням він припиняє планувати нові об’єднані доріжки після першої помилки, і кожна доріжка має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; для окремих live/tail-доріжок використовуються жорсткіші індивідуальні обмеження. Багаторазово використовуваний workflow live/E2E віддзеркалює шаблон спільного image, збираючи й публікуючи один SHA-позначений GHCR Docker E2E image перед Docker matrix, а потім запускаючи matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір за релізним шляхом. Матриця bundled update розділена за ціллю оновлення, щоб повторювані проходи npm update і doctor repair могли шардитися разом з іншими bundled checks.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіше ставиться до архітектурних меж, ніж широка платформна область CI: зміни в production-частині core запускають typecheck production core плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, зміни в production-частині extension запускають typecheck production extension плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію до extensions, оскільки extensions залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config за принципом fail-safe запускають усі доріжки.

Для push матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request цю доріжку пропускають, і матриця зосереджується на звичайних доріжках test/channel.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три зважені shard-и, тести bundled plugin розподіляються між шістьма worker-ами extensions, невеликі core unit lanes поєднуються в пари, auto-reply виконується трьома збалансованими worker-ами замість шести дрібних worker-ів, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування зібраних артефактів. Широкі browser-, QA-, media- і miscellaneous plugin-тести використовують свої спеціалізовані конфігурації Vitest замість спільного універсального набору plugin-тестів. Завдання shard-ів extension запускають до двох груп конфігурацій plugin одночасно з одним worker-ом Vitest на групу і збільшеним heap Node, щоб пакети plugin-ів із великим обсягом імпортів не створювали додаткових завдань CI. Широка доріжка agents використовує спільний file-parallel scheduler Vitest, оскільки для неї домінують імпорти/планування, а не один окремий повільний тестовий файл. `runtime-config` виконується разом із shard-ом infra core-runtime, щоб спільний runtime-shard не залишався найдовшим у хвості. `check-additional` тримає разом package-boundary compile/canary-роботи й відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard паралельно запускає свої невеликі незалежні guards усередині одного завдання. Gateway watch, тести каналів і shard меж підтримки core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори й водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його доріжка unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK для кожного push, що стосується Android.
`extension-fast` призначено лише для PR, тому що push-запуски вже виконують повні shard-и bundled plugin. Це дає швидкий зворотний зв’язок щодо змінених plugin-ів під час review, не резервуючи додаткового Blacksmith worker-а на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні помилки shard-ів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ конкурентності CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard-и `check`, крім lint, shard-и й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node-тестів, shard-и тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж зекономили; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU була вищою за вигоду                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
