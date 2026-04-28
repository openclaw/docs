---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі шлюзів перевірки та локальні еквіваленти команд
title: пайплайн CI
x-i18n:
    generated_at: "2026-04-28T02:58:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac508419450f6b68f0cf5c85f9eb8dc5f208288778ef5304db3e39be90f3eab6
    source_path: ci.md
    workflow: 15
---

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінилися лише непов’язані ділянки. Ручні запуски через `workflow_dispatch` навмисно обходять розумне визначення меж і розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для сценарію «запустити все перед релізом». Він приймає гілку, тег або повний commit SHA, запускає вручну workflow `CI` з цією ціллю, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли вказано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує широтою live/provider-перевірок, що передається до release checks: `minimum` залишає найшвидші критичні для релізу лейни OpenAI/core, `stable` додає стабільний набір provider/backend, а `full` запускає широкий advisory matrix для provider/media. Umbrella workflow записує id запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні підсумки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапустили і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат umbrella workflow і підсумок таймінгів.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `release-checks` для всіх дочірніх release checks або вужчу release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в umbrella workflow. Це дозволяє тримати повторний запуск невдалого release box у межах після точкового виправлення.

Дочірній live/E2E workflow для релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway-core`, jobs `native-live-src-gateway-profiles` з provider-фільтрацією, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z-other`, `native-live-extensions-xai`, розділені media audio/video shard-и та provider-filtered music shard-и) через `scripts/test-live-shard.mjs` замість одного послідовного завдання. Це зберігає те саме файлове покриття, але робить повільні live-збої provider-ів простішими для повторного запуску та діагностики. Агреговані назви shard-ів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються валідними для ручних одноразових повторних запусків.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз резолвити вибраний ref у tarball `release-package-under-test`, а потім передає цей artifact і до Docker workflow для live/E2E release-path, і до shard-а package acceptance. Це зберігає байти пакета узгодженими між release box-ами та уникає повторного пакування того самого кандидата в кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації артефакта пакета без блокування release workflow. Він резолвить одного кандидата з опублікованої npm-специфікації, trusted `package_ref`, зібраного з harness-ом вибраного `workflow_ref`, HTTPS tarball URL із SHA-256 або tarball artifact з іншого run GitHub Actions, завантажує його як artifact `package-under-test`, а потім повторно використовує Docker release/E2E scheduler із цим tarball замість повторного пакування checkout workflow. Профілі покривають вибірки Docker lane-ів smoke, package, product, full і custom. Профіль `package` використовує offline покриття Plugin-ів, тож валідація опублікованого пакета не залежить від live-доступності ClawHub. Необов’язковий Telegram lane повторно використовує artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях через опубліковану npm-специфікацію збережено для окремих standalone dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI валідовує дерево вихідного коду, тоді як package acceptance валідовує один tarball через той самий Docker E2E harness, яким користуються користувачі після install або update.

Workflow має чотири jobs:

1. `resolve_package` виконує checkout `workflow_ref`, резолвить одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як artifact `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей artifact, валідовує inventory tarball, готує package-digest Docker images за потреби та запускає вибрані Docker lane-и проти цього пакета замість пакування checkout workflow. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow один раз готує пакет і спільні images, а потім розгортає ці lane-и як паралельні цільові Docker jobs з унікальними artifacts.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий artifact `package-under-test`, якщо Package Acceptance його резолвив; standalone Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо не вдалися резолюція пакета, Docker acceptance або необов’язковий Telegram lane.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref`: пакує trusted `package_ref` гілки, тегу або повного commit SHA. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або з release tag, встановлює залежності в detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для артефактів, переданих назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted код workflow/harness, який запускає тест. `package_ref` — це commit вихідного коду, який пакується, коли `source=ref`. Це дозволяє поточному test harness валідовувати старіші trusted commit-и вихідного коду без запуску старої логіки workflow.

