---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмежувальні перевірки за областю змін і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T23:13:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f9181fe819550b195068ded66076722323e055e5a9f1e46bff61ba205ae5f8c
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінювалися лише не пов’язані ділянки. Ручні запуски через `workflow_dispatch` навмисно обходять це розумне обмеження й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks` для інсталяційного smoke-тесту, приймання пакета, Docker-наборів для шляху релізу, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram-ланок. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета. Umbrella workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні підсумкові стани дочірніх запусків. Якщо дочірній workflow було перезапущено і він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат umbrella workflow.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного повного дочірнього CI, `release-checks` для кожного дочірнього релізного завдання або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в umbrella workflow. Це дозволяє обмежити повторний запуск невдалого релізного блоку після точкового виправлення.

Дочірня live/E2E-перевірка релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway-core`, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z` і `native-live-extensions-media`) через `scripts/test-live-shard.mjs`, а не як одне послідовне завдання. Це зберігає те саме файлове покриття, одночасно спрощуючи повторний запуск і діагностику повільних збоїв live-провайдерів.

`Package Acceptance` — це окремий workflow для валідації артефакту пакета без блокування workflow релізу. Він визначає одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою вибраного harness із `workflow_ref`, HTTPS tarball URL із SHA-256 або tarball-артефакту з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`, а потім повторно використовує Docker-планувальник релізу/E2E з цим tarball замість перепакування checkout workflow. Профілі охоплюють smoke, package, product, full і custom вибір Docker-ланок. Профіль `package` використовує офлайн-покриття Plugin, тож валідація опублікованого пакета не залежить від доступності live ClawHub. Необов’язкова Telegram-ланка повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, при цьому шлях опублікованої npm-специфікації зберігається для окремих ручних запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, а package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє вміст tarball, за потреби готує Docker-образи з digest пакета і запускає вибрані Docker-ланки проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгортає ці ланки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Воно запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance його визначив; окремий запуск Telegram, як і раніше, може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо не вдалося визначити пакет, не пройшла Docker acceptance або необов’язкова Telegram-ланка завершилася помилкою.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту з `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або з релізного тега, встановлює залежності в detached worktree і пакує їх за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` із `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для зовнішньо поширюваних артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це коміт джерела, який пакується, коли `source=ref`. Це дозволяє поточному test harness перевіряти старіші довірені коміти джерела без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker-чанки шляху релізу з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker-чанки шляху релізу покривають ланки package/update/plugin, що перетинаються, тоді як Package Acceptance забезпечує нативну для артефакту перевірку bundled-channel compat, offline Plugin і Telegram на основі того самого визначеного tarball пакета.
Кросплатформені release checks, як і раніше, покривають специфічну для ОС поведінку onboarding, інсталятора та платформи; валідацію продукту для package/update слід починати з Package Acceptance. Ланки Windows packaged та installer fresh також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із сирого абсолютного шляху Windows.

Package Acceptance має обмежене вікно зворотної сумісності для вже опублікованих пакетів до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці послаблення задокументовані тут, щоб не перетворитися на постійні мовчазні пропуски: відомі приватні записи QA у `dist/postinstall-inventory.json` можуть спричиняти попередження, якщо tarball не містив цих файлів; `doctor-switch` може пропускати підвипадок із збереженням `gateway install --wrapper`, якщо пакет не надає цього прапорця; `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` із підробленого git-fixture, похідного від tarball, і може журналювати відсутній збережений `update.channel`; plugin smoke-тести можуть читати застарілі розташування записів про встановлення або приймати відсутність збереження запису встановлення маркетплейсу; а `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб запис встановлення і поведінка без повторного встановлення залишалися незмінними. Пакети після `2026.4.25` повинні відповідати сучасним контрактам; за тих самих умов буде помилка, а не попередження чи пропуск.

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

