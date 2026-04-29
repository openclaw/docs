---
read_when:
    - Вам потрібно зрозуміти, чому CI-завдання запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, гейти за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T11:37:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3240aa7058dc4f624c45a400cac7a5b2cbbe442a7e17f3f0e1858cc9a876129
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Вона використовує розумне обмеження області, щоб пропускати витратні завдання, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації, причому Android-доріжки вмикаються через `include_android` для окремих ручних запусків. Доріжки передрелізів Plugin лише для релізів живуть в окремому workflow `Plugin Prerelease` і запускаються тільки з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений на останній версії Knip, яку використовує цей script, з вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, що порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей захист падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні динамічні поверхні Plugin, generated, build, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для "запустити все
перед релізом." Він приймає гілку, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` з цією ціллю, dispatch-ить `Plugin Prerelease` для
релізних доказів Plugin/package/static/Docker і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
lanes. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано
опублікований package spec. `release_profile=minimum|stable|full` керує шириною live/provider,
переданою в release checks: `minimum` зберігає найшвидші критичні для релізу доріжки OpenAI/core,
`stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media matrix. Umbrella записує
ids запущених child run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки child run і додає таблиці найповільніших завдань для кожного child
run. Якщо child workflow перезапущено і він став зеленим, перезапустіть лише parent
verifier job, щоб оновити результат umbrella і timing summary.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного full CI child, `release-checks` для кожного release child або вужчу
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує перезапуск failed
release box у межах після точкового виправлення.

Release live/E2E child зберігає широке native покриття `pnpm test:live`, але
запускає його як named shards (`native-live-src-agents`,
`native-live-src-gateway-core`, provider-filtered
`native-live-src-gateway-profiles` jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
provider-filtered music shards) через `scripts/test-live-shard.mjs` замість
одного serial job. Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск
і діагностику повільних live provider failures. Aggregate
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` shard names залишаються чинними для ручних
one-shot reruns.

Native live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирає
workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску nested Docker tests.

Docker-backed live model/backend shards використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для вибраного commit. Live
release workflow збирає і публікує цей image один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness shards запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards незалежно перебудовують повну source Docker
target, release run налаштовано неправильно, і він марнуватиме wall
clock на дубльовані image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
і live/E2E release-path Docker workflow, і package acceptance
shard. Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох child jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує один candidate з
опублікованого npm spec, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Profiles покривають smoke, package, product, full і custom
Docker lane selections. Profile `package` використовує offline plugin coverage, щоб
валідація published-package не залежала від live доступності ClawHub. Optional Telegram lane повторно використовує
artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а
published npm spec path зберігається для standalone dispatches.

## Приймання package

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей installable package OpenClaw
як product?" Це відрізняється від звичайної CI: звичайна CI перевіряє
source tree, тоді як package acceptance перевіряє один tarball через той самий
Docker E2E harness, який користувачі запускають після встановлення або оновлення.

Workflow має чотири jobs:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує один package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, перевіряє tarball inventory, готує package-digest
   Docker images за потреби і запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька targeted `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як parallel targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` optionally викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав його; standalone Telegram dispatch
   усе ще може встановити published npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   optional Telegram lane failed.

Candidate sources:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver fetch-ить branches/tags OpenClaw, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` required.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` optional, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, що запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу current test harness перевіряти
старіші trusted source commits без запуску old workflow logic.