Профілі відповідають Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full`: повні chunks Docker release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker chunks release-path покривають накладні lane-и package/update/plugin, тоді як Package Acceptance зберігає artifact-native перевірку bundled-channel compat, offline Plugin, і Telegram-доказ проти того самого резолвленого tarball пакета.
Cross-OS release checks, як і раніше, покривають OS-specific onboarding, installer і поведінку платформи; валідацію продукту package/update слід починати з Package Acceptance. Windows packaged і installer fresh lane-и також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного Windows path.

Package Acceptance має обмежене вікно legacy-compatibility для вже опублікованих пакетів до `2026.4.25`, включно з `2026.4.25-beta.*`. Ці послаблення задокументовані тут, щоб не перетворитися на постійні мовчазні пропуски: відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть давати попередження, коли tarball не містив ці файли; `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець; `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, похідного від tarball, і може логувати відсутнє збережене `update.channel`; смоук-тести Plugin-ів можуть читати legacy-розташування install-record або приймати відсутність збереження install-record marketplace; а `plugin-update` може дозволяти міграцію metadata конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без перевстановлення лишалися незмінними. Пакети після `2026.4.25` мають задовольняти сучасні контракти; ті самі умови завершуються помилкою замість попередження або пропуску.

Приклади:

```bash
# Валідувати поточний beta-пакет з покриттям рівня product.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Запакувати й перевірити release branch з поточним harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Валідувати tarball URL. SHA-256 є обов’язковим для source=url.
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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити source пакета, version і SHA-256. Потім перевірте дочірній run `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane-ів, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lane-ів замість повторного запуску повної release validation.

QA Lab має окремі CI lane-и поза основним smart-scoped workflow. Workflow `Parity gate` запускається при відповідних змінах у PR і при ручному dispatch; він збирає приватне QA runtime і порівнює agentic pack-и mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щонічно на `main` і при ручному dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lane-и як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Matrix використовує `--profile fast` для запланованих і release-перевірок, додаючи `--fail-fast` лише тоді, коли CLI з checked-out коду це підтримує. Значення CLI за замовчуванням і ручний вхід workflow лишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу lane-и QA Lab перед схваленням релізу; його QA parity gate запускає lane-и candidate і baseline pack як паралельні jobs, а потім завантажує обидва artifacts у невелике report-завдання для фінального parity comparison.

Workflow `Duplicate PRs After Merge` — це ручний workflow для maintainer-ів для очищення дублікатів після приземлення змін. За замовчуванням він працює в режимі dry-run і закриває лише явно вказані PR, коли `apply=true`. Перед зміною стану GitHub він перевіряє, що приземлений PR уже злито, і що кожен дублікат має або спільний referenced issue, або перекривні змінені hunks.

Workflow `CodeQL` навмисно є вузьким сканером першого проходу, а не повним оглядом усього репозиторію. Щоденні та ручні запуски сканують код workflow Actions і JavaScript/TypeScript-поверхні auth, secrets, sandbox, cron і gateway з найвищим ризиком. Критичний security lane використовує high-precision security queries, а окремий critical quality lane запускає лише non-security queries рівня error severity над тією ж вузькою JavaScript/TypeScript-поверхнею. Розширення CodeQL на Swift, Android, Python, UI і bundled Plugin-и слід повертати лише як окрему scoped або sharded follow-up роботу після того, як вузький профіль матиме стабільний runtime і signal.

Workflow `Docs Agent` — це event-driven lane технічного обслуговування Codex для підтримання наявної документації узгодженою з нещодавно приземленими змінами. Він не має окремого schedule: його може запускати успішний non-bot push run CI на `main`, а manual dispatch може запустити його безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже пішов уперед або якщо інший непроігнорований run Docs Agent був створений протягом останньої години. Коли він запускається, то перевіряє діапазон commit-ів від попереднього source SHA непроігнорованого Docs Agent до поточного `main`, тож один щогодинний run може охопити всі зміни в main, накопичені від останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane технічного обслуговування Codex для повільних тестів. Він не має окремого schedule: його може запускати успішний non-bot push run CI на `main`, але він пропускається, якщо інший виклик через workflow-run уже відпрацював або ще виконується того самого дня UTC. Manual dispatch обходить це денне обмеження активності. Lane будує звіт про продуктивність Vitest для повного набору тестів, згрупований за групами, дозволяє Codex робити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують кількість тестів у прохідному baseline. Якщо baseline містить тести, що падають, Codex може виправляти лише очевидні збої, а після-агентний звіт повного набору має пройти перед будь-яким commit. Коли `main` просувається вперед до того, як bot push приземлиться, lane перебазовує валідований patch, повторно запускає `pnpm check:changed` і повторює push; застарілі patch-і з конфліктами пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну posture drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Job                              | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в docs, змінені межі, змінені extensions і будує CI manifest             | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей проти advisory npm                                  | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux lane-и коректності, як-от перевірки bundled/plugin-contract/protocol            | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                          | Зміни, релевантні Node             |
| `checks-node-extensions`         | Повні sharded тести bundled Plugin-ів для всього набору extension                            | Зміни, релевантні Node             |
| `checks-node-core-test`          | Sharded тести ядра Node, без channel, bundled, contract і extension lane-ів                  | Зміни, релевантні Node             |
| `check`                          | Sharded еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node       |
| `check-additional`               | Shard-и architecture, boundary, extension-surface guards, package-boundary і gateway-watch   | Зміни, релевантні Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke стартової пам’яті                                          | Зміни, релевантні Node             |
| `checks`                         | Verifier для channel-тестів built-artifact                                                    | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Lane сумісності Node 22 для build і smoke                                                    | Ручний dispatch CI для релізів     |
| `check-docs`                     | Перевірки форматування docs, lint і битих посилань                                            | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                            | Зміни, релевантні Python Skills    |
| `checks-windows`                 | Windows-specific тести process/path плюс регресії shared runtime import specifier            | Зміни, релевантні Windows          |
| `macos-node`                     | macOS lane тестів TypeScript з використанням спільних built artifacts                         | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                                | Зміни, релевантні macOS            |
| `android`                        | Android unit-тести для обох flavor-ів плюс одна збірка debug APK                              | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх main CI або manual dispatch  |

Ручні dispatch-і CI запускають той самий граф завдань, що й звичайний CI, але примусово вмикають усі scoped lane-и: Linux Node shard-и, shard-и bundled Plugin-ів, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android і i18n для Control UI. Ручні запуски використовують унікальну concurrency group, щоб повний набір для кандидата на реліз не скасовувався іншим push або PR run на тому самому ref. Необов’язковий вхід `target_ref` дозволяє довіреному виклику запустити цей граф проти гілки, тегу або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які lane-и взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього job, а не окремі jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих jobs матриці artifact-ів і платформ.
3. `build-artifacts` перекривається в часі зі швидкими Linux lane-ами, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгортаються важчі platform і runtime lane-и: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення меж живе в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує preflight manifest поводитися так, ніби змінилися всі scoped-ділянки.
Редагування workflow CI валідовують граф Node CI плюс linting workflow, але самі по собі не примушують запускати native build-и Windows, Android або macOS; ці platform lane-и й далі залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Редагування лише CI routing, вибрані дешеві зміни fixture core-test і вузькі редагування helper/test-routing для plugin contract використовують швидкий шлях manifest лише для Node: preflight, security і одна задача `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, channel contracts, повних shard-ів core, shard-ів bundled Plugin-ів і додаткових матриць guard-ів, коли змінені файли обмежуються routing або helper-поверхнями, які швидка задача безпосередньо перевіряє.
Перевірки Windows Node прив’язані до Windows-specific wrapper-ів process/path, helper-ів runner для npm/pnpm/UI, конфігурації package manager і тих поверхонь workflow CI, які запускають цей lane; непов’язані зміни у вихідному коді, Plugin-ах, install-smoke і лише в тестах залишаються на Linux Node lane-ах, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shard-ами.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він ділить smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled Plugin-ів і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled Plugin-ів, лише в тестах і лише в docs не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container e2e `gateway-network`, перевіряє build arg bundled extension і запускає обмежений Docker profile bundled Plugin-ів із сукупним тайм-аутом команди 240 секунд, де кожен сценарій `docker run` має окреме обмеження. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запланованих запусків, ручних dispatch-ів, workflow-call release checks і pull request-ів, які справді зачіпають поверхні installer/package/Docker. Push-і в `main`, включно з merge commit-ами, не примушують повний шлях; коли логіка changed-scope просила б повне покриття на push, workflow залишає швидкий Docker smoke, а повний install smoke переносить на нічну або release-валідацію. Повільний smoke для image-provider з глобальним install Bun керується окремо через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch-і `install-smoke` можуть увімкнути його, але pull request-и й push-і в `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на install. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні image з `scripts/e2e/Dockerfile`: базовий runner Node/Git для lane-ів installer/update/plugin-dependency і функціональний image, який встановлює той самий tarball у `/app` для звичайних функціональних lane-ів. Описи Docker lane-ів живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner-а — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler підбирає image для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів tail-pool, чутливого до provider-ів, 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких lane-ів за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lane-и з npm install і кількома сервісами не перевантажували Docker, поки легші lane-и все ще заповнюють доступні слоти. Один окремий lane, важчий за ефективні ліміти, усе одно може стартувати з порожнього пулу, а потім виконується наодинці, доки не звільнить місткість. Запуски lane-ів за замовчуванням розводяться на 2 секунди, щоб уникати локальних штормів create в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, прибирає застарілі контейнери OpenClaw E2E, показує статус активних lane-ів, зберігає таймінги lane-ів для сортування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для огляду scheduler-а. За замовчуванням він припиняє планування нових pooled lane-ів після першої помилки, і кожен lane має fallback-тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane-и використовують жорсткіші індивідуальні обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane-и scheduler-а, включно з lane-ами лише для релізу, такими як `install-e2e`, і split lane-ами bundled update, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агент міг відтворити один збійний lane. Reusable workflow live/E2E через `scripts/test-docker-all.mjs --plan-json` з’ясовує, який package, image kind, live image, lane і покриття credential потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summary. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує artifact поточного run з пакетом, або завантажує artifact пакета з `package_artifact_run_id`; валідовує inventory tarball; збирає і публікує package-digest-tagged Docker E2E images bare/functional у GHCR через Docker layer cache від Blacksmith, коли plan потребує lane-ів з установленим пакетом; і повторно використовує передані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні images за package-digest замість повторної збірки. Workflow `Package Acceptance` — це високорівневий шлюз для пакета: він резолвить кандидата з npm, trusted `package_ref`, HTTPS tarball плюс SHA-256 або artifact попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла валідовувати старіші trusted commit-и без checkout старого коду workflow. Release checks запускають кастомну дельту Package Acceptance для цільового ref: bundled-channel compat, offline fixture-и Plugin-ів і package QA для Telegram проти резолвленого tarball. Docker suite release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk витягував лише потрібний тип image і виконував кілька lane-ів через той самий зважений scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`). OpenWebUI вбудований у `plugins-runtime-core`, коли повне release-path coverage його запитує, і зберігає окремий chunk `openwebui` лише для dispatch-ів тільки з OpenWebUI. Legacy aggregate-назви chunk-ів `package-update`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних повторних запусків, але workflow релізу використовує split chunk-и, щоб installer E2E і sweeps install/uninstall для bundled Plugin-ів не домінували в критичному шляху. Псевдонім lane-а `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох lane-ів installer provider-ів. Chunk `bundled-channels` запускає split lane-и `bundled-channel-*` і `bundled-channel-update-*` замість послідовного all-in-one lane-а `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з логами lane-ів, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON-планом scheduler-а, таблицями повільних lane-ів і командами повторного запуску для кожного lane. Вхід workflow `docker_lanes` запускає вибрані lane-и проти підготовлених images замість chunk jobs, що дозволяє тримати налагодження збійного lane-а в межах одного цільового Docker job і готує, завантажує або повторно використовує artifact пакета для цього запуску; якщо вибраний lane є live Docker lane-ом, цільове завдання локально збирає live-test image для цього rerun. Згенеровані GitHub-команди повторного запуску для окремих lane-ів містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених image-ів, коли ці значення існують, тож збійний lane може повторно використати точний пакет і images із невдалого run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести комбіновані/поканальні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних lane-ів і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний Docker suite release-path. Матриця bundled update розділена за update target, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled checks.

