---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, перевірки за областю дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-28T18:57:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 336906be783376409b7d36ae038ecb0e6c9cc25707d44d7d9bc19e5be17de2a0
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для реліз-кандидатів або широкої перевірки.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks`
для install smoke, package acceptance, Docker release-path наборів, live/E2E,
OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати
post-publish workflow `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета. `release_profile=minimum|stable|full` керує широтою
live/provider, що передається до release checks: `minimum` лишає найшвидші
OpenAI/core release-critical lanes, `stable` додає стабільний набір
provider/backend, а `full` запускає широку advisory provider/media matrix.
Парасольковий workflow записує id запущених дочірніх запусків, а фінальне
завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх
запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску.
Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише
батьківське завдання verifier, щоб оновити результат парасолькового workflow і
підсумок часу виконання.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного дочірнього
релізного запуску або вужчу релізну групу: `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у
парасольковому workflow. Це утримує повторний запуск невдалого релізного
середовища в межах після цільового виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди та
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs`
замість одного послідовного завдання. Це зберігає те саме файлове покриття й
водночас спрощує повторний запуск і діагностику повільних відмов live provider.
Агреговані назви шардів `native-live-extensions-o-z`,
`native-live-extensions-media` і `native-live-extensions-media-music`
залишаються чинними для ручних одноразових перезапусків.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає
цей artifact і до live/E2E release-path Docker workflow, і до package acceptance
shard. Це зберігає сталі байти пакета в усіх релізних середовищах і уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для перевірки artifact пакета без
блокування релізного workflow. Він розв’язує одного кандидата з опублікованої
npm spec, довіреного `package_ref`, зібраного вибраним harness `workflow_ref`,
HTTPS URL tarball із SHA-256 або tarball artifact з іншого запуску GitHub
Actions, завантажує його як `package-under-test`, а потім повторно використовує
планувальник Docker release/E2E з цим tarball замість повторного пакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
вибори Docker lane. Профіль `package` використовує offline plugin coverage, щоб
перевірка опублікованого пакета не залежала від доступності live ClawHub.
Опційний Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях до
опублікованої npm spec зберігається для standalone dispatches.

## Приймальне тестування пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей
встановлюваний пакет OpenClaw як продукт?" Це відрізняється від звичайного CI:
звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance
перевіряє один tarball через той самий Docker E2E harness, який користувачі
застосовують після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` робить checkout `workflow_ref`, розв’язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, перевіряє інвентар tarball, готує Docker images package-digest,
   коли потрібно, і запускає вибрані Docker lanes проти цього пакета замість
   пакування workflow checkout. Коли профіль вибирає кілька цільових
   `docker_lanes`, reusable workflow готує пакет і спільні images один раз, а
   потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними
   artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав один; standalone Telegram dispatch усе ще
   може встановити опубліковану npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або
   опційний Telegram lane завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте
  це для приймального тестування опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з
  історії гілок репозиторію або релізного тегу, встановлює залежності у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надати для
  зовнішньо поширених artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточному test harness
перевіряти старіші довірені коміти вихідного коду без запуску старої workflow
логіки.

Профілі відповідають Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker chunks release-path
покривають перехресні lanes package/update/plugin, тоді як Package Acceptance
зберігає artifact-native докази bundled-channel compat, offline plugin і
Telegram проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений пакет може імпортувати browser-control override із raw absolute
Windows path.

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих
пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть
використовувати шлях сумісності для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball;
`doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`,
коли пакет не надає цей flag; `update-channel-switch` може вилучити відсутні
`pnpm.patchedDependencies` з fake git fixture, отриманої з tarball, і може
логувати відсутній збережений `update.channel`; plugin smokes можуть читати
legacy install-record locations або приймати відсутність marketplace
install-record persistence; а `plugin-update` може дозволяти migration config
metadata, і водночас усе ще вимагати, щоб install record і no-reinstall behavior
залишалися незмінними. Опублікований пакет `2026.4.26` також може попереджати
про local build metadata stamp files, які вже були випущені. Пізніші пакети
мають відповідати сучасним контрактам; ті самі умови завершуються помилкою
замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім
перевірте дочірній запуск `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Віддавайте перевагу повторному запуску невдалого
package profile або точних Docker lanes замість повторного запуску повної
релізної перевірки.

