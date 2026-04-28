---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, перевірки за областю та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-28T11:06:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: af18c63cc3564b5be339f2f390c1528e83e71c46243bfa464e2900618104d95f
    source_path: ci.md
    workflow: 16
---

CI запускається для кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати витратні завдання, коли змінилися лише непов’язані частини. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний umbrella workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks` для install
smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA
Lab parity, Matrix і Telegram lanes. Він також може запускати post-publish
workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого
пакета. `release_profile=minimum|stable|full` керує шириною live/provider,
переданою до release checks: `minimum` зберігає найшвидші OpenAI/core
release-critical lanes, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media matrix. Umbrella записує ids
запущених дочірніх run, а фінальне завдання `Verify full validation` повторно
перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань
для кожного дочірнього run. Якщо дочірній workflow перезапущено і він став
зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат
umbrella та зведення часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише
для звичайного повного дочірнього CI, `release-checks` для кожного дочірнього
release, або вужчу release group: `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в umbrella. Це
утримує перезапуск failed release box у межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
`native-live-src-gateway-profiles` jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs`
замість одного serial job. Це зберігає те саме файлове покриття, водночас
спрощуючи повторний запуск і діагностику повільних live provider failures.
Агреговані назви shards `native-live-extensions-o-z`,
`native-live-extensions-media` і `native-live-extensions-media-music`
залишаються чинними для ручних one-shot reruns.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз
перетворити вибраний ref на tarball `release-package-under-test`, а потім
передає цей artifact і до release-path Docker workflow live/E2E, і до package
acceptance shard. Це зберігає байти пакета узгодженими між release boxes і
уникає повторного пакування того самого кандидата в кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact без
блокування release workflow. Він визначає одного кандидата з опублікованої npm
spec, trusted `package_ref`, зібраного вибраним harness `workflow_ref`, HTTPS
tarball URL із SHA-256 або tarball artifact з іншого GitHub Actions run,
завантажує його як `package-under-test`, а потім повторно використовує Docker
release/E2E scheduler із цим tarball замість повторного пакування workflow
checkout. Профілі покривають smoke, package, product, full і custom вибори
Docker lane. Профіль `package` використовує offline plugin coverage, щоб
валідація опублікованого пакета не залежала від live доступності ClawHub.
Необов’язковий Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої
npm spec зберігається для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей
інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI:
звичайний CI валідує дерево джерельного коду, тоді як package acceptance
валідує один tarball через той самий Docker E2E harness, який користувачі
задіюють після встановлення або оновлення.

Workflow має чотири jobs:

1. `resolve_package` робить checkout `workflow_ref`, визначає одного кандидата
   пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`,
   записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує
   обидва як artifact `package-under-test` і друкує source, workflow ref,
   package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує цей
   artifact, валідує inventory tarball, за потреби готує package-digest Docker
   images і запускає вибрані Docker lanes проти цього пакета замість пакування
   workflow checkout. Коли профіль вибирає кілька targeted `docker_lanes`,
   reusable workflow готує package і shared images один раз, а потім розгортає
   ці lanes як parallel targeted Docker jobs з унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він
   запускається, коли `telegram_mode` не `none`, і встановлює той самий artifact
   `package-under-test`, коли Package Acceptance визначив кандидата; standalone
   Telegram dispatch усе ще може встановити опубліковану npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   необов’язковий Telegram lane завершилися помилкою.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це
  для приймання опублікованих beta/stable.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver отримує OpenClaw branches/tags, перевіряє, що вибраний commit
  досяжний з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надавати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness
валідувати старіші trusted source commits без запуску старої workflow logic.

Профілі відповідають Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: full Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker chunks release-path покривають перекривні
package/update/plugin lanes, тоді як Package Acceptance зберігає artifact-native
докази bundled-channel compat, offline plugin і Telegram проти того самого
визначеного package tarball.
Cross-OS release checks досі покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений пакет може імпортувати browser-control override з raw absolute
Windows path.

Package Acceptance має обмежені вікна legacy-compatibility для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема
`2026.4.25-beta.*`, можуть використовувати compatibility path для відомих
private QA entries у `dist/postinstall-inventory.json`, які вказують на файли,
пропущені з tarball, `doctor-switch` може пропустити підвипадок persistence
`gateway install --wrapper`, коли пакет не expose цей flag,
`update-channel-switch` може вилучити відсутні `pnpm.patchedDependencies` з
tarball-derived fake git fixture і може логувати відсутній persisted
`update.channel`, plugin smokes можуть читати legacy install-record locations
або приймати відсутню marketplace install-record persistence, а `plugin-update`
може дозволити config metadata migration, водночас усе ще вимагаючи, щоб install
record і no-reinstall behavior залишалися незмінними. Опублікований пакет
`2026.4.26` також може попереджати про local build metadata stamp files, які вже
було shipped. Пізніші пакети мають відповідати сучасним contracts; ті самі
умови призводять до failure замість warning або skip.

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

