---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються помилкою
summary: Граф завдань CI, гейти області та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-29T02:52:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b66d2f7d1a02955f9e9ee94fa6431c0652f62babde8c502a4b104ea811ee450
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов'язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом." Він приймає branch, tag або повний commit SHA, запускає
ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks`
для install smoke, package acceptance, Docker release-path suites, live/E2E,
OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати
post-publish workflow `NPM Telegram Beta E2E`, коли надано published package spec.
`release_profile=minimum|stable|full` керує широтою live/provider,
переданою в release checks: `minimum` залишає найшвидші OpenAI/core
критично важливі для релізу lanes, `stable` додає стабільний provider/backend set, а
`full` запускає широку advisory provider/media matrix. Парасольковий workflow записує
ідентифікатори запущених дочірніх run, а фінальне завдання `Verify full validation`
повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього
run. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише батьківське
verifier job, щоб оновити результат парасолькового workflow і підсумок часу виконання.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного release child або вужчу
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольковому workflow. Це утримує перезапуск
збійного release box у межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
`native-live-src-gateway-profiles` jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs` замість
одного serial job. Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск
і діагностику повільних live provider failures. Агреговані назви shards
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Native live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте live suites на базі Docker
на звичайних Blacksmith runners, бо container jobs не підходять
для запуску вкладених Docker tests.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз resolve вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
і до live/E2E release-path Docker workflow, і до package acceptance
shard. Це зберігає однакові package bytes у всіх release boxes і уникає
повторного пакування того самого candidate у кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він resolve один candidate з
published npm spec, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler з цим tarball замість перепакування
workflow checkout. Profiles покривають smoke, package, product, full і custom
Docker lane selections. Profile `package` використовує offline plugin coverage, щоб
валідація published-package не залежала від доступності live ClawHub. Опційний
Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
published npm spec збережено для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей installable OpenClaw
package як продукт?" Це відрізняється від звичайного CI: звичайний CI валідує
source tree, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі виконують після install або update.

Workflow має чотири jobs:

1. `resolve_package` checkout `workflow_ref`, resolve один package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, валідує tarball inventory, готує package-digest
   Docker images за потреби та запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька targeted `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як паралельні targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance resolve один; standalone Telegram dispatch
   усе ще може встановити published npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   опційний Telegram lane завершилися невдало.

Джерела candidate:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  release version OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA.
  Resolver fetch гілки/tags OpenClaw, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов'язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати
старі trusted source commits без запуску старої workflow logic.

Profiles зіставляються з Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов'язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають overlapping package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram proof проти того самого resolved package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
installed package може import browser-control override з raw absolute
Windows path.

Package Acceptance має обмежені legacy-compatibility windows для вже
published packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, omitted з tarball,
`doctor-switch` може пропустити subcase з persistence `gateway install --wrapper`,
коли package не expose цей flag, `update-channel-switch` може prune
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може log відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати missing marketplace install-record
persistence, а `plugin-update` може дозволити config metadata migration, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Published
package `2026.4.26` також може warn щодо local build metadata stamp files,
які вже були shipped. Later packages мають відповідати modern contracts; ті самі
conditions fail замість warn або skip.

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

Під час налагодження failed package acceptance run починайте з summary `resolve_package`,
щоб підтвердити package source, version і SHA-256. Потім перевірте
дочірній run `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Надавайте перевагу повторному запуску failed package profile або
точних Docker lanes замість повторного запуску full release validation.

QA Lab має окремі CI-лінії поза основним smart-scoped робочим процесом. Робочий процес
`Parity gate` запускається для відповідних змін у PR і вручну; він
збирає приватне QA-середовище виконання та порівнює mock GPT-5.5 і Opus 4.6
агентні пакети. Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і
вручну; він розгортає mock parity gate, живу лінію Matrix, а також живі
лінії Telegram і Discord як паралельні завдання. Живі завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Matrix
використовує `--profile fast` для запланованих і релізних перевірок, додаючи `--fail-fast` лише
коли витягнутий CLI це підтримує. Стандартне значення CLI і ручний вхід робочого процесу
залишаються `all`; ручний запуск `matrix_profile=all`
завжди ділить повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу лінії QA Lab перед схваленням релізу; його QA parity
gate запускає кандидатний і базовий пакети як паралельні завдання ліній, потім завантажує
обидва артефакти в невелике звітне завдання для фінального порівняння паритету.
Не ставте шлях посадки PR за `Parity gate`, якщо зміна насправді не
торкається QA-середовища виконання, паритету пакетів моделей або поверхні, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов'язковий
сигнал і покладайтеся на scoped CI/check докази.

Робочий процес `Duplicate PRs After Merge` є ручним робочим процесом мейнтейнера для
очищення дублікатів після посадки. За замовчуванням він працює в dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що
посаджений PR змерджено і що кожен дублікат має або спільну згадану issue,
або перекривні змінені фрагменти.