Profiles map to Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` plus `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: full Docker release-path chunks with OpenWebUI
- `custom`: exact `docker_lanes`; required when `suite_profile=custom`

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
installed package може імпортувати browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4-mini`, щоб
install і Gateway proof залишалися швидкими й детермінованими. Dedicated live
provider/model lanes усе ще покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має bounded legacy-compatibility windows для вже
published packages. Packages through `2026.4.25`, including `2026.4.25-beta.*`,
may use the compatibility path for known private QA entries in
`dist/postinstall-inventory.json` that point at tarball-omitted files,
`doctor-switch` may skip the `gateway install --wrapper` persistence subcase
when the package does not expose that flag, `update-channel-switch` may prune
missing `pnpm.patchedDependencies` from the tarball-derived fake git fixture and
may log missing persisted `update.channel`, plugin smokes may read legacy
install-record locations or accept missing marketplace install-record
persistence, and `plugin-update` may allow config metadata migration while still
requiring the install record and no-reinstall behavior to stay unchanged. Later packages must satisfy the modern contracts; the
same conditions fail instead of warn or skip.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної валідації релізу.

QA Lab має окремі CI lanes поза основним smart-scoped workflow. Workflow `Parity gate` запускається для відповідних змін у PR і через manual dispatch; він збирає приватний QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Release checks запускають Matrix і Telegram live transport lanes з детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` та
`mock-openai/gpt-5.5-alt`), щоб contract каналу був ізольований від затримки live model і звичайного запуску provider-Plugin. Live transport gateway також вимикає memory search, оскільки QA parity окремо покриває поведінку пам’яті;
provider connectivity покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для scheduled і release gates,
додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Значення CLI за замовчуванням і manual workflow input залишаються `all`; manual `matrix_profile=all`
dispatch завжди шардує повне покриття Matrix у jobs `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу QA Lab lanes перед схваленням релізу; його QA parity
gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невеликий report job для фінального порівняння parity.
Не ставте шлях landing PR за `Parity gate`, якщо зміна справді не зачіпає QA runtime, model-pack parity або поверхню, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або unit tests розглядайте це як опційний сигнал і дотримуйтеся scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` є manual maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PRs, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільне referenced issue, або перетин changed hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу,
а не повним скануванням репозиторію. Daily і manual runs сканують Actions workflow code
та найризикованіші JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і gateway за допомогою high-precision security queries. Job
channel-runtime-boundary окремо сканує core channel implementation
contracts, а також channel Plugin runtime, gateway, Plugin SDK, secrets і
audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії
JS/TS.

Workflow `CodeQL Android Critical Security` є scheduled Android
security shard. Він вручну збирає Android app для CodeQL на найменшому
Blacksmith Linux runner label, який приймає workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` є weekly/manual macOS
security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS,
відфільтровує dependency build results із завантаженого SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза daily
default workflow, оскільки macOS build домінує runtime навіть коли все чисто.

Workflow `CodeQL Critical Quality` є відповідним non-security shard. Він
запускає лише error-severity, non-security JavaScript/TypeScript quality queries
на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його
job core-auth-secrets сканує auth, secrets, sandbox, cron і gateway security
boundary code в окремій категорії `/codeql-critical-quality/core-auth-secrets`.
Job config-boundary
сканує config schema, migration, normalization та IO contracts в окремій
категорії `/codeql-critical-quality/config-boundary`. Job
gateway-runtime-boundary сканує gateway protocol schemas і server method
contracts в окремій
категорії `/codeql-critical-quality/gateway-runtime-boundary`. Job
channel-runtime-boundary сканує core channel implementation contracts в
окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Job
agent-runtime-boundary сканує command execution, model/provider dispatch,
auto-reply dispatch і queues, а також ACP control-plane runtime contracts в
окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Job
mcp-process-runtime-boundary сканує MCP servers і tool bridges, process
supervision helpers та outbound delivery contracts в окремій
категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Job
memory-runtime-boundary сканує memory host SDK, memory runtime facades,
memory Plugin SDK aliases, memory runtime activation glue і memory doctor
commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`.
Job
ui-control-plane сканує Control UI bootstrap, local persistence, gateway
control flows і task control-plane runtime contracts в окремій
категорії `/codeql-critical-quality/ui-control-plane`. Job
web-media-runtime-boundary сканує core web fetch/search, media IO, media
understanding, image-generation і media-generation runtime contracts в
окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Job
plugin-boundary сканує loader, registry, public-surface і Plugin SDK
entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте workflow окремо від security, щоб quality findings можна було
планувати, вимірювати, вимикати або розширювати без затемнення security signal.
Розширення CodeQL для Swift, Python і bundled-Plugin слід додавати назад як
scoped або sharded follow-up work лише після того, як вузькі profiles матимуть стабільні
runtime і signal.