QA Lab має окремі CI lanes поза головним smart-scoped workflow. Workflow
`Parity gate` запускається на відповідні зміни PR і manual dispatch; він
збирає private QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual
dispatch; він розгортає mock parity gate, live Matrix lane та live Telegram і
Discord lanes як паралельні jobs. Live jobs використовують environment
`qa-live-shared`, а Telegram/Discord використовують Convex leases. Matrix
використовує `--profile fast` для scheduled і release gates, додаючи
`--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI
і manual workflow input залишаються `all`; manual `matrix_profile=all`
dispatch завжди розбиває повне Matrix coverage на jobs `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає release-critical QA Lab lanes перед approval релізу; його QA parity
gate запускає candidate і baseline packs як паралельні lane jobs, а потім
завантажує обидва artifacts у невелике report job для фінального parity
comparison.
Не ставте шлях landing для PR за `Parity gate`, якщо зміна фактично не торкається
QA runtime, model-pack parity або поверхні, якою володіє parity workflow.
Для звичайних виправлень channel, config, docs або unit-test розглядайте це як
опційний сигнал і дотримуйтеся scoped CI/check evidence.

Робочий процес `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після потрапляння змін. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злито, і що кожен дублікат має або спільне referenced issue, або перекривні змінені hunks.

Робочий процес `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код workflows Actions, а також найризиковіші поверхні JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway за допомогою високоточних security queries.

Робочий процес `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшій мітці Blacksmith Linux runner, прийнятій workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, бо macOS build домінує за runtime навіть у чистому стані.

Робочий процес `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише quality queries JavaScript/TypeScript з error-severity і безпеки не стосується, на вузьких high-value поверхнях. Його baseline job сканує ту саму поверхню auth, secrets, sandbox, cron і gateway, що й security workflow. Job config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Job gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Job channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Job plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python, UI і bundled-plugin слід додавати назад лише як scoped або sharded follow-up work після того, як вузькі профілі матимуть стабільні runtime і signal.

Робочий процес `Docs Agent` — це подієво-керована lane супроводу Codex для підтримання наявної документації в узгодженому стані з нещодавно landed змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тому один hourly run може охопити всі зміни main, накопичені з моменту останнього docs pass.

Робочий процес `Test Performance Agent` — це подієво-керована lane супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або зараз виконується цього UTC day. Manual dispatch обходить цей daily activity gate. Lane створює full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має проходити перед будь-яким commit. Коли `main` просувається до того, як bot push потрапить, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд jobs

| Job                              | Призначення                                                                                      | Коли запускається                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only changes, changed scopes, changed plugins і будує CI manifest      | Завжди на non-draft pushes і PRs |
| `security-scm-fast`              | Виявлення приватних ключів і workflow audit через `zizmor`                                        | Завжди на non-draft pushes і PRs |
| `security-dependency-audit`      | Dependency-free production lockfile audit щодо npm advisories                             | Завжди на non-draft pushes і PRs |
| `security-fast`                  | Required aggregate для fast security jobs                                                | Завжди на non-draft pushes і PRs |
| `build-artifacts`                | Збірка `dist/`, Control UI, built-artifact checks і reusable downstream artifacts          | Зміни, що стосуються Node              |
| `checks-fast-core`               | Fast Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                 | Зміни, що стосуються Node              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі stable aggregate check result                         | Зміни, що стосуються Node              |
| `checks-node-extensions`         | Повні bundled-plugin test shards across the plugin suite                                   | Зміни, що стосуються Node              |
| `checks-node-core-test`          | Core Node test shards, excluding channel, bundled, contract, and plugin lanes             | Зміни, що стосуються Node              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types, and strict smoke   | Зміни, що стосуються Node              |
| `check-additional`               | Architecture, boundary, plugin-surface guards, package-boundary, and gateway-watch shards | Зміни, що стосуються Node              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                               | Зміни, що стосуються Node              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, що стосуються Node              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                   | Manual CI dispatch для releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed Skills                                                       | Зміни, що стосуються Python Skills      |
| `checks-windows`                 | Windows-specific process/path tests plus shared runtime import specifier regressions         | Зміни, що стосуються Windows           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                                  | Зміни, що стосуються macOS             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                               | Зміни, що стосуються macOS             |
| `android`                        | Android unit tests для обох flavors plus one debug APK build                                 | Зміни, що стосуються Android           |
| `test-performance-agent`         | Daily Codex slow-test optimization after trusted activity                                    | Main CI success або manual dispatch |