Робочий процес `CodeQL` навмисно є вузьким security scanner першого проходу,
а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код Actions workflow
плюс найризиковіші поверхні JavaScript/TypeScript для автентифікації, секретів, sandbox, cron і
gateway за допомогою high-precision security queries. Завдання
channel-runtime-boundary окремо сканує контракти реалізації core channel
плюс channel plugin runtime, gateway, Plugin SDK, secrets і
audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб сигнал безпеки каналів міг масштабуватися без розширення базової
JS/TS категорії.

Робочий процес `CodeQL Android Critical Security` є запланованим Android
security shard. Він вручну збирає Android app для CodeQL на найменшій
Blacksmith Linux runner label, прийнятній для workflow sanity, і вивантажує результати
в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` є щотижневим/ручним macOS
security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS,
відфільтровує результати dependency build із завантаженого SARIF і вивантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
workflow за замовчуванням, бо macOS build домінує за часом виконання навіть коли чистий.

Робочий процес `CodeQL Critical Quality` є відповідним non-security shard. Він
запускає лише error-severity, non-security JavaScript/TypeScript quality queries
на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його
baseline job сканує ту саму поверхню auth, secrets, sandbox, cron і gateway,
що й security workflow. Завдання config-boundary
сканує config schema, migration, normalization і IO contracts в окремій
категорії `/codeql-critical-quality/config-boundary`. Завдання
gateway-runtime-boundary сканує gateway protocol schemas і server method
contracts в окремій категорії
`/codeql-critical-quality/gateway-runtime-boundary`. Завдання
channel-runtime-boundary сканує core channel implementation contracts в
окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання
agent-runtime-boundary сканує command execution, model/provider dispatch,
auto-reply dispatch і queues, а також ACP control-plane runtime contracts в
окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання
plugin-boundary сканує loader, registry, public-surface і Plugin SDK
entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте workflow окремо від security, щоб quality findings можна було
планувати, вимірювати, вимикати або розширювати без затемнення security signal.
Розширення CodeQL для Swift, Python, UI і bundled-plugin слід додавати назад як
scoped або sharded подальшу роботу лише після того, як вузькі profiles матимуть стабільні
runtime і signal.

Робочий процес `Docs Agent` є подієво-керованою лінією обслуговування Codex для підтримання
наявної документації узгодженою з нещодавно посадженими змінами. Він не має чистого розкладу:
успішний non-bot push CI run на `main` може його запустити, а ручний запуск може
запустити його напряму. Workflow-run виклики пропускаються, коли `main` вже зрушив далі або коли
інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він
переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до
поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з
останнього проходу документації.

Робочий процес `Test Performance Agent` є подієво-керованою лінією обслуговування Codex
для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на
`main` може його запустити, але він пропускається, якщо інший workflow-run invocation вже
запускався або виконується цього UTC дня. Ручний запуск обходить цей daily activity
gate. Лінія будує full-suite grouped Vitest performance report, дозволяє Codex
вносити лише невеликі test performance fixes, що зберігають coverage, замість широких
refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують
passing baseline test count. Якщо baseline має failing tests, Codex може виправляти
лише очевидні failures, а after-agent full-suite report має пройти перед тим,
як щось буде закомічено. Коли `main` просувається до того, як bot push буде посаджено, лінія
ребейзить перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
конфліктні stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex
action могла зберігати ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені scopes, змінені extensions і збирає CI manifest   | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення private key і workflow audit через `zizmor`                                        | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Dependency-free production lockfile audit щодо npm advisories                                | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов'язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs  |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Node-relevant changes              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-relevant changes              |
| `checks-node-extensions`         | Повні bundled-plugin test shards по extension suite                                          | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes              | Node-relevant changes              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke      | Node-relevant changes              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-relevant changes              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-relevant changes             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-relevant changes           |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success або manual dispatch |

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають
кожну scoped lane: Linux Node shards, bundled-plugin shards, channel contracts,
Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks,
Python skills, Windows, macOS, Android і Control UI i18n. Manual runs використовують
унікальну concurrency group, щоб release-candidate full suite не було скасовано
іншим push або PR run на тому самому ref. Необов'язковий вхід `target_ref` дає
trusted caller змогу запустити цей graph проти branch, tag або full commit SHA,
використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок швидкого припинення

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області дії й змушує preflight-маніфест
працювати так, ніби змінилася кожна область у межах області дії.
Зміни CI workflow перевіряють граф Node CI плюс linting workflow, але самі собою не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються прив’язаними до змін у платформному коді.
Зміни лише в маршрутизації CI, вибрані дешеві зміни фікстур core-тестів і вузькі зміни допоміжних засобів контрактів Plugin або маршрутизації тестів використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів вбудованих plugins і додаткових матриць захисту, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни в коді, plugins, install-smoke і лише тестах залишаються на Linux Node-лініях, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих plugins і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді вбудованих plugins, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого розширення й запускає обмежений Docker-профіль вбудованого Plugin із сукупним тайм-аутом команди 240 секунд, причому Docker run кожного сценарію обмежений окремо. Повний шлях зберігає встановлення QR-пакета й Docker/update-покриття інсталятора для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull requests, які справді торкаються поверхонь інсталятора/пакета/Docker. Push до `main`, зокрема merge commits, не примушує повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-валідації. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть увімкнути його, але pull requests і push до `main` його не запускають. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і чутливу до провайдерів кількість слотів хвостового пулу 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і багатосервісні лінії не перевантажували Docker, поки легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Старти ліній за замовчуванням рознесені на 2 секунди, щоб уникати локальних сплесків створення в Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планувати нові pooled-лінії після першої помилки, і кожна лінія має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail-лінії використовують жорсткіші обмеження для кожної лінії. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні лінії планувальника, зокрема release-only лінії на кшталт `install-e2e` і розділені bundled update лінії на кшталт `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу лінію. Багаторазово використовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакетів, типів образів, live-образів, ліній і облікових даних потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та надсилає package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` є високорівневим пакунковим gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у багаторазово використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance-логіка могла перевіряти старіші довірені commits без checkout старого workflow-коду. Release checks запускають власну Package Acceptance delta для цільового ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA щодо визначеного tarball. Docker-набір release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path-покриття запитує його, і зберігає окремий chunk `openwebui` лише для запусків, що стосуються тільки OpenWebUI. Застарілі агрегатні назви chunk `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних повторних запусків, але release workflow використовує розділені chunks, щоб installer E2E і перевірки install/uninstall вбудованих plugins не домінували на критичному шляху. Псевдонім лінії `install-e2e` залишається агрегатним псевдонімом ручного повторного запуску для обох ліній provider installer. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one лінії `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, phase timings, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії щодо підготовлених образів замість chunk jobs, що обмежує налагодження невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker lane, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані команди GitHub rerun для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точні пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub run і вивести комбіновані/цільові команди повторного запуску для кожної лінії; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних ліній і критичного шляху фаз. Запланований live/E2E workflow щодня запускає повний Docker-набір release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися з іншими bundled checks.

Поточні Docker chunks для релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегатний chunk `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними псевдонімами plugin/runtime, але release workflow використовує розділені chunks, щоб channel smokes, цілі оновлень, перевірки plugin runtime і sweep-перевірки install/uninstall вбудованих plugins могли виконуватися паралельно. Цільові запуски `docker_lanes` також розділяють кілька вибраних ліній на паралельні jobs після одного спільного кроку підготовки package/image, а bundled-channel update lanes повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни core production запускають core prod і core test typecheck плюс core lint/guards, зміни лише в core tests запускають тільки core test typecheck плюс core lint, зміни extension production запускають extension prod і extension test typecheck плюс extension lint, а зміни лише в extension tests запускають extension test typecheck плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, оскільки extensions залежать від цих core contracts, але Vitest extension sweeps є явною тестовою роботою. Version bumps лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config fail safe до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни вихідного коду віддають перевагу явним mappings, потім sibling tests і import-graph
dependents. Спільна group-room delivery config є одним із явних mappings:
зміни у group visible-reply config, source reply delivery mode або
message-tool system prompt маршрутизуються через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна спільного default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й надавайте перевагу свіжому прогрітому боксу для
широкого підтвердження. Перш ніж витрачати повільний gate на бокс, який повторно використали, термін дії якого минув або
який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині
бокса. Sanity-перевірка швидко падає, коли потрібні кореневі файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною
копією PR. Зупиніть цей бокс і прогрійте свіжий замість налагодження
помилки продуктового тесту. Для PR із навмисними великими видаленнями задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

Ручні CI-dispatches запускають `checks-node-compat-node22` як покриття сумісності реліз-кандидата. Звичайні pull requests і пуші в `main` пропускають цей lane і тримають матрицю зосередженою на тестових/channel-lanes Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування раннерів: channel contracts запускаються як три зважені shards, тести bundled plugin балансуються між шістьма extension workers, малі core unit lanes об’єднані в пари, auto-reply запускається як чотири збалансовані workers із поділом reply subtree на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широкий agents lane використовує спільний Vitest file-parallel scheduler, бо він залежить переважно від import/scheduling, а не від одного повільного test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries з використанням назви CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі check names як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із BuildConfig flags для SMS/call-log, уникаючи дублювання debug APK packaging job під час кожного Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже був superseded.
Автоматичний CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безкінечно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Раннери

| Раннер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, fast security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), fast protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж економили; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж економив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks використовують fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks використовують fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
