---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються з помилкою
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T18:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03474ce26947efd5e63870ef78b8b88a26db4743939145394de2b5682f105635
    source_path: ci.md
    workflow: 15
---

CI запускається на кожен push до `main` і на кожен pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки. Ручні запуски через `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks` для smoke-перевірок встановлення, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, паритету QA Lab, а також lane-ів Matrix і Telegram. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, якщо вказано специфікацію опублікованого пакета. Umbrella workflow записує id запущених дочірніх run-ів, а фінальне завдання `Verify full validation` повторно перевіряє поточні підсумкові стани дочірніх run-ів. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише завдання перевірки в батьківському workflow, щоб оновити результат umbrella workflow.

Дочірній live/E2E workflow релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway`, `native-live-test`, `native-live-extensions-a-k` і `native-live-extensions-l-z`) через `scripts/test-live-shard.mjs`, а не як одне послідовне завдання. Це зберігає те саме файлове покриття та водночас полегшує повторний запуск і діагностику повільних збоїв live provider-ів.

`Package Acceptance` — це side-run workflow для валідації артефакту пакета без блокування workflow релізу. Він визначає одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного вибраним harness `workflow_ref`, HTTPS tarball URL із SHA-256 або tarball-артефакту з іншого run GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує планувальник Docker release/E2E із цим tarball замість повторного пакування checkout workflow. Профілі охоплюють smoke, package, product, full і custom-вибір Docker lane-ів. Профіль `package` використовує офлайн-покриття plugin-ів, тому валідація опублікованого пакета не залежить від доступності live ClawHub. Необов’язковий lane Telegram повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих dispatch-запусків.

## Package acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` робить checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 та profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє inventory tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lane-и проти цього пакета замість пакування checkout workflow.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; окремий dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо не вдалося визначити пакет, не пройшла Docker acceptance або не пройшов необов’язковий lane Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або з тега релізу, встановлює залежності в detached worktree і пакує це через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто вказувати для артефактів, якими діляться зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дозволяє поточному test harness перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні чанки Docker release-path із OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker-чанки release-path покривають package/update/plugin lane-и, що перетинаються, а Package Acceptance зберігає перевірку нативного для артефакту bundled-channel compat, офлайн plugin-ів і Telegram на тому самому визначеному tarball пакета.
Cross-OS release checks, як і раніше, покривають специфічні для ОС сценарії onboarding, installer і поведінки платформи; валідацію продукту package/update варто починати з Package Acceptance. Windows lanes для packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows.

Package Acceptance має обмежене вікно сумісності зі старими вже опублікованими пакетами до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці послаблення задокументовано тут, щоб вони не перетворилися на постійні тихі пропуски: відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть спричиняти попередження, якщо tarball не містив цих файлів; `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, якщо пакет не надає цього прапора; `update-channel-switch` може прибирати відсутні `pnpm.patchedDependencies` із фіктивної git-фікстури, похідної від tarball, і може журналювати відсутній збережений `update.channel`; plugin smoke-тести можуть читати застарілі розташування install-record або приймати відсутність збереження install-record marketplace; а `plugin-update` може дозволяти міграцію метаданих конфігурації, при цьому все одно вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25` мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

Приклади:

```bash
# Перевірити поточний beta-пакет із product-рівнем покриття.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Запакувати та перевірити release-гілку поточним harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Перевірити URL tarball. Для source=url SHA-256 є обов’язковим.
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

Під час налагодження невдалого запуску package acceptance починайте з summary у `resolve_package`, щоб підтвердити source, version і SHA-256 пакета. Потім перевірте дочірній run `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane-ів, тривалості фаз і команди повторного запуску. Надавайте перевагу повторному запуску профілю пакета, що завершився помилкою, або точних Docker lane-ів, а не повторному запуску повної release validation.