Manual CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android і Control UI i18n. Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не скасовувалася іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дозволяє trusted caller запустити цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Jobs упорядковані так, щоб дешеві checks падали до запуску дорогих:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не standalone jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не очікуючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається з fast Linux lanes, щоб downstream consumers могли стартувати, щойно shared build готовий.
4. Після цього розгалужуються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест
поводитися так, ніби змінилася кожна область з визначеною областю дії.
Зміни CI workflow перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються обмеженими змінами платформного вихідного коду.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-test і вузькі редагування допоміжних засобів/маршрутизації тестів контрактів плагінів використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів пакетованих плагінів і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни вихідного коду, плагінів, install-smoke і лише тестові зміни залишаються на Linux Node-лініях, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/package, змін package/manifest пакетованих плагінів і core-поверхонь plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду пакетованих плагінів, лише тестові редагування і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg пакетованого extension і запускає обмежений Docker-профіль пакетованих плагінів під 240-секундним сукупним таймаутом команди, причому Docker run кожного сценарію обмежено окремо. Повний шлях зберігає QR package install і installer Docker/update-покриття для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull request-ів, які справді зачіпають поверхні installer/package/Docker. Push-и в `main`, включно з merge commits, не примушують повний шлях; коли changed-scope-логіка запитувала б повне покриття на push, workflow залишає швидкий Docker smoke і відкладає full install smoke до нічної або release-валидації. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch-и `install-smoke` можуть увімкнути його, але pull request-и і push-и в `main` його не запускають. QR і installer Docker-тести зберігають власні Dockerfile-и, орієнтовані на інсталяцію. Локальний `test:docker:all` попередньо збирає один спільний live-test-образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: мінімальний Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів чутливого до провайдера tail-пулу 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service-лінії не перевантажували Docker, поки легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні обмеження, усе ще може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Старти ліній за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегатний запуск попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E-контейнери, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планувати нові pooled-лінії після першого збою, і кожна лінія має 120-хвилинний резервний таймаут, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail-лінії використовують жорсткіші обмеження на рівні лінії. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні лінії планувальника, включно з release-only-лініями, такими як `install-e2e`, і розділеними лініями bundled update, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. Повторно використовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credential потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт package з поточного запуску, або завантажує артефакт package з `package_artifact_run_id`; перевіряє інвентар tarball; збирає і публікує package-digest-tagged bare/functional GHCR Docker E2E-образи через Docker layer cache Blacksmith, коли план потребує ліній із встановленим package; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` є високорівневим package gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance-логіка могла перевіряти старіші довірені commits без checkout старого workflow-коду. Release checks запускають спеціальну дельту Package Acceptance для цільового ref: bundled-channel compat, offline plugin fixtures і Telegram package QA щодо визначеного tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу і виконував кілька ліній через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено в `plugins-runtime-services`, коли повне release-path-покриття запитує його, і він зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatch-ів. Застарілі назви агрегатних chunk-ів `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для ручних повторних запусків, але release workflow використовує розділені chunk-и, щоб installer E2E і sweeps install/uninstall пакетованих плагінів не домінували над критичним шляхом. Псевдонім лінії `install-e2e` залишається агрегатним псевдонімом ручного повторного запуску для обох provider installer-ліній. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one-лінії `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, фазовими таймінгами, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що утримує відлагодження невдалої лінії в межах одного цільового Docker job і готує, завантажує або повторно використовує артефакт package для цього запуску; якщо вибрана лінія є live Docker-лінією, цільовий job локально збирає live-test-образ для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний package і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub run і вивести комбіновані/по-лінійні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних ліній і критичного шляху фаз. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матрицю bundled update розділено за ціллю оновлення, щоб повторювані npm update і doctor repair passes могли шардитися разом з іншими bundled-перевірками.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегатний chunk `bundled-channels` залишається доступним для ручних one-shot повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними псевдонімами plugin/runtime, але release workflow використовує розділені chunk-и, щоб channel smokes, update targets, plugin runtime checks і sweeps install/uninstall пакетованих плагінів могли виконуватися паралельно. Цільові dispatch-и `docker_lanes` також розділяють кілька вибраних ліній на паралельні jobs після одного спільного кроку підготовки package/image, а bundled-channel update-лінії повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни core production запускають core prod і core test typecheck плюс core lint/guards, зміни лише core test запускають тільки core test typecheck плюс core lint, зміни extension production запускають extension prod і extension test typecheck плюс extension lint, а зміни лише extension test запускають extension test typecheck плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів, але Vitest extension sweeps є явною тестовою роботою. Version bumps лише release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config fail safe до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування вихідного коду віддають перевагу явним мапінгам, потім sibling tests і import-graph
dependents. Спільна конфігурація доставки group-room є одним із явних мапінгів:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна спільного значення за замовчуванням падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
достатньо широка для harness, що дешевий mapped set не є надійною заміною.

Для валідації Testbox запускайте з кореня репозиторію й віддавайте перевагу свіжій прогрітій машині для
широкого підтвердження. Перш ніж витрачати повільний gate на машину, яку повторно використали, термін дії якої минув або
яка щойно повідомила про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині
цієї машини. Перевірка sanity швидко завершується помилкою, коли зникають обов’язкові кореневі файли, як-от
`pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною
копією PR. Зупиніть цю машину й прогрійте нову замість налагодження
помилки продуктового тесту. Для PR із навмисними великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity.