Workflow `Docs Agent` є event-driven Codex maintenance lane для підтримання
наявної документації узгодженою з нещодавно landed changes. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може
запустити його безпосередньо. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли
інший non-skipped Docs Agent run було створено протягом останньої години. Коли він запускається, він
переглядає commit range від попереднього non-skipped Docs Agent source SHA до
поточного `main`, тож один hourly run може покрити всі main changes, накопичені після
останнього docs pass.

Workflow `Test Performance Agent` є event-driven Codex maintenance lane
для повільних tests. Він не має чистого schedule: успішний non-bot push CI run на
`main` може його запустити, але він пропускається, якщо інша workflow-run invocation уже
запускалася або виконується цього UTC day. Manual dispatch обходить цей daily activity
gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex
робити лише невеликі coverage-preserving test performance fixes замість широких
refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують
passing baseline test count. Якщо baseline має failing tests, Codex може виправляти
лише очевидні failures, а after-agent full-suite report має пройти перед
будь-яким commit. Коли `main` просувається до того, як bot push потрапить у репозиторій, lane
rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push;
conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex
action міг зберегти таку саму drop-sudo safety posture, як docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд jobs

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає CI-маніфест | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за advisories npm                                  | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов'язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/Plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів core Node, крім ліній каналів, bundled, контрактів і розширень                  | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент головного локального gate: prod-типи, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Архітектура, межі, guards поверхні розширень, package-boundary і шарди gateway-watch         | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збірки й smoke для сумісності з Node 22                                                | Ручний запуск CI для релізів       |
| `check-docs`                     | Перевірки форматування документації, lint і broken-link                                      | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python-Skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії runtime import specifier  | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія тестів TypeScript для macOS із використанням спільних зібраних артефактів              | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                        | Unit-тести Android для обох flavor плюс одна debug APK-збірка                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний main CI або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
область не для Android: шарди Linux Node, шарди bundled-Plugin, контракти каналів,
сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS та i18n Control UI. Окремі ручні запуски CI
виконують лише Android із `include_android=true`; повна release umbrella
вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для Plugin,
релізний шард `agentic-plugins`, повний пакетний sweep розширень
і Docker-лінії prerelease для Plugin виключено з CI. Docker-набір prerelease
запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` із увімкненим gate release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не було скасовано
іншим push або PR-запуском на тому самому ref. Необов'язковий input `target_ref` дає
довіреному caller змогу запускати цей граф для branch, tag або повного commit SHA,
використовуючи workflow-файл з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі matrix-завдання артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі лінії платформ і runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує передпольотний маніфест
працювати так, ніби змінилася кожна область із визначеною областю дії.
Зміни CI workflow перевіряють граф Node CI та лінтинг workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються прив’язаними до змін платформного вихідного коду.
Редагування, що стосуються лише маршрутизації CI, вибрані дешеві зміни фікстур core-тестів, а також вузькі зміни допоміжних засобів/маршрутизації тестів контракту plugin використовують швидкий шлях маніфесту лише для Node: передпольотна перевірка, безпека й один task `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних шардів core, шардів bundled-plugin і додаткових матриць захисту, коли змінені файли обмежені поверхнями маршрутизації або допоміжними поверхнями, які швидкий task перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами запуску npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю лінію; не пов’язані зміни вихідного коду, plugin, install-smoke і зміни лише тестів залишаються на лініях Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним тайм-аутом команди 240 секунд, де Docker run кожного сценарію обмежено окремо. Повний шлях зберігає інсталяцію QR package і Docker/update-покриття інсталятора для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull requests, які справді зачіпають поверхні installer/package/Docker. Пуші в `main`, зокрема merge commits, не примушують повний шлях; коли логіка changed-scope запитала б повне покриття на push, workflow залишає швидкий Docker smoke і передає повний install smoke нічній або release-валідації. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з release checks workflow, а ручні запуски `install-smoke` можуть увімкнути його опційно, але pull requests і пуші в `main` його не запускають. QR і installer Docker tests зберігають власні Dockerfiles, зосереджені на інсталяції. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для ліній звичайної функціональності. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-pool, чутливого до провайдера, 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і багатосервісні лінії не перевантажували Docker, тоді як легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Старти ліній за замовчуванням зміщені на 2 секунди, щоб уникнути локальних піків створення в Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний сукупний запуск виконує передпольотну перевірку Docker, видаляє застарілі OpenClaw E2E containers, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, і кожна лінія має 120-хвилинний резервний тайм-аут, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail лінії використовують жорсткіші обмеження для окремих ліній. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні лінії планувальника, зокрема release-only lanes на кшталт `install-e2e` і розділені bundled update lanes на кшталт `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу лінію. Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact із `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні package-installed lanes; і повторно використовує передані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість перебудови. Завантаження Docker image повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторювався замість того, щоб споживати більшу частину критичного шляху CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у багаторазовий Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають власну дельту Package Acceptance для цільового ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA проти визначеного tarball. Docker suite release-path запускає менші розбиті jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька ліній через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path-покриття його запитує, і зберігає окремий chunk `openwebui` лише для dispatches, що стосуються тільки OpenWebUI. Застарілі агреговані назви chunks `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних повторних запусків, але release workflow використовує розділені chunks, щоб installer E2E і перевірки install/uninstall bundled plugin не домінували критичний шлях. Alias лінії `install-e2e` залишається агрегованим alias для ручного повторного запуску обох provider installer lanes. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну all-in-one лінію `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з logs ліній, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує debugging невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана лінія є live Docker lane, цільовий job локально збирає live-test image для цього повторного запуску. Згенеровані команди GitHub для повторного запуску кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли такі значення існують, тож невдала лінія може повторно використати точний package і images з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести комбіновані/цільові команди повторного запуску для кожної лінії; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків slow-lane і phase critical-path. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матриця bundled update розділена за ціллю оновлення, щоб повторні npm update і doctor repair passes могли шардитися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований chunk `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими alias для plugin/runtime, але release workflow використовує розділені chunks, щоб channel smokes, update targets, plugin runtime checks і перевірки install/uninstall bundled plugin могли виконуватися паралельно. Цільові dispatches `docker_lanes` також розділяють кілька вибраних ліній на паралельні jobs після одного спільного етапу підготовки package/image, а bundled-channel update lanes повторюють спробу один раз для тимчасових npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область платформ CI: production-зміни core запускають core prod і core test typecheck плюс core lint/guards, зміни core лише в тестах запускають тільки core test typecheck плюс core lint, production-зміни extension запускають extension prod і extension test typecheck плюс extension lint, а зміни extension лише в тестах запускають extension test typecheck плюс extension lint. Зміни Public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts, але Vitest extension sweeps є явною тестовою роботою. Version bumps лише release metadata запускають цільові version/config/root-dependency checks. Невідомі зміни root/config безпечно переходять до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування вихідного коду надають перевагу явним mappings, потім sibling tests та import-graph
dependents. Спільна конфігурація доставки group-room є одним із явних mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна спільного default падала до першого
push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й надавайте перевагу свіжому прогрітому боксу для
широкого підтвердження. Перед тим як витрачати повільний gate на бокс, який повторно використали, термін дії якого сплив або
який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині
бокса. Sanity-перевірка швидко падає, коли потрібні кореневі файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною
копією PR. Зупиніть цей бокс і прогрійте свіжий замість налагодження
збою продуктового тесту. Для PR з навмисними великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у
фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей запобіжник, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Ручні CI-запуски виконують `checks-node-compat-node22` як широке покриття сумісності. Android є опційним для окремого ручного CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` має дорожче покриття продукту/пакетів, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і окремі ручні CI-запуски тримають цей набір вимкненим.

Найповільніші родини тестів Node розділено або збалансовано, щоб кожна job залишалася малою без надмірного резервування раннерів: контракти каналів виконуються як три зважені шарди, малі core unit lanes поєднані парами, auto-reply запускається як чотири збалансовані worker-и з піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування на built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу й більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона обмежена імпортами/плануванням, а не одним повільним тестовим файлом. `runtime-config` виконується з infra core-runtime shard, щоб shared runtime shard не володів хвостом. Include-pattern shards записують timing entries з назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілу config від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині однієї job. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи свої старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job під час кожного Android-relevant push.
GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже був витіснений.
Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Ранери

| Ранер                            | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, тож 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час у черзі для 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

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