Під час налагодження невдалого запуску package acceptance почніть із summary у `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ланок, час виконання фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ланок замість повторного запуску повної release validation.

QA Lab має окремі ланки CI поза основним workflow з розумним обмеженням за областю змін. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне середовище виконання QA і порівнює agentic packs для mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щонічно на `main` і через ручний запуск; він розгортає mock parity gate, live Matrix-ланку та live Telegram- і Discord-ланки як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix використовує `--profile fast` для запланованих і релізних перевірок, додаючи `--fail-fast` лише тоді, коли CLI з checked-out підтримує його. Значення CLI за замовчуванням і ручний вхід workflow залишаються `all`; ручний запуск із `matrix_profile=all`
завжди шардує повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу ланки QA Lab перед погодженням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невелике report-завдання для фінального порівняння паритету.

Workflow `Duplicate PRs After Merge` — це ручний workflow супровідника для очищення дублікатів після злиття. За замовчуванням він працює в dry-run режимі й закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільне пов’язане issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким першим етапом сканування, а не повним обходом усього репозиторію. Щоденні й ручні запуски сканують код workflow Actions і найризикованіші поверхні JavaScript/TypeScript, пов’язані з auth, secrets, sandbox, Cron і Gateway. Критична security-ланка використовує високоточні security-запити, а окрема critical quality-ланка запускає лише несек’юрні запити рівня помилки для тієї самої вузької поверхні JavaScript/TypeScript. Розширення CodeQL на Swift, Android, Python, UI та вбудовані Plugin слід додавати назад лише як окрему scoped або sharded подальшу роботу після того, як вузький профіль матиме стабільний runtime і signal.

Workflow `Docs Agent` — це керована подіями lane технічного обслуговування Codex для підтримання наявної документації у відповідності до нещодавно злитих змін. Вона не має окремого розкладу: її може запустити успішний неботовий CI-запуск push у `main`, а також її можна запустити напряму вручну. Виклики через workflow run пропускаються, якщо `main` уже пішов далі або якщо за останню годину вже було створено інший непропущений запуск Docs Agent. Коли вона запускається, вона переглядає діапазон комітів від попереднього SHA джерела останнього непропущеного Docs Agent до поточного `main`, тому один щогодинний запуск може охопити всі зміни в main, що накопичилися з моменту останнього проходу по документації.

Workflow `Test Performance Agent` — це керована подіями lane технічного обслуговування Codex для повільних тестів. Вона не має окремого розкладу: її може запустити успішний неботовий CI-запуск push у `main`, але вона пропускається, якщо інший виклик через workflow run уже виконувався або виконується в цю добу UTC. Ручний запуск обходить це денне обмеження активності. Lane будує звіт про продуктивність Vitest для повного набору тестів із групуванням, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують базову кількість успішних тестів. Якщо в базовому стані є тести з помилками, Codex може виправляти лише очевидні збої, а підсумковий звіт повного набору після роботи агента має проходити повністю, перш ніж щось буде закомічено. Коли `main` просувається далі до того, як push бота буде злитий, lane перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Job                              | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявлення змін лише в docs, змінених областей, змінених extensions і побудова маніфесту CI  | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегатор для швидких security-завдань                                          | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, такі як перевірки bundled/plugin-contract/protocol           | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin по всьому набору extension                              | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шардовані core Node тести, за винятком ланок channel, bundled, contract та extension         | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                               | Зміни, релевантні для Node         |
| `checks`                         | Verifier для channel-тестів built-artifact                                                   | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Ланка сумісності Node 22 для збирання та smoke                                               | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування docs, lint і перевірки битих посилань                                           | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні тести процесів/шляхів плюс регресії shared runtime import specifier       | Зміни, релевантні для Windows      |
| `macos-node`                     | Ланка тестів TypeScript на macOS із використанням shared built artifacts                     | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збирання та тести для застосунку macOS                                           | Зміни, релевантні для macOS        |
| `android`                        | Android unit-тести для обох flavor плюс одне debug APK-збирання                              | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів через Codex після довіреної активності                  | Успіх CI в main або ручний запуск  |

Ручні запуски CI запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну lane, обмежену за областю змін: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android і i18n для Control UI. Ручні запуски використовують унікальну concurrency group, щоб повний набір для кандидата на реліз не скасовувався іншим push- або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного ref для dispatch.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не очікуючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли стартувати, щойно буде готове спільне збирання.
4. Після цього розгортаються важчі платформені й runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує маніфест preflight поводитися так, ніби змінилися всі області з обмеженням за scope.
Зміни workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збирання Windows, Android або macOS; ці платформені ланки й надалі обмежуються змінами у вихідному коді відповідних платформ.
Зміни лише в маршрутизації CI, окремі дешеві редагування fixture для core-тестів і вузькі редагування helper/test-routing для plugin contract використовують швидкий шлях маніфесту лише для Node: preflight, security і єдине завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, channel contracts, повних core shards, bundled-plugin shards і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежуються Windows-специфічними wrappers для процесів/шляхів, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, що запускають цю ланку; не пов’язані зміни у вихідному коді, Plugin, install-smoke і лише тестові зміни залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/package, змін package/manifest у bundled Plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled Plugin, лише тестові зміни і зміни лише в docs не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збирання bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним timeout команди 240 секунд, при цьому `docker run` для кожного сценарію обмежується окремо. Повний шлях зберігає покриття встановлення QR package і installer Docker/update для щонічних запланованих запусків, ручних dispatch, release checks через workflow-call і pull request-ів, які справді торкаються поверхонь installer/package/Docker. Push у `main`, включно з merge commit, не примушують повний шлях; коли логіка changed-scope запитує повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke на нічні або релізні перевірки. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `install-smoke` можуть явно його ввімкнути, але pull request-и і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на інсталяцію. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для ланок installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ланок. Визначення Docker-ланок містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної ланки через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає ланки з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool, що також дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких ланок за замовчуванням — `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб ланки npm install і multi-service не перевантажували Docker, поки легші ланки все ще заповнюють доступні слоти. Одна ланка, важча за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить ємність. Запуски ланок за замовчуванням розносяться на 2 секунди, щоб уникнути локальних бур створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних ланок, зберігає таймінги ланок для впорядкування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планування нових pooled lanes після першого збою, а кожна ланка має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші обмеження для окремих ланок. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з ланками лише для релізу, такими як `install-e2e`, і розділеними bundled update lanes, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити одну невдалу ланку. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, kind образу, live image, lane і покриття облікових даних потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє вміст tarball; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache від Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість повторного збирання. Workflow `Package Acceptance` — це високорівневий gate для пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені коміти без checkout старого коду workflow. Release checks запускають власну дельту Package Acceptance для цільового ref: bundled-channel compat, offline fixture для Plugin і Telegram package QA проти визначеного tarball. Docker-набір шляху релізу запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk отримував лише той kind образу, який йому потрібен, і виконував кілька ланок через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`). OpenWebUI включається в `plugins-runtime-core`, коли повне покриття шляху релізу цього потребує, і зберігає окремий chunk `openwebui` лише для dispatch, спрямованих виключно на OpenWebUI. Застарілі агреговані назви chunk — `package-update`, `plugins-runtime` і `plugins-integrations` — усе ще працюють для ручних повторних запусків, але workflow релізу використовує розділені chunks, щоб installer E2E і повні проходи встановлення/видалення bundled Plugin не домінували на критичному шляху. Псевдонім ланки `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох ланок installer provider. Chunk `bundled-channels` запускає розділені ланки `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one ланки `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із журналами ланок, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ланок і командами повторного запуску для кожної ланки. Вхід workflow `docker_lanes` запускає вибрані ланки проти підготовлених образів замість chunk jobs, що утримує налагодження невдалої ланки в межах одного цільового Docker-завдання та готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана ланка є live Docker lane, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної ланки містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала ланка могла повторно використати точний package і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub run і вивести комбіновані/поканальні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень по повільних ланках і критичному шляху фаз. Запланований workflow live/E2E щодня запускає повний Docker-набір шляху релізу. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардуватися разом з іншими bundled-перевірками.

