---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, які не пройшли
summary: Граф завдань CI, шлюзи областей і локальні еквіваленти команд
title: пайплайн CI
x-i18n:
    generated_at: "2026-04-28T00:03:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d9fabbc0980661076f4b0187dda4ac682b2361943266c7ec85a8cf38796299a
    source_path: ci.md
    workflow: 15
---

Пайплайн CI запускається при кожному пуші в `main` і для кожного pull request. Він використовує розумне визначення області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` з цією ціллю, а також запускає `OpenClaw Release Checks`
для smoke-перевірки встановлення, приймання пакетів, наборів Docker на шляху релізу, live/E2E,
OpenWebUI, паритету QA Lab, Matrix і Telegram lane. Він також може запускати
workflow `NPM Telegram Beta E2E` після публікації, якщо надано специфікацію
опублікованого пакета. Umbrella workflow записує ідентифікатори запущених дочірніх run, а фінальне
завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run. Якщо
дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання верифікації, щоб
оновити результат umbrella workflow.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для всіх дочірніх перевірок релізу
або вужчу групу релізу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella workflow. Це допомагає
обмежити повторний запуск невдалого релізного бокса після точкового виправлення.

Дочірній live/E2E workflow релізу зберігає широке native-покриття `pnpm test:live`, але
виконує його як іменовані shard (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai` і розділені media shard для audio/music/video) через
`scripts/test-live-shard.mjs` замість одного послідовного завдання. Це зберігає те саме
покриття файлів і водночас полегшує повторний запуск і діагностику повільних live-збоїв provider. Агреговані назви shard
`native-live-extensions-o-z` і
`native-live-extensions-media` залишаються валідними для ручних одноразових повторних запусків.

`Package Acceptance` — це побічний workflow для перевірки артефакта пакета
без блокування workflow релізу. Він визначає одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного з вибраним
harness `workflow_ref`, HTTPS tarball URL із SHA-256 або артефакта tarball
з іншого run GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує
планувальник Docker release/E2E з цим tarball замість повторного пакування checkout
workflow. Профілі охоплюють smoke, package, product, full і власний вибір Docker lane. Профіль
`package` використовує offline-покриття Plugin, тож перевірка опублікованого пакета
не блокується доступністю live ClawHub. Необов’язковий lane Telegram повторно використовує
артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
опублікованої npm-специфікації зберігається для окремих dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей
встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI
перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через
той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить джерело, workflow ref, package
   ref, версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує
   цей артефакт, перевіряє інвентар tarball, за потреби готує package-digest
   Docker image і запускає вибрані Docker lane для цього пакета замість пакування
   checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow
   готує пакет і спільні image один раз, а потім розгортає ці lane як
   паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`,
   якщо Package Acceptance його визначив; окремий dispatch Telegram
   усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow помилкою, якщо не вдалося визначити пакет, не пройшло Docker-приймання або
   необов’язковий lane Telegram завершився помилкою.

Джерела кандидата:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  перевірки опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілок репозиторію або тега релізу, встановлює залежності у
  detached worktree і пакує їх за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для
  артефактів, якими діляться зовні.

Розділяйте `workflow_ref` і `package_ref`. `workflow_ref` — це довірений код
workflow/harness, який запускає тест. `package_ref` — це коміт вихідного коду,
який пакується, коли `source=ref`. Це дозволяє поточному test harness перевіряти
старі довірені коміти вихідного коду без запуску старої логіки workflow.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker-chunk шляху релізу з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker-chunk
шляху релізу покривають lane пакета/оновлення/Plugin, що перетинаються, тоді як Package
Acceptance зберігає нативну для артефакта перевірку bundled-channel compat, offline Plugin і
доказ Telegram на основі того самого визначеного tarball пакета.
Cross-OS перевірки релізу й надалі покривають специфічну для ОС поведінку onboarding, інсталятора й платформи;
валідацію продукту пакета/оновлення слід починати з Package
Acceptance. Windows lane із пакетом та інсталятором для чистого встановлення також перевіряють, що
встановлений пакет може імпортувати override browser-control із сирого абсолютного шляху Windows.

Package Acceptance має обмежене вікно legacy-сумісності для вже
опублікованих пакетів до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці
допуски задокументовано тут, щоб вони не перетворилися на постійні тихі пропуски:
відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть давати
попередження, якщо в tarball не було цих файлів; `doctor-switch` може пропустити
підвипадок збереження `gateway install --wrapper`, якщо пакет не надає
цей прапорець; `update-channel-switch` може відсікати відсутні
`pnpm.patchedDependencies` із tarball-похідного фальшивого git fixture і може логувати відсутній збережений
`update.channel`; smoke-перевірки Plugin можуть читати legacy-розташування install-record або
приймати відсутність збереження install-record marketplace; а `plugin-update` може
дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і
поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25` мають відповідати
сучасним контрактам; ті самі умови призводять до помилки, а не до попередження чи пропуску.