Під час налагодження failed package acceptance run починайте зі summary
`resolve_package`, щоб підтвердити package source, version і SHA-256. Потім
перевірте дочірній run `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Надавайте перевагу повторному запуску failed package
profile або exact Docker lanes замість повторного запуску full release
validation.

QA Lab має спеціальні CI lanes поза головним smart-scoped workflow. Workflow
`Parity gate` запускається для відповідних змін PR і manual dispatch; він
збирає private QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час manual
dispatch; він розгортає mock parity gate, live Matrix lane, а також live
Telegram і Discord lanes як parallel jobs. Live jobs використовують environment
`qa-live-shared`, а Telegram/Discord використовують Convex leases. Matrix
використовує `--profile fast` для scheduled і release gates, додаючи
`--fail-fast` лише тоді, коли checked-out CLI його підтримує. CLI default і
manual workflow input залишаються `all`; manual dispatch `matrix_profile=all`
завжди розбиває full Matrix coverage на jobs `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає release-critical QA Lab lanes перед release approval; його QA parity
gate запускає candidate і baseline packs як parallel lane jobs, а потім
завантажує обидва artifacts у малий report job для фінального parity comparison.
Не ставте PR landing path за `Parity gate`, якщо зміна фактично не зачіпає QA
runtime, model-pack parity або surface, яким володіє parity workflow. Для
звичайних виправлень channel, config, docs або unit-test розглядайте це як
необов’язковий signal і дотримуйтеся scoped CI/check evidence.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що
злитий PR справді об’єднано і що кожен дублікат має або спільну згадану проблему,
або перетин змінених hunk-ів.

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу,
а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код Actions workflow
і найризикованіші поверхні JavaScript/TypeScript для автентифікації, секретів, sandbox, cron і
gateway за допомогою високоточних запитів безпеки.

Робочий процес `CodeQL Android Critical Security` — це запланований Android
шард безпеки. Він вручну збирає Android-застосунок для CodeQL на найменшому
Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це щотижневий/ручний macOS
шард безпеки. Він вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS,
відфільтровує результати збирання залежностей із завантаженого SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
стандартним робочим процесом, бо збирання macOS домінує за часом виконання навіть у чистому стані.

Робочий процес `CodeQL Critical Quality` — це відповідний небезпековий шард. Він
запускає лише JavaScript/TypeScript-запити якості з рівнем серйозності error і безпеки
не стосуються, на вузьких високовартісних поверхнях. Його базове завдання сканує ту саму поверхню
автентифікації, секретів, sandbox, cron і gateway, що й робочий процес безпеки. Завдання межі
конфігурації сканує схему конфігурації, міграцію, нормалізацію та IO-контракти в
окремій категорії `/codeql-critical-quality/config-boundary`. Завдання межі
Plugin сканує контракти loader, registry, public-surface і точок входу Plugin SDK
в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте цей робочий процес окремо від безпеки, щоб знахідки якості можна було
планувати, вимірювати, вимикати або розширювати без розмивання сигналу безпеки.
Розширення CodeQL для Swift, Python, UI і bundled-plugin слід додавати назад лише як
обмежену або шардовану подальшу роботу після того, як вузькі профілі матимуть стабільні
час виконання та сигнал.