QA Lab має окремі CI lane-и поза основним workflow з розумним обмеженням області. Workflow `Parity gate` запускається на відповідні зміни в PR і через manual dispatch; він збирає приватне QA runtime і порівнює mock agentic pack-и GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгортає mock parity gate, live lane Matrix, а також live lane-и Telegram і Discord як паралельні завдання. Live-завдання використовують environment `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix використовує `--profile fast` для scheduled і release gate-ів, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Значення за замовчуванням для CLI та ручного workflow input залишається `all`; ручний dispatch із `matrix_profile=all`
завжди розбиває повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критично важливі для релізу QA Lab lane-и до затвердження релізу.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після злиття. За замовчуванням він працює в dry-run режимі й закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що злитий PR справді змерджений і що кожен дублікат має або спільне пов’язане issue, або hunks змін, що перетинаються.

Workflow `CodeQL` навмисно є вузьким сканером першого проходу, а не повним оглядом усього репозиторію. Щоденні та ручні запуски сканують код workflow Actions і найбільш ризикові JavaScript/TypeScript-поверхні auth, secrets, sandbox, Cron і Gateway. Критично важливий lane безпеки використовує високоточні security queries, а окремий критичний lane якості запускає лише не-security queries рівня error на тій самій вузькій JavaScript/TypeScript-поверхні. Розширення CodeQL на Swift, Android, Python, UI та bundled plugin-и слід повертати лише як scoped або sharded follow-up роботу після того, як вузький профіль матиме стабільний runtime і якісний сигнал.

Workflow `Docs Agent` — це подієвий lane підтримки Codex для узгодження наявної документації з нещодавно змердженими змінами. Він не має окремого чисто планового запуску: його може запустити успішний небутовий push CI run на `main`, а manual dispatch може запускати його безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже просунувся далі або якщо інший не пропущений run Docs Agent було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього source SHA останнього не пропущеного Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені з моменту останнього проходу документації.

Workflow `Test Performance Agent` — це подієвий lane підтримки Codex для повільних тестів. Він не має окремого чисто планового запуску: його може запустити успішний небутовий push CI run на `main`, але він пропускається, якщо інший виклик через workflow-run уже виконався або виконується того ж дня за UTC. Ручний dispatch обходить цей денний activity gate. Lane будує grouped Vitest performance report для повного набору тестів, дозволяє Codex вносити лише невеликі зміни продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, які зменшують кількість тестів із passing baseline. Якщо в baseline є тести, що падають, Codex може виправляти лише очевидні збої, а after-agent full-suite report має пройти повністю, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде змерджено, lane перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch-і пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Job                              | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Виявлення змін лише в docs, змінених областей, змінених extensions і побудова CI manifest    | Завжди для non-draft push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей проти npm advisories                               | Завжди для non-draft push і PR    |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                            | Завжди для non-draft push і PR    |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки build artifacts і reusable downstream artifacts         | Зміни, релевантні для Node        |
| `checks-fast-core`               | Швидкі Linux lanes коректності, такі як bundled/plugin-contract/protocol checks              | Зміни, релевантні для Node        |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Зміни, релевантні для Node        |
| `checks-node-extensions`         | Повні шардовані тести bundled plugin-ів для всього набору extension-ів                       | Зміни, релевантні для Node        |
| `checks-node-core-test`          | Шардовані core Node тести, без channel, bundled, contract і extension lane-ів                | Зміни, релевантні для Node        |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node        |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні для Node        |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                         | Зміни, релевантні для Node        |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node        |
| `checks-node-compat-node22`      | Lane збірки та smoke-перевірки сумісності з Node 22                                          | Ручний dispatch CI для релізів    |
| `check-docs`                     | Форматування docs, lint і перевірки зламаних посилань                                        | Docs змінено                      |
| `skills-python`                  | Ruff + pytest для Python-backed Skills                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Тести процесів/шляхів для Windows плюс регресії shared runtime import specifier-ів           | Зміни, релевантні для Windows     |
| `macos-node`                     | Lane TypeScript-тестів на macOS із використанням shared built artifacts                      | Зміни, релевантні для macOS       |
| `macos-swift`                    | Swift lint, збірка та тести для застосунку macOS                                             | Зміни, релевантні для macOS       |
| `android`                        | Android unit-тести для обох flavor-ів плюс одна debug APK збірка                             | Зміни, релевантні для Android     |
| `test-performance-agent`         | Щоденна Codex-оптимізація повільних тестів після довіреної активності                         | Успіх основного CI або ручний dispatch |

Ручні dispatch-запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожен scoped lane: Linux Node shard-и, bundled-plugin shard-и, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android і локалізацію Control UI. Ручні запуски використовують унікальну concurrency group, тому повний набір перевірок для кандидата на реліз не буде скасовано іншим push- або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запускаються дорогі:

1. `preflight` визначає, які lane-и взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко з помилкою, не чекаючи важчих завдань із матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane-ами, щоб downstream-споживачі могли стартувати, щойно буде готова shared build.
4. Після цього розгортаються важчі платформні та runtime lane-и: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує manifest у preflight поводитися так, ніби змінено кожну scoped-область.
Редагування workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати native builds для Windows, Android або macOS; ці платформні lane-и й надалі обмежуються змінами у вихідному коді відповідних платформ.
Редагування лише маршрутизації CI, окремі дешеві зміни fixture-ів core-test, а також вузькі зміни helper/test-routing для plugin contract використовують швидкий шлях manifest лише для Node: preflight, security і єдине завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, channel contracts, повних core shard-ів, bundled-plugin shard-ів і додаткових guard-матриць, коли змінені файли обмежуються поверхнями маршрутизації або helper-ами, які швидке завдання перевіряє безпосередньо.
Windows Node checks обмежені специфічними для Windows wrappers процесів/шляхів, helper-ами npm/pnpm/UI runner-ів, конфігурацією package manager-а та поверхнями workflow CI, що запускають цей lane; не пов’язані зміни у вихідному коді, plugin-ах, install-smoke і зміни лише в тестах залишаються на Linux Node lane-ах, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже виконується звичайними test shard-ами.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin-ів і core-поверхонь plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin-ів, зміни лише в тестах і лише в docs не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker profile bundled-plugin під загальним timeout команди 240 секунд, причому `docker run` кожного сценарію окремо обмежений власним лімітом. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних scheduled run-ів, ручних dispatch-ів, release checks через workflow-call і pull request-ів, які справді зачіпають поверхні installer/package/Docker. Push-і до `main`, включно з merge commits, не примушують запускати повний шлях; коли логіка changed-scope запитує повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch-и `install-smoke` можуть явно його ввімкнути, але pull request-и і push-і до `main` його не запускають. QR та installer Docker-тести зберігають власні Dockerfile, сфокусовані на встановленні. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для lane-ів installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних lane-ів функціональності. Визначення Docker lane-ів містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, після чого запускає lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider-ів, 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lane-ів за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб `npm install` і multi-service lane-и не перевантажували Docker, поки легші lane-и все ще заповнюють доступні слоти. Один окремий lane, важчий за ефективні ліміти, все одно може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить ресурси. Запуски lane-ів за замовчуванням розносяться на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, показує статус активних lane-ів, зберігає timings lane-ів для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він перестає планувати нові lane-и з пулу після першої помилки, а кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane-и використовують жорсткіші ліміти для окремого lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane-и планувальника, включно з lane-ами лише для релізів, такими як `install-e2e`, і розділеними lane-ами оновлення bundled, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити один збійний lane. Reusable workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, тип образу, live image, lane і покриття credential-ів потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summary. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета з поточного run, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає і публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache від Blacksmith, коли план потребує lane-ів з установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість повторної збірки. Workflow `Package Acceptance` — це високорівневий gate для пакетів: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commits без checkout старого коду workflow. Release checks запускають custom-дельту Package Acceptance для цільового ref: bundled-channel compat, офлайн fixture-и plugin-ів і Telegram package QA для визначеного tarball. Набір release-path Docker запускає чотири chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен чанк завантажував лише той тип образу, який йому потрібен, і виконував кілька lane-ів через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`). OpenWebUI входить до `plugins-runtime`, коли запитується повне покриття release-path, і зберігає окремий chunk `openwebui` лише для dispatch-ів, присвячених тільки OpenWebUI. Чанк `package-update` розділяє installer E2E на `install-e2e-openai` і `install-e2e-anthropic`; `install-e2e` залишається aggregate-аліасом для ручного повторного запуску. Чанк `bundled-channels` запускає розділені lane-и `bundled-channel-*` і `bundled-channel-update-*`, а не послідовний all-in-one lane `bundled-channel-deps`; `plugins-integrations` залишається застарілим aggregate-аліасом для ручних повторних запусків. Кожен чанк завантажує `.artifacts/docker-tests/` із логами lane-ів, timings, `summary.json`, `failures.json`, timings фаз, JSON-планом планувальника, таблицями повільних lane-ів і командами повторного запуску для кожного lane. Вхід `docker_lanes` workflow запускає вибрані lane-и на підготовлених образах замість chunk jobs, що обмежує налагодження збійного lane-а одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього run-у; якщо вибраний lane є live Docker lane-ом, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожного lane містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, тож збійний lane може повторно використати точний пакет і образи з невдалого run-у. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub run-у і вивести комбіновані/по-lane цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lane-ів і критичного шляху фаз. Scheduled workflow live/E2E щодня запускає повний release-path Docker suite. Матрицю bundled update розділено за ціллю оновлення, щоб повторні проходи `npm update` і `doctor repair` могли шардитися разом з іншими bundled checks.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни в core production запускають typecheck core prod і core test плюс lint/guards core, зміни лише в core test запускають лише typecheck core test плюс lint core, зміни в extension production запускають typecheck extension prod і extension test плюс lint extension, а зміни лише в extension test запускають typecheck extension test плюс lint extension. Зміни в публічному Plugin SDK або plugin contract розширюють перевірку до typecheck extension, оскільки extension-и залежать від цих core-контрактів, але повні проходи Vitest для extension-ів є окремою явною тестовою роботою. Зміни лише в release metadata version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config у режимі fail-safe запускають усі check lane-и.