Поточні release Docker chunk-и — це `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований chunk `bundled-channels` лишається доступним для ручних одноразових повторних запусків, але workflow релізу використовує split chunk-и, щоб channel smoke, update target-и та setup/runtime contract checks могли виконуватися паралельно. Цільові dispatch-і `docker_lanes` також розділяють кілька вибраних lane-ів на паралельні jobs після одного спільного кроку підготовки package/image, а lane-и bundled-channel update один раз повторюються при тимчасових збоях npm network.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірок суворіше ставиться до меж architecture, ніж широкий CI scope платформ: зміни в core production запускають typecheck core prod і core test плюс lint/guards core, зміни лише в core test запускають лише typecheck core test плюс lint core, зміни в extension production запускають typecheck extension prod і extension test плюс lint extension, а зміни лише в extension test запускають typecheck extension test плюс lint extension. Публічні зміни Plugin SDK або plugin-contract розширюються до typecheck extension, оскільки extensions залежать від цих контрактів core, але Vitest-sweep-и extension — це явна окрема тестова робота. Зміни лише release metadata version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config у безпечному режимі переходять на всі lane-и перевірок.

Ручні dispatch-і CI запускають `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request-и та push-і в `main` пропускають цей lane і тримають матрицю зосередженою на lane-ах тестів/channel для Node 24.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contract-и працюють як три зважені shard-и, тести bundled Plugin-ів балансуються між шістьма worker-ами extension, малі lane-и unit-тестів core поєднуються в пари, auto-reply працює як чотири збалансовані worker-и з розділенням піддерева reply на shard-и agent-runner, dispatch і commands/state-routing, а agentic конфігурації gateway/plugin розподіляються по наявних jobs agentic Node лише для source замість очікування built artifacts. Широкі тести browser, QA, media та різних інших Plugin-ів використовують свої виділені конфігурації Vitest замість спільного catch-all для Plugin-ів. Jobs shard-ів extension запускають до двох груп конфігурацій Plugin-ів одночасно з одним worker-ом Vitest на групу та більшим heap Node, щоб партії Plugin-ів із важким import не створювали додаткові jobs у CI. Широкий lane agents використовує спільний file-parallel scheduler Vitest, бо в ньому домінують import/планування, а не один окремий повільний тестовий файл. `runtime-config` запускається разом із shard-ом infra core-runtime, щоб спільний runtime shard не тягнув хвіст. Include-pattern shard-и записують записи таймінгів, використовуючи назву shard-а CI, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard-а. `check-additional` тримає compile/canary-роботу package-boundary разом і відокремлює архітектуру топології runtime від покриття gateway watch; shard boundary guard запускає свої малі незалежні guard-и паралельно всередині одного job. Gateway watch, channel tests і shard support-boundary core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви check-ів як легкі jobs verifier-а та водночас уникаючи двох додаткових worker-ів Blacksmith і другої черги споживачів artifact-ів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає APK Play debug. Flavor third-party не має окремого source set або manifest; його lane unit-тестів усе одно компілює цей flavor із прапорцями SMS/call-log у BuildConfig, водночас уникаючи дублювання завдання пакування debug APK при кожному push, релевантному Android.

GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Сприймайте це як шум CI, якщо лише найновіший run для того самого ref теж не падає. Aggregate shard check-и використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже був витіснений.

Ключ автоматичної concurrency CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безкінечно блокувати новіші run-и main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують runs, що вже виконуються.

## Runner-и

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregate-и (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, sharded перевірки channel contract-ів, shard-и `check`, окрім lint, shard-и й aggregate-и `check-additional`, aggregate verifier-и тестів Node, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard-и, test shard-и bundled Plugin-ів, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоду; Docker build-и install-smoke, де витрати часу на чергу 32-vCPU були більші за виграш                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + паралельні швидкі guard-и
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # зібрати dist, коли мають значення lane-и CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній push run CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні runs CI для main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні runs CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