Робочий процес `Docs Agent` — це подієво-керована лінія підтримки Codex для утримання
наявної документації в узгодженому стані з нещодавно злитими змінами. Він не має чистого розкладу:
успішний неботовий push CI run у `main` може його запустити, а ручний dispatch може
запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли
інший непропущений запуск Docs Agent було створено за останню годину. Коли він запускається, він
переглядає діапазон комітів від попереднього непропущеного Docs Agent source SHA до
поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені після
останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво-керована лінія підтримки Codex
для повільних тестів. Він не має чистого розкладу: успішний неботовий push CI run у
`main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже
запускався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний
бар’єр активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору,
дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття
замість широких рефакторингів, потім повторно запускає звіт повного набору і відхиляє зміни,
що зменшують базову кількість успішних тестів. Якщо в базовому стані є тести з помилками,
Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти,
перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push буде злитий,
лінія rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі patch-и пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберегти таку саму безпечну позицію drop-sudo, як docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує маніфест CI   | Завжди для non-draft push-ів і PR  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push-ів і PR  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                  | Завжди для non-draft push-ів і PR  |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для non-draft push-ів і PR  |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin в усьому наборі extension                               | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, без channel, bundled, contract і extension ліній                     | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch шарди     | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke для startup-memory                                         | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналу зібраних артефактів                                            | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збирання сумісності Node 22 і smoke                                                    | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс спільні регресії runtime import specifier     | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням спільних зібраних артефактів                  | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збирання і тести для macOS-застосунку                                            | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одне збирання debug APK                             | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний dispatch  |

Ручні CI dispatch-и запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
обмежену лінію: Linux Node shards, bundled-plugin shards, channel contracts,
сумісність Node 22, `check`, `check-additional`, build smoke, docs checks,
Python skills, Windows, macOS, Android і Control UI i18n. Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає
довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA,
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі matrix-завдання артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільне збирання готове.
4. Важчі платформні та runtime-лінії розгалужуються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області дії й змушує маніфест попередньої перевірки
діяти так, ніби змінилася кожна область з визначеною областю дії.
Зміни CI workflow перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються обмеженими змінами платформного вихідного коду.
Зміни лише маршрутизації CI, вибрані дешеві зміни фікстур core-test, а також вузькі зміни допоміжних засобів/маршрутизації тестів контракту plugin використовують швидкий шлях маніфесту лише для Node: попередня перевірка, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних шардів core, шардів bundled-plugin і додаткових guard matrices, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами запуску npm/pnpm/UI, конфігурацією package manager і поверхнями CI workflow, які виконують цю лінію; незв’язані зміни вихідного коду, plugin, install-smoke і лише тестів залишаються на лініях Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker profile bundled-plugin із 240-секундним сукупним timeout команди, де Docker run кожного сценарію обмежений окремо. Повний шлях зберігає QR package install і installer Docker/update покриття для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull request, які справді торкаються поверхонь installer/package/Docker. Push у `main`, зокрема merge commits, не примушують виконувати повний шлях; коли логіка changed-scope запитала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release validation. Повільний Bun global install image-provider smoke окремо контролюється через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть увімкнути його, але pull request і push у `main` його не запускають. QR і installer Docker tests зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який установлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-pool, чутливого до provider, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких lane за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за ефективні обмеження, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Запуски lane за замовчуванням рознесені на 2 секунди, щоб уникнути локальних піків створення в Docker daemon; перевизначте це за допомогою `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або іншого значення в мілісекундах. Локальний aggregate попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E containers, виводить статус active-lane, зберігає timings lane для впорядкування longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lanes scheduler, включно з release-only lanes, такими як `install-e2e`, і розділеними bundled update lanes, такими як `bundled-channel-update-acpx`, водночас пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує bare/functional GHCR Docker E2E images з тегом package digest через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або artifact попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти визначеного tarball. Docker suite release-path запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено в `plugins-runtime-services`, коли повне release-path coverage запитує його, і він зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі назви aggregate chunks `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для ручних rerun, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає розділені lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, таблицями slow-lane і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, тож failed lane може повторно використати точні package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для summaries slow-lane і phase critical-path. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матриця bundled update розділена за update target, щоб повторювані npm update і doctor repair passes могли шардитися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних one-shot rerun, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted dispatches `docker_lanes` також розділяють кілька вибраних lanes на parallel jobs після одного спільного кроку package/image preparation, а bundled-channel update lanes повторюють спробу один раз у разі тимчасових npm network failures.

Локальна changed-lane logic міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широка CI platform scope: зміни core production запускають core prod і core test typecheck плюс core lint/guards, зміни лише core test запускають лише core test typecheck плюс core lint, зміни extension production запускають extension prod і extension test typecheck плюс extension lint, а зміни лише extension test запускають extension test typecheck плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, оскільки extensions залежать від цих core contracts, але Vitest extension sweeps є explicit test work. Version bumps лише release metadata запускають targeted version/config/root-dependency checks. Невідомі root/config changes fail safe до всіх check lanes.
Локальна changed-test routing міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: direct test edits запускають самі себе,
source edits віддають перевагу explicit mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із explicit mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб shared default change падав до першого
push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки harness-wide, що cheap mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й для широкого підтвердження віддавайте перевагу свіжому прогрітому box. Перш ніж витрачати повільний gate на box, який повторно використали, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box. Sanity-перевірка швидко завершується помилкою, коли зникають потрібні кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR. Зупиніть цей box і прогрійте свіжий замість налагодження помилки продуктового тесту. Для PR з навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

Ручні CI-диспетчеризації запускають `checks-node-compat-node22` як покриття сумісності реліз-кандидата. Звичайні pull request і push у `main` пропускають цю lane й тримають matrix зосередженою на тестових/channel lanes Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано, щоб кожне job залишалося малим без надмірного резервування runners: channel contracts запускаються як три зважені shards, тести bundled plugin балансуються між шістьма extension workers, малі core unit lanes поєднуються, auto-reply запускається як чотири збалансовані workers з reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Broad agents lane використовує shared Vitest file-parallel scheduler, бо вона домінується імпортом/плануванням, а не належить одному повільному test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів хвостом. Include-pattern shards записують timing entries з назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor з BuildConfig flags для SMS/call-log, уникаючи дублювального debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded.
Автоматичний CI concurrency key версіоновано (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, тому 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де queue time 32-vCPU коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
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

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