Приклади:

```bash
# Перевірити поточний beta-пакет із покриттям рівня product.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Запакувати й перевірити гілку релізу з поточним harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Перевірити tarball URL. Для source=url SHA-256 є обов’язковим.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Повторно використати tarball, завантажений іншим run Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Під час налагодження невдалого run package acceptance починайте з
summary `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте
дочірній run `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane, phase
timings і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або
точних Docker lane замість повторного запуску повної валідації релізу.

QA Lab має виділені CI lane поза основним workflow із розумним визначенням області. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному dispatch; він
збирає приватний runtime QA і порівнює agentic pack mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі для `main` і при
ручному dispatch; він розгортає mock parity gate, live lane Matrix і live
lane Telegram та Discord як паралельні завдання. Live-завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують lease Convex. Matrix
використовує `--profile fast` для scheduled і release gate, додаючи `--fail-fast` лише
коли checked-out CLI це підтримує. Значення CLI за замовчуванням і ручний ввід workflow
залишаються `all`; ручний dispatch `matrix_profile=all`
завжди розбиває повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критично важливі для релізу lane QA Lab перед затвердженням релізу; його QA parity
gate запускає lane кандидатного й базового pack як паралельні завдання, а потім завантажує
обидва артефакти в невелике завдання звіту для фінального порівняння паритету.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після приземлення. За замовчуванням він працює в режимі dry-run і
закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він
перевіряє, що приземлений PR уже злитий і що кожен дублікат має або спільне посилання на issue,
або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким сканером першого проходу, а не
повним охопленням репозиторію. Щоденні та ручні запуски сканують код workflow Actions і
поверхні JavaScript/TypeScript з найвищим ризиком, пов’язані з auth, секретами, sandbox,
Cron і Gateway. Критично важливий безпековий lane використовує високоточні security query, а
окремий critical quality lane запускає лише non-security query з рівнем error
для тієї самої вузької поверхні JavaScript/TypeScript. Розширення CodeQL на
Swift, Android, Python, UI та bundled Plugin слід повертати лише як
обмежену за областю або шардовану подальшу роботу після того, як вузький профіль матиме стабільний час виконання й корисний сигнал.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримання
наявної документації у відповідності до нещодавно приземлених змін. Він не має окремого запуску за розкладом:
його може запустити успішний run CI після пушу в `main`, якщо він не від бота,
а також його можна запустити напряму через ручний dispatch. Виклики через workflow-run пропускаються,
якщо `main` уже пішов далі або якщо інший непропущений run Docs Agent було створено
за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього
непропущеного вихідного SHA Docs Agent до поточного `main`, тож один щогодинний run
може охопити всі зміни в main, накопичені з моменту останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex
для повільних тестів. Він не має окремого запуску за розкладом: його може запустити
успішний run CI після пушу в `main`, якщо він не від бота, але він пропускається,
якщо інший виклик через workflow-run уже виконався або виконується в ту саму добу UTC.
Ручний dispatch обходить цей денний шлюз активності. Lane будує
згрупований звіт про продуктивність повного набору Vitest, дозволяє Codex
вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів,
потім повторно запускає звіт повного набору і відхиляє зміни, які зменшують
базову кількість тестів, що проходять. Якщо в базовому стані є тести, що не проходять, Codex
може виправляти лише очевидні збої, а звіт повного набору після роботи агента
має пройти до того, як щось буде закомічено. Коли `main` просувається далі до того, як пуш бота буде приземлено,
lane ребейзить перевірений патч, повторно запускає `pnpm check:changed` і
повторює спробу пушу; конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu,
щоб дія Codex могла зберігати ту саму безпечну поставу drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених extensions і побудова маніфесту CI | Завжди для push і PR не в draft    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в draft    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за advisory npm                                    | Завжди для push і PR не в draft    |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR не в draft    |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі lane коректності Linux, такі як перевірки bundled/plugin-contract/protocol            | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, пов’язані з Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled Plugin для всього набору extension                                | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди тестів core Node, крім lane каналів, bundled, контрактів і extension                   | Зміни, пов’язані з Node            |
| `check`                          | Шардований локальний еквівалент головного шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Шарди архітектури, меж, guard для поверхні extension, меж пакетів і gateway-watch            | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, пов’язані з Node            |
| `checks`                         | Verifier для тестів каналів на зібраних артефактах                                           | Зміни, пов’язані з Node            |
| `checks-node-compat-node22`      | Lane сумісності Node 22 для збірки і smoke                                                   | Ручний dispatch CI для релізів     |
| `check-docs`                     | Перевірки форматування документації, lint і битих посилань                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні Python Skills    |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії import specifier runtime | Зміни, релевантні Windows          |
| `macos-node`                     | Lane тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні macOS            |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні macOS            |
| `android`                        | Юніт-тести Android для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний main CI або ручний dispatch |

Ручні dispatch CI запускають той самий граф завдань, що й звичайний CI, але
примусово вмикають кожен lane з визначенням області: шарди Linux Node, шарди bundled Plugin, контракти каналів,
сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS, Android і i18n Control UI. Ручні запуски використовують
унікальну concurrency group, щоб повний набір для кандидата на реліз не було скасовано
іншим run push або PR на тому самому ref. Необов’язковий вхід `target_ref` дозволяє
довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту,
використовуючи файл workflow з вибраного ref dispatch.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж стартують дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються помилкою без очікування важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими lane Linux, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгортаються важчі platform і runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається юніт-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує маніфест preflight
працювати так, ніби змінилася кожна область зі scope.
Редагування workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують Windows, Android або macOS до нативних збірок; ці platform lane й далі обмежуються змінами у вихідному коді відповідної платформи.
Редагування лише маршрутизації CI, вибрані дешеві редагування fixture core-test і вузькі редагування helper/test-routing для контрактів Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних shard core, shard bundled Plugin і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node обмежені специфічними для Windows wrapper процесів/шляхів, helper для запуску npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цей lane; нерелевантні зміни у вихідному коді, Plugin, install-smoke та лише тестах залишаються в lane Linux Node, щоб не резервувати 16-vCPU worker Windows для покриття, яке вже забезпечують звичайні test shard.
Окремий workflow `install-smoke` повторно використовує той самий скрипт scope через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled Plugin і поверхонь core plugin/channel/Gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled Plugin, лише в тестах і лише в документації не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container `gateway-network` e2e, перевіряє build arg для bundled extension і запускає обмежений Docker-профіль bundled Plugin під загальним тайм-аутом команди 240 секунд, де `docker run` для кожного сценарію окремо також обмежений. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних dispatch, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge-комітами, не примушують повний шлях; коли логіка changed-scope запитує повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke image-provider для глобального встановлення Bun керується окремо через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `install-smoke` можуть його увімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний image live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні image `scripts/e2e/Dockerfile`: базовий runner Node/Git для lane installer/update/plugin-dependency і функціональний image, який встановлює той самий tarball у `/app` для звичайних функціональних lane. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає image для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, також 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lane з npm install і кількома сервісами не перевантажували Docker, поки легші lane все ще заповнюють доступні слоти. Один lane, важчий за ефективні обмеження, усе одно може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить ресурси. Запуски lane за замовчуванням розносяться на 2 секунди, щоб уникати локальних штормів створення в Docker daemon; це можна змінити через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегатний запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, показує статус активних lane, зберігає таймінги lane для сортування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планування нових lane в пулах після першої помилки, і кожен lane має запасний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane мають жорсткіші обмеження для окремого lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane планувальника, включно з lane лише для релізу, як-от `install-e2e`, і розділеними lane bundled update, як-от `bundled-channel-update-acpx`, при цьому пропускаючи cleanup smoke, щоб агенти могли відтворити один невдалий lane. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, kind image, live image, lane і покриття credential потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summary. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета з поточного run, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає і публікує Docker E2E image bare/functional з тегами package-digest у GHCR через кеш шарів Docker від Blacksmith, коли плану потрібні lane зі встановленим пакетом; а також повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні image package-digest замість повторної збірки. Workflow `Package Acceptance` — це високорівневий шлюз пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний workflow Docker E2E. Він зберігає `workflow_ref` окремо від `package_ref`, щоб поточна логіка приймання могла перевіряти старі довірені коміти без checkout старого коду workflow. Release checks запускають власну delta-перевірку Package Acceptance для цільового ref: bundled-channel compat, offline fixture Plugin і Telegram package QA для визначеного tarball. Набір Docker для шляху релізу запускає менші chunk-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому kind image і виконував кілька lane через той самий ваговий планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`). OpenWebUI включено в `plugins-runtime-core`, коли повне покриття release-path цього вимагає, і окремий chunk `openwebui` зберігається лише для dispatch, призначених тільки для OpenWebUI. Legacy-агреговані назви chunk `package-update`, `plugins-runtime` і `plugins-integrations` і далі працюють для ручних повторних запусків, але workflow релізу використовує розділені chunk, щоб installer E2E і повні проходи встановлення/видалення bundled Plugin не домінували у критичному шляху. Псевдонім lane `install-e2e` лишається агрегованим псевдонімом ручного повторного запуску для обох lane installer provider. Chunk `bundled-channels` запускає розділені lane `bundled-channel-*` і `bundled-channel-update-*` замість послідовного all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з логами lane, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних lane і командами повторного запуску для кожного lane. Вхід workflow `docker_lanes` запускає вибрані lane на підготовлених image замість chunk-завдань, що обмежує налагодження невдалого lane одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього run; якщо вибраний lane є live Docker lane, цільове завдання локально збирає image live-test для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожного lane включають `package_artifact_run_id`, `package_artifact_name` і підготовлені входи image, коли ці значення існують, щоб невдалий lane міг повторно використати точний пакет і image з невдалого run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub run і вивести комбіновані/по-окремих lane цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень про повільні lane і критичний шлях фаз. Запланований workflow live/E2E щодня запускає повний Docker-набір release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи `npm update` і `doctor repair` могли шардитися разом з іншими bundled-перевірками.