Ручні CI-dispatch запуски виконують `checks-node-compat-node22` як compatibility-покриття для реліз-кандидата. Звичайні pull request і push до `main` пропускають цей lane й утримують матрицю сфокусованою на test/channel lane для Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені shard-и, тести bundled plugin балансуються між шістьма extension worker-ами, малі core unit lane-и об’єднуються в пари, auto-reply запускається як чотири збалансовані worker-и з поділом reply-піддерева на shard-и agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin config-и розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої окремі Vitest config-и замість спільного plugin catch-all. Extension shard jobs запускають до двох plugin config group одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batch-и не створювали додаткових CI jobs. Широкий agents lane використовує спільний Vitest file-parallel scheduler, бо він залежить переважно від import/scheduling, а не від одного повільного test file. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не відповідав за tail. Include-pattern shard-и записують timing entries з використанням імені CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно в одному job. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрано, зберігаючи свої старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith worker-ів та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе ще компілює цей flavor із BuildConfig flags для SMS/call-log, водночас уникаючи дублювання debug APK packaging job на кожному Android-relevant push.
GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють нормальні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено.
Автоматичний CI concurrency key версійовано (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, shard-и `check`, крім lint, shard-и й aggregates `check-additional`, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де час у queue для 32-vCPU коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Локальні відповідники

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

- [Огляд установлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
