---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-27T22:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bc5befeb5ad84227dd8b36f4ee3b91166c9e5c4417eacb82f9500d568359558
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення меж і розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` для цієї цілі та запускає `OpenClaw Release Checks` для перевірки встановлення, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram. Він також може запускати workflow після публікації `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета. Umbrella workflow записує id запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні підсумкові стани дочірніх запусків. Якщо дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат umbrella workflow.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `release-checks` для кожного дочірнього релізного завдання або вужчу групу релізу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` в umbrella workflow. Це дозволяє обмежити повторний запуск збійного релізного бокса після точкового виправлення.

Дочірній live/E2E workflow релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway-core`, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z` і `native-live-extensions-media`) через `scripts/test-live-shard.mjs` замість одного послідовного завдання. Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider.

`Package Acceptance` — це side-run workflow для перевірки артефакту пакета без блокування workflow релізу. Він визначає одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного вибраним harness `workflow_ref`, HTTPS URL tarball із SHA-256 або tarball-артефакту з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує планувальник Docker release/E2E із цим tarball замість повторного пакування checkout workflow. Профілі охоплюють вибір Docker lane для smoke, package, product, full і custom. Профіль `package` використовує offline plugin coverage, тому валідація опублікованого пакета не залежить від доступності live ClawHub. Необов’язковий lane Telegram повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, при цьому шлях через специфікацію опублікованого npm залишається для автономних запусків.

## Package acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє inventory tarball, за потреби готує package-digest Docker images і запускає вибрані Docker lanes для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; автономний запуск Telegram і далі може встановлювати опубліковану npm-специфікацію.
4. `summary` позначає workflow як невдалий, якщо не вдалися визначення пакета, Docker acceptance або необов’язковий lane Telegram.

Джерела кандидата:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тега, встановлює залежності у detached worktree і пакує це через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` не є обов’язковим, але його слід надавати для артефактів, якими діляться зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це код довіреного workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дозволяє поточному test harness перевіряти старі довірені вихідні коміти без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні chunks Docker release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker chunks release-path
покривають перетинні lane для package/update/plugin, тоді як Package
Acceptance зберігає доказову базу для вбудованої сумісності каналів, офлайнових plugin і Telegram на рівні артефакту щодо того самого визначеного tarball пакета.
Cross-OS release checks і далі покривають специфічну для ОС поведінку онбордингу, інсталятора й платформи; перевірку продукту package/update слід починати з Package Acceptance. Лінії свіжого запуску packaged та installer для Windows також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного Windows-шляху.