Ручні dispatch-и CI запускають `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request-и та push-і до `main` пропускають цей lane і тримають матрицю сфокусованою на lane-ах тестів/channel для Node 24.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені shard-и, тести bundled plugin-ів балансуються між шістьма worker-ами extension-ів, малі core unit lane-и поєднуються попарно, auto-reply запускається як чотири збалансовані worker-и з розбиттям піддерева reply на shard-и agent-runner, dispatch і commands/state-routing, а agentic-конфіги gateway/plugin розподіляються по наявних Node-завданнях agentic лише для source замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin-тести використовують свої окремі конфігурації Vitest замість спільного catch-all для plugin-ів. Завдання shard-ів extension-ів запускають до двох груп plugin config одночасно з одним worker-ом Vitest на групу і більшим heap Node, щоб batch-і plugin-ів з важкими import-ами не створювали додаткових CI-завдань. Широкий lane agents використовує спільний file-parallel scheduler Vitest, оскільки в ньому домінують import-и/планування, а не один окремий повільний тестовий файл. `runtime-config` запускається разом із shard-ом infra core-runtime, щоб спільний runtime shard не залишався хвостовим. Shard-и з include-pattern записують timing entries, використовуючи ім’я CI shard-а, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard-а. `check-additional` тримає разом роботу compile/canary для package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guard-и паралельно в межах одного завдання. Gateway watch, channel-тести та shard core support-boundary запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі імена check-ів як легкі завдання-перевірки та водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane unit-тестів усе одно компілює цей flavor з прапорами SMS/call-log у BuildConfig, водночас уникаючи дубльованого пакування debug APK на кожен push, релевантний для Android.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший run для того самого ref також не падає. Агреговані shard-check-и використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже було витіснено.

Ключ автоматичної concurrency CI версіонований (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безкінечно блокувати новіші run-и main. Ручні повні запуски використовують `CI-manual-v1-*` і не скасовують run-и, що вже виконуються.

## Runner-и

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, shard-и `check`, окрім lint, shard-и та агрегати `check-additional`, aggregate verifier-и Node-тестів, docs checks, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node-тестів, shard-и тестів bundled plugin-ів, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний check gate: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate із timings для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі для Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі CI lane-и artifact/build-smoke
pnpm ci:timings                               # звести останній CI run push до origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні CI run-и main
node scripts/ci-run-timings.mjs <run-id>      # звести wall time, queue time і найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати CI push до origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні CI run-и main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