Поточні Docker-chunk релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований chunk `bundled-channels` лишається доступним для ручних одноразових повторних запусків, але workflow релізу використовує розділені chunk, щоб smoke каналів, цілі оновлення і контракти setup/runtime могли виконуватися паралельно. Цільові dispatch `docker_lanes` також розбивають кілька вибраних lane на паралельні завдання після одного спільного кроку підготовки package/image, а lane оновлення bundled-channel один раз повторюють спробу у разі тимчасових збоїв мережі npm.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірок суворіший щодо архітектурних меж, ніж широка платформа scope у CI: зміни у production core запускають typecheck core prod і core test плюс core lint/guards, зміни лише в core test запускають лише typecheck core test плюс core lint, зміни у production extension запускають typecheck extension prod і extension test плюс extension lint, а зміни лише в extension test запускають typecheck extension test плюс extension lint. Публічні зміни Plugin SDK або plugin-contract розширюють typecheck на extension, оскільки extension залежать від цих контрактів core, але повні проходи Vitest для extension — це явна тестова робота. Version bump лише для metadata релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переводять виконання на всі lane перевірок.

Ручні dispatch CI запускають `checks-node-compat-node22` як покриття сумісності для кандидата на реліз. Звичайні pull request і push у `main` пропускають цей lane і зберігають матрицю зосередженою на lane тестів/каналів Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner: контракти каналів запускаються як три зважені shard, тести bundled Plugin балансуються між шістьма worker extension, малі lane юніт-тестів core об’єднуються в пари, auto-reply виконується як чотири збалансовані worker із розбиттям піддерева reply на shard agent-runner, dispatch і commands/state-routing, а agentic-конфігурації Gateway/Plugin розподіляються по наявних Node-завданнях agentic лише для source замість очікування зібраних артефактів. Широкі тести browser, QA, media та різних Plugin використовують свої окремі конфігурації Vitest замість спільного catch-all для Plugin. Завдання shard для extension запускають до двох груп конфігурацій Plugin одночасно з одним worker Vitest на групу й більшим heap Node, щоб пакети Plugin з важкими import не створювали додаткові завдання CI. Широкий lane agents використовує спільний планувальник паралелізму файлів Vitest, оскільки в ньому домінують import/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний shard runtime не залишався хвостом. Shard за include-pattern записують записи таймінгів із використанням назви shard CI, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає разом роботу compile/canary для меж пакетів і відділяє архітектуру топології runtime від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard паралельно в межах одного завдання. Gateway watch, тести каналів і shard support-boundary core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі завдання-верифікатори й водночас уникаючи двох додаткових worker Blacksmith і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає debug APK для Play. Сторонній flavor не має окремого source set або manifest; його lane юніт-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/журналу дзвінків, уникаючи при цьому дублювання завдання пакування debug APK при кожному push, релевантному для Android.
GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо тільки найновіший run для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було замінено новішим.

Ключ автоматичної concurrency CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші run для main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують run, що вже виконуються.

## Runner

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard `check`, крім lint, shard і агрегати `check-additional`, агрегатні verifier для тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard тестів Linux Node, shard тестів bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж давали економії; збірки Docker для install-smoke, де вартість часу очікування в черзі на 32 vCPU була більшою за вигоду                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за lane меж
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guard
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі lane CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній run CI push у origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні run CI для main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні run CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
