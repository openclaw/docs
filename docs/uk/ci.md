---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконувалося чи не виконувалося
    - Ви налагоджуєте перевірки GitHub Actions, які не проходять
summary: Граф завдань CI, перевірки за областю охоплення та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-29T02:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e492bdaa71052a36a2130b451ee1b33e01c400a6dc52a5a5f883081b75742aad
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли зміни торкнулися лише непов’язаних ділянок. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA commit, запускає ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує шириною live/provider, що передається в release checks: `minimum` залишає найшвидші критичні для релізу OpenAI/core lanes, `stable` додає стабільний набір provider/backend, а `full` запускає широку рекомендаційну матрицю provider/media. Парасольковий workflow записує ids запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасолькового workflow і зведення часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного повного дочірнього CI, `release-checks` для кожного дочірнього release, або вужчу release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольковому workflow. Це утримує перезапуск невдалого release box обмеженим після цілеспрямованого виправлення.

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але запускає його як іменовані shards (`native-live-src-agents`, `native-live-src-gateway-core`, відфільтровані за provider завдання `native-live-src-gateway-profiles`, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z-other`, `native-live-extensions-xai`, розділені media audio/video shards і відфільтровані за provider music shards) через `scripts/test-live-shard.mjs` замість одного послідовного завдання. Це зберігає те саме покриття файлів, водночас спрощуючи перезапуск і діагностику повільних збоїв live provider. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей artifact і в Docker workflow release-path live/E2E, і в package acceptance shard. Це зберігає bytes пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації package artifact без блокування release workflow. Він розв’язує одного кандидата з опублікованої npm spec, trusted `package_ref`, зібраного за допомогою вибраного harness `workflow_ref`, HTTPS tarball URL із SHA-256 або tarball artifact з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує Docker release/E2E scheduler із цим tarball замість повторного пакування workflow checkout. Профілі охоплюють smoke, package, product, full і custom вибори Docker lane. Профіль `package` використовує offline plugin coverage, щоб валідація опублікованого пакета не залежала від доступності live ClawHub. Необов’язковий Telegram lane повторно використовує artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої npm spec зберігається для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує source tree, тоді як package acceptance валідує один tarball через той самий Docker E2E harness, який користувачі використовують після install або update.

Workflow має чотири завдання:

1. `resolve_package` checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як artifact `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей artifact, валідує inventory tarball, готує Docker images package-digest за потреби та запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні images один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий artifact `package-under-test`, коли Package Acceptance розв’язав його; standalone Telegram dispatch все ще може встановити опубліковану npm spec.
4. `summary` позначає workflow як failed, якщо package resolution, Docker acceptance або необов’язковий Telegram lane зазнали збою.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA. Resolver fetch OpenClaw branches/tags, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або release tag, встановлює deps у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надати для externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted workflow/harness code, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати старі trusted source commits без запуску старої workflow logic.

Profiles зіставляються з Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker chunks release-path охоплюють перетин package/update/plugin lanes, тоді як Package Acceptance зберігає artifact-native bundled-channel compat, offline plugin і Telegram proof проти того самого розв’язаного package tarball.
Cross-OS release checks все ще охоплюють OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path.

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path для відомих private QA entries у `dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball, `doctor-switch` може пропустити підвипадок persistence `gateway install --wrapper`, коли пакет не expose цей flag, `update-channel-switch` може prune відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може log відсутній persisted `update.channel`, plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence, а `plugin-update` може дозволити config metadata migration, водночас і далі вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були shipped. Пізніші пакети мають задовольняти modern contracts; ті самі умови спричиняють failure замість warning або skip.

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

Під час debugging невдалого package acceptance run почніть зі summary `resolve_package`, щоб підтвердити package source, version і SHA-256. Потім перегляньте дочірній run `docker_acceptance` та його Docker artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і rerun commands. Віддавайте перевагу повторному запуску failed package profile або точних Docker lanes замість перезапуску full release validation.

QA Lab має dedicated CI lanes поза основним smart-scoped workflow. Workflow `Parity gate` запускається за matching PR changes і manual dispatch; він збирає private QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases. Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. CLI default і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди розбиває full Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.
Не ставте PR landing path за `Parity gate`, якщо change фактично не торкається QA runtime, model-pack parity або surface, яким володіє parity workflow. Для звичайних channel, config, docs або unit-test fixes розглядайте це як optional signal і дотримуйтесь scoped CI/check evidence.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес супроводжувача для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що злитий PR справді об’єднано, а кожен дублікат має або спільну згадану issue, або перетин змінених hunks.

Робочий процес `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні й ручні запуски сканують код workflow Actions, а також найризикованіші поверхні JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway за допомогою високоточних security queries. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel, а також runtime channel plugin, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки channel міг масштабуватися без розширення базової категорії JS/TS.

Робочий процес `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшій мітці Blacksmith Linux runner, прийнятій workflow sanity, і завантажує результати в категорії `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорії `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, бо macOS build домінує за часом виконання навіть у чистому стані.

Робочий процес `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його baseline job сканує ту саму поверхню auth, secrets, sandbox, cron і gateway, що й security workflow. Завдання config-boundary сканує config schema, migration, normalization та IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python, UI і bundled-plugin слід додавати назад лише як scoped або sharded follow-up work після того, як вузькі профілі матимуть стабільні runtime і signal.

Робочий процес `Docs Agent` — це подієво-керована maintenance lane Codex для підтримання наявної документації узгодженою з нещодавно злитими змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено протягом останньої години. Під час запуску він переглядає діапазон commits від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може охопити всі зміни main, накопичені з останнього docs pass.

Робочий процес `Test Performance Agent` — це подієво-керована maintenance lane Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC дня. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість broad refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline test count, який проходить. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push буде злитий, lane виконує rebase перевіреного patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Виявляє docs-only changes, changed scopes, changed extensions і будує CI manifest            | Завжди для non-draft pushes і PR  |
| `security-scm-fast`              | Виявлення private key і workflow audit через `zizmor`                                        | Завжди для non-draft pushes і PR  |
| `security-dependency-audit`      | Dependency-free production lockfile audit щодо npm advisories                                | Завжди для non-draft pushes і PR  |
| `security-fast`                  | Обов’язковий aggregate для fast security jobs                                                | Завжди для non-draft pushes і PR  |
| `build-artifacts`                | Збірка `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Node-релевантні зміни             |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-релевантні зміни             |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-релевантні зміни             |
| `checks-node-extensions`         | Повні bundled-plugin test shards у всьому extension suite                                    | Node-релевантні зміни             |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes              | Node-релевантні зміни             |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke      | Node-релевантні зміни             |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-релевантні зміни             |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-релевантні зміни             |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-релевантні зміни             |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для releases   |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Змінено docs                      |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-релевантні зміни     |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-релевантні зміни          |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | macOS-релевантні зміни            |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-релевантні зміни            |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-релевантні зміни          |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success або manual dispatch |

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і Control UI i18n. Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не було скасовано іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу trusted caller запускати цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві checks падали до запуску дорогих:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається з fast Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області дії й змушує передполітний маніфест
діяти так, ніби змінилася кожна область із визначеною областю дії.
Зміни workflow CI перевіряють граф Node CI разом із лінтингом workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні доріжки залишаються прив’язаними до змін платформного вихідного коду.
Зміни лише маршрутизації CI, вибрані дешеві зміни фікстур core-test і вузькі зміни допоміжних засобів/маршрутизації тестів контракту plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних шардів core, шардів вбудованих plugin і додаткових матриць захисту, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цю доріжку; непов’язані зміни вихідного коду, plugin, install-smoke і лише тестові зміни залишаються на Linux-доріжках Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих plugin, а також поверхонь core plugin/канал/Gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованих plugin, лише тестові редагування й зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого extension і запускає обмежений Docker-профіль вбудованих plugin під сукупним таймаутом команди 240 секунд, причому Docker-запуск кожного сценарію обмежено окремо. Повний шлях зберігає встановлення QR-пакета й Docker/update-покриття інсталятора для нічних запланованих запусків, ручних запусків, release-перевірок workflow-call і pull request, які справді торкаються поверхонь інсталятора/пакета/Docker. Push до `main`, включно з merge commits, не примушує запускати повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow залишає швидкий Docker smoke і віддає повний install smoke нічній або release-валидації. Повільний Bun global install image-provider smoke окремо контролюється `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть увімкнути його, але pull request і push до `main` його не запускають. QR і Docker-тести інсталятора зберігають власні install-орієнтовані Dockerfile. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: мінімальний runner Node/Git для доріжок installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних доріжок. Визначення Docker-доріжок містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної доріжки за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а чутливу до provider кількість слотів tail-пулу 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких доріжок за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і multi-service не перевантажували Docker, тоді як легші доріжки все ще заповнюють доступні слоти. Одна доріжка, важча за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім працює самостійно, доки не звільнить місткість. Запуски доріжок за замовчуванням рознесено на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний сукупний запуск виконує preflight Docker, видаляє застарілі OpenClaw E2E containers, виводить статус активних доріжок, зберігає timings доріжок для впорядкування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першого збою, а кожна доріжка має запасний таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail доріжки використовують жорсткіші обмеження для окремих доріжок. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні доріжки scheduler, включно з release-only доріжками, такими як `install-e2e`, і розділеними bundled update доріжками, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну збійну доріжку. Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credential потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact із `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує bare/functional GHCR Docker E2E images із тегами package digest через Blacksmith's Docker layer cache, коли план потребує доріжок із установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з package digest замість повторної збірки. Workflow `Package Acceptance` є високорівневим package gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance-логіка могла перевіряти старіші довірені commits без checkout старого workflow-коду. Release checks запускають власну дельту Package Acceptance для цільового ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA проти визначеного tarball. Docker-набір release-path запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька доріжок через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено до `plugins-runtime-services`, коли повне release-path покриття цього вимагає, і він зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі назви сукупних chunk `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для ручних повторних запусків, але release workflow використовує розділені chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на критичному шляху. Alias доріжки `install-e2e` залишається сукупним alias для ручного повторного запуску обох provider installer lanes. Chunk `bundled-channels` запускає розділені доріжки `bundled-channel-*` і `bundled-channel-update-*`, а не серійну all-in-one доріжку `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані доріжки проти підготовлених образів замість chunk jobs, що обмежує налагодження збійної доріжки одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана доріжка є live Docker lane, targeted job локально збирає образ live-test для цього повторного запуску. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, тож збійна доріжка може повторно використати точний пакет і образи зі збійного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділено за update target, щоб повторювані npm update і doctor repair passes могли шардитися разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Сукупний chunk `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними plugin/runtime aliases, але release workflow використовує розділені chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних доріжок на паралельні jobs після одного спільного кроку підготовки package/image, а bundled-channel update lanes один раз повторюються в разі тимчасових npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область дії платформ CI: зміни production core запускають core prod і core test typecheck плюс core lint/guards, зміни лише тестів core запускають лише core test typecheck плюс core lint, зміни production extension запускають extension prod і extension test typecheck плюс extension lint, а зміни лише тестів extension запускають extension test typecheck плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, оскільки extensions залежать від цих core contracts, але sweeps Vitest extension є явною тестовою роботою. Version bumps лише release metadata запускають targeted version/config/root-dependency checks. Невідомі зміни root/config fail safe до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни вихідного коду віддають перевагу явним mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із явних mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна спільного default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й для широкого підтвердження віддавайте перевагу свіжому прогрітому боксу. Перш ніж витрачати повільний gate на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині боксу. Перевірка sanity швидко завершується з помилкою, коли потрібні кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що віддалений стан синхронізації не є надійною копією PR. Зупиніть цей бокс і прогрійте свіжий замість налагодження збою продуктового тесту. Для PR з навмисними великими видаленнями задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity.

Ручні запуски CI виконують `checks-node-compat-node22` як покриття сумісності кандидата на реліз. Звичайні pull request-и та push-и в `main` пропускають цю lane й утримують матрицю сфокусованою на тестових/канальних lane для Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування раннерів: контракти каналів запускаються як три зважені шарди, тести вбудованих plugin-ів балансуються між шістьма extension worker-ами, малі lane-и core unit об'єднуються в пари, auto-reply запускається як чотири збалансовані worker-и з поділом піддерева reply на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node job-ами замість очікування на зібрані артефакти. Широкі browser-, QA-, media- та miscellaneous plugin tests використовують власні конфіги Vitest замість спільного plugin catch-all. Завдання extension shard запускають до двох груп plugin config одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy plugin batches не створювали додаткових CI job-ів. Широкий agents lane використовує спільний Vitest file-parallel scheduler, бо він залежить переважно від імпортів/планування, а не від одного повільного тестового файлу. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не тримав хвіст. Include-pattern shards записують timing entries з назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрано, зберігаючи їхні старі назви check-ів як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith worker-ів та другої черги artifact-consumer.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із прапорцями SMS/call-log BuildConfig, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже було superseded.
Автоматичний concurrency key CI версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують runs, що вже виконуються.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час у черзі 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