Package Acceptance має обмежене вікно legacy-сумісності для вже опублікованих пакетів до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці послаблення задокументовано тут, щоб вони не перетворилися на постійні тихі пропуски: відомі приватні записи QA у `dist/postinstall-inventory.json` можуть спричиняти попередження, якщо tarball не містив цих файлів; `doctor-switch` може пропустити підвипадок persistence для `gateway install --wrapper`, якщо пакет не надає цей прапорець; `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` із tarball-derived fake git fixture і може логувати відсутній збережений `update.channel`; plugin smoke можуть читати legacy-розташування install-record або приймати відсутність persistence install-record для marketplace; а `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас і далі вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними. Пакети після `2026.4.25` мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження чи пропуску.

Приклади:

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Під час налагодження збійного запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію і SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску збійного package profile або точних Docker lanes замість повторного запуску повної release validation.

QA Lab має окремі лінії CI поза основним workflow із розумним визначенням меж. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне QA runtime і порівнює mock agentic packs GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні завдання. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix використовує `--profile fast` для запланованих і релізних перевірок, додаючи `--fail-fast` лише тоді, коли це підтримує CLI із checked-out версії. Значення CLI за замовчуванням і ручне введення workflow залишаються `all`; ручний запуск з `matrix_profile=all`
завжди розбиває повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критично важливі для релізу лінії QA Lab до схвалення релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для очищення дублікатів після злиття. За замовчуванням він працює в dry-run режимі й закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що злитий PR справді змерджено, а також що кожен дублікат має або спільне згадане issue, або перетинні змінені hunks.

Workflow `CodeQL` навмисно є вузьким першим сканером, а не повним оглядом усього репозиторію. Щоденні й ручні запуски сканують код workflow Actions плюс JavaScript/TypeScript-поверхні з найвищим ризиком, пов’язані з auth, secrets, sandbox, Cron і gateway. Критично важлива security lane використовує високоточні security-запити, а окрема critical quality lane запускає лише non-security-запити рівня error для тієї самої вузької JavaScript/TypeScript-поверхні. Розширення CodeQL на Swift, Android, Python, UI і bundled-plugin слід повертати лише як окрему scoped або sharded подальшу роботу після того, як вузький профіль матиме стабільний час виконання й корисний сигнал.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримання наявної документації у відповідності до нещодавно внесених змін. Він не має окремого розкладу: його може запустити успішний неботовий CI-запуск push у `main`, а також його можна запустити напряму через ручний dispatch. Виклики через workflow-run пропускаються, якщо `main` уже пішов уперед або якщо протягом останньої години вже було створено інший непропущений запуск Docs Agent. Коли він запускається, він переглядає діапазон комітів від попереднього source SHA непропущеного Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в `main`, накопичені з часу останнього проходу по документації.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex для повільних тестів. Він не має окремого розкладу: його може запустити успішний неботовий CI-запуск push у `main`, але він пропускається, якщо того UTC-дня інший виклик через workflow-run уже відпрацював або ще виконується. Ручний dispatch обходить цей денний activity gate. Lane будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують кількість тестів у прохідному baseline. Якщо baseline містить тести, що падають, Codex може виправляти лише очевидні збої, а after-agent звіт повного набору тестів має пройти, перш ніж щось буде закомічено. Коли `main` рухається вперед до того, як бот встигає доставити push, lane перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму drop-sudo posture безпеки, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені межі, змінені extensions і будує CI manifest     | Завжди для non-draft push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі npm advisories                           | Завжди для non-draft push і PR    |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft push і PR    |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node        |
| `checks-fast-core`               | Швидкі Linux lanes коректності, такі як bundled/plugin-contract/protocol checks              | Зміни, релевантні для Node        |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate результатом перевірки                | Зміни, релевантні для Node        |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extensions                            | Зміни, релевантні для Node        |
| `checks-node-core-test`          | Шардовані core Node тести, без channel, bundled, contract і extension lanes                  | Зміни, релевантні для Node        |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node        |
| `check-additional`               | Shards для architecture, boundary, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні для Node        |
| `build-smoke`                    | Smoke-тести built-CLI і startup-memory smoke                                                 | Зміни, релевантні для Node        |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node        |
| `checks-node-compat-node22`      | Lane сумісності Node 22 для build і smoke                                                    | Ручний dispatch CI для релізів    |
| `check-docs`                     | Перевірки форматування документації, lint і broken links                                     | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Python-backed Skills                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс спільні регресії import specifier runtime    | Зміни, релевантні для Windows     |
| `macos-node`                     | Lane тестів TypeScript на macOS із використанням спільних built artifacts                    | Зміни, релевантні для macOS       |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS       |
| `android`                        | Android unit-тести для обох flavor плюс один debug APK build                                 | Зміни, релевантні для Android     |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний CI на main або ручний dispatch |

Ручні dispatch-виклики CI запускають той самий граф завдань, що й звичайний CI, але примусово вмикають усі scoped lanes: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android і Control UI i18n. Ручні запуски використовують унікальну concurrency group, щоб повний набір перевірок для кандидата на реліз не було скасовано іншим push- або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж почнуть виконуватися дорогі:

1. `preflight` визначає, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих matrix jobs для artifacts і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж перевірок живе в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує preflight manifest поводитися так, ніби змінилася кожна scoped-ділянка.
Зміни workflow CI перевіряють Node CI graph плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці platform lanes і далі залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Зміни лише в маршрутизації CI, окремі дешеві зміни fixture core-test, а також вузькі зміни helper/test-routing для plugin contract використовують швидкий шлях manifest лише для Node: preflight, security і єдине завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, channel contracts, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows process/path wrappers, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю lane; не пов’язані зміни вихідного коду, plugin, install-smoke і лише тестів залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення меж через власне завдання `preflight`. Він ділить smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, лише тести та лише документація не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container `gateway-network` e2e, перевіряє build arg bundled extension і запускає обмежений Docker profile bundled-plugin із сумарним тайм-аутом команди 240 секунд, де `docker run` кожного сценарію окремо також обмежено. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope на push запитувала б повне покриття, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `install-smoke` можуть увімкнути його, але pull request і push у `main` його не запускають. Тести QR та installer Docker зберігають власні install-focused Dockerfile. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для lane installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes. Визначення Docker lane живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу 10, чутливого до provider, — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lane за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lanes з npm install і кількома сервісами не перевантажували Docker, поки легші lanes все ще заповнюють доступні слоти. Окрема lane, важча за ефективні обмеження, усе одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Запуски lane за замовчуванням рознесені на 2 секунди, щоб уникати локальних штормів create у Docker daemon; це можна перевизначити через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate спочатку перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних lanes, зберігає таймінги lanes для впорядкування longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна lane має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші обмеження для кожної lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з lane лише для релізу, такими як `install-e2e`, і split bundled update lanes, такими як `bundled-channel-update-acpx`, водночас пропускаючи cleanup smoke, щоб агенти могли відтворити одну збійну lane. Повторно використовуваний workflow live/E2E запитує у `scripts/test-docker-all.mjs --plan-json`, який package, image kind, live image, lane і credential coverage потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на outputs і summaries GitHub. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає і публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні lanes з установленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` — це високорівневий gate для пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені коміти без checkout старого коду workflow. Release checks запускають custom Package Acceptance delta для цільового ref: bundled-channel compat, offline plugin fixtures і Telegram package QA для визначеного tarball. Набір Docker release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk витягував лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`). OpenWebUI вбудовано в `plugins-runtime-core`, коли повне покриття release-path вимагає його, і окремий chunk `openwebui` залишається лише для dispatch-викликів лише OpenWebUI. Legacy aggregate-імена chunk `package-update`, `plugins-runtime` і `plugins-integrations` і далі працюють для ручних rerun, але workflow релізу використовує split chunks, щоб installer E2E і sweeps install/uninstall bundled plugin не домінували на критичному шляху. Псевдонім lane `install-e2e` залишається aggregate-псевдонімом ручного rerun для обох lanes installer provider. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з логами lanes, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON-планом планувальника, таблицями повільних lanes і командами rerun для кожної lane. Вхід workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що дозволяє обмежити налагодження збійної lane одним цільовим Docker job і підготувати, завантажити або повторно використати артефакт пакета для цього запуску; якщо вибрана lane є live Docker lane, цільове завдання збирає live-test image локально для цього rerun. Згенеровані команди rerun GitHub для кожної lane включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, тож збійна lane може повторно використати точний пакет і образи зі збійного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести комбіновані/покрокові цільові команди rerun; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lanes і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний набір Docker release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair можна було шардити разом з іншими bundled checks.

Поточні release Docker chunks — це `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` і далі доступний для ручних одноразових rerun, але workflow релізу використовує split chunks, щоб channel smokes, цілі оновлення і setup/runtime contract checks могли виконуватися паралельно. Цільові dispatch-виклики `docker_lanes` також розділяють кілька вибраних lanes на паралельні jobs після одного спільного кроку підготовки package/image, а bundled-channel update lanes повторюють спробу один раз у разі тимчасових збоїв мережі npm.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо меж архітектури, ніж широке визначення platform scope у CI: зміни core production запускають typecheck core prod і core test плюс core lint/guards, зміни лише core test запускають лише typecheck core test плюс core lint, зміни extension production запускають typecheck extension prod і extension test плюс extension lint, а зміни лише extension test запускають typecheck extension test плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюють typecheck на extensions, оскільки extensions залежать від цих core contract, але sweeps Vitest для extensions — це явна тестова робота. Version bumps лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірку на всі check lanes.

Ручні dispatch-виклики CI запускають `checks-node-compat-node22` як покриття сумісності для кандидата на реліз. Звичайні pull request і push у `main` пропускають цю lane й зберігають фокус матриці на lanes тестів/каналів Node 24.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені shard-и, тести bundled plugin балансуються між шістьма extension worker-ами, малі core unit lanes об’єднані попарно, auto-reply виконується як чотири збалансовані worker-и з розділенням піддерева reply на shard-и agent-runner, dispatch і commands/state-routing, а agentic-конфігурації gateway/plugin розподіляються по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser-, QA-, media- і miscellaneous-тести plugin використовують свої спеціалізовані конфігурації Vitest замість спільного catch-all для plugin. Extension shard jobs запускають до двох груп конфігурацій plugin одночасно з одним worker-ом Vitest на групу і більшим heap Node, щоб import-heavy пакети plugin не створювали додаткові CI jobs. Широка lane agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують імпорти/планування, а не один окремий повільний тестовий файл. `runtime-config` запускається разом із shard-ом `infra core-runtime`, щоб спільний runtime shard не замикав tail на собі. Shard-и за include-pattern записують entries таймінгів із використанням назви CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard-а. `check-additional` тримає compile/canary-роботи для package-boundary разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guard-и паралельно в межах одного job. Gateway watch, channel tests і shard support-boundary для core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви check як легкі jobs-перевірники, водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги artifact-consumer.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane unit-тестів усе одно компілює цей flavor з прапорцями SMS/call-log у BuildConfig, водночас уникаючи дублювання job пакування debug APK на кожному push, релевантному для Android.

GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Ставтеся до цього як до шуму CI, якщо тільки найновіший запуск для того самого ref також не падає. Aggregate-перевірки shard-ів використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже було витіснено.

Ключ автоматичної concurrency CI версіонований (`CI-v7-*`), щоб zombie на боці GitHub у старій queue group не міг безстроково блокувати новіші запуски main. Ручні full-suite запуски використовують `CI-manual-v1-*` і не скасовують уже виконувані запуски.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, shard-и `check`, крім lint, shard-и й aggregate `check-additional`, aggregate verifier-и Node test, docs checks, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше ставати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node test, shard-и bundled plugin test, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, щоб 8 vCPU коштували дорожче, ніж давали вигоди; Docker builds для install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний check gate: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + broken links
pnpm build          # зібрати dist, коли важливі lanes CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній CI-запуск push у origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні CI-запуски main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати CI push у origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні CI-запуски main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