Поточні релізні Docker-chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований chunk `bundled-channels` залишається доступним для ручних одноразових повторних запусків, але workflow релізу використовує розділені chunks, щоб channel smoke, цілі оновлення і setup/runtime contracts могли виконуватися паралельно. Цільові dispatch через `docker_lanes` також розбивають кілька вибраних ланок на паралельні завдання після одного спільного кроку підготовки package/image, а bundled-channel update lanes повторюються один раз у разі тимчасових npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо меж архітектури, ніж широка платформена область CI: зміни в core production запускають core prod і core test typecheck плюс core lint/guards, зміни лише в core tests запускають лише core test typecheck плюс core lint, зміни в extension production запускають extension prod і extension test typecheck плюс extension lint, а зміни лише в extension tests запускають extension test typecheck плюс extension lint. Публічні зміни Plugin SDK або plugin-contract розширюються до extension typecheck, тому що extensions залежать від цих core contract, але повні проходи Vitest для extension — це окрема явна тестова робота. Зміни лише в release metadata version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх check lanes.

Ручні dispatch CI запускають `checks-node-compat-node22` як покриття сумісності для кандидата на реліз. Звичайні pull request-и і push у `main` пропускають цю ланку й залишають матрицю зосередженою на ланках тестів/channel для Node 24.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені шарди, bundled Plugin-тести балансуються між шістьма worker-ами extension, малі core unit-ланки об’єднані в пари, auto-reply виконується на чотирьох збалансованих worker-ах із розділенням піддерева reply на шарди agent-runner, dispatch і commands/state-routing, а agentic-конфігурації gateway/Plugin розподіляються між наявними Node-завданнями agentic лише для source замість очікування built artifacts. Широкі browser-, QA-, media- і miscellaneous Plugin-тести використовують свої окремі конфігурації Vitest замість спільного catch-all для Plugin. Завдання shard для extension запускають до двох груп конфігурацій Plugin одночасно з одним worker-ом Vitest на групу і більшим heap Node, щоб пакетні набори Plugin з великою кількістю імпортів не створювали зайвих CI-завдань. Широка agents-ланка використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують імпорти/планування, а не один конкретний повільний тестовий файл. `runtime-config` запускається разом із шардом infra core-runtime, щоб спільний runtime-shard не тягнув хвіст. Include-pattern shards записують записи таймінгів із використанням назви CI-shard, тому `.artifacts/vitest-shard-timings.json` може розрізняти цілу конфігурацію і відфільтрований shard. `check-additional` тримає compile/canary-роботу package-boundary разом і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, channel-тести і shard support-boundary для core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як легкі verifier-завдання та уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає debug APK для Play. У flavor third-party немає окремого source set або manifest; його ланка unit-тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого пакування debug APK на кожному push, релевантному для Android.
GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується помилкою. Агреговані перевірки shard використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shard, але не ставали в чергу після того, як увесь workflow уже було замінено новішим.

Автоматичний ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують уже запущені виконання.

## Runner-и

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, шарди `check`, окрім lint, шарди й агрегати `check-additional`, aggregate verifier-и Node-тестів, docs checks, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди bundled Plugin-тестів, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали економію; Docker-збирання install-smoke, де вартість часу в черзі для 32-vCPU перевищувала виграш                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork-ів використовується fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork-ів використовується fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний check gate: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі CI artifact/build-smoke lanes
pnpm ci:timings                               # підсумувати останній запуск push CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум від issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
