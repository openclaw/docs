---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви діагностуєте перевірки GitHub Actions, які не проходять
summary: Граф завдань CI, перевірки області та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T22:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc6c7704fd482b67430a334cea9d36e0e802609a871e769a6771be8721914acc
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Вона використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження області й розгортають повний звичайний граф CI для реліз-кандидатів або широкої перевірки, а Android-доріжки вмикаються через `include_android` для автономних ручних запусків. Релізні доріжки попереднього випуску Plugin розміщені в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений за найновішою версією Knip, яку використовує цей script, із вимкненим мінімальним віком релізу pnpm для встановлення через `dlx`. Він також запускає `pnpm deadcode:unused-files`, що порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей захист завершується помилкою, коли PR додає новий неперевірений невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, generated, build, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для “запустити все
перед релізом”. Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` з цією ціллю, dispatch-ить `Plugin Prerelease` для
релізного proof plugin/package/static/Docker, а також dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
lanes. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано
специфікацію опублікованого package. `release_profile=minimum|stable|full` керує шириною live/provider,
яка передається в release checks: `minimum` залишає найшвидші OpenAI/core
release-critical lanes, `stable` додає стабільний provider/backend набір, а
`full` запускає широку advisory provider/media matrix. Umbrella записує
ids запущених дочірніх runs, а фінальне job `Verify full validation` повторно перевіряє
поточні conclusions дочірніх runs і додає таблиці найповільніших jobs для кожного дочірнього
run. Якщо дочірній workflow перезапущено й він став green, перезапустіть лише parent
verifier job, щоб оновити результат umbrella та timing summary.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для
звичайного повного CI child, `release-checks` для кожного release child або вужчу
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` чи `npm-telegram` в umbrella. Це утримує перезапуск failed
release box у межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, provider-filtered
jobs `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
provider-filtered music shards) через `scripts/test-live-shard.mjs` замість
одного serial job. Це зберігає те саме file coverage, водночас спрощуючи rerun і діагностику повільних
live provider failures. Агреговані назви shards
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
one-shot reruns.

Native live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs не підходять
для запуску nested Docker tests.

Docker-backed live model/backend shards використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow збирає й push-ить цей image один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness shards запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards самостійно перебудовують повну source Docker
target, release run неправильно налаштований і марнуватиме wall clock на duplicate image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
і в live/E2E release-path Docker workflow, і в package acceptance
shard. Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох child jobs.

`Package Acceptance` — це side-run workflow для перевірки package artifact
без блокування release workflow. Він розв’язує один candidate з
опублікованої npm spec, trusted `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler з цим tarball замість перепакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
Docker lane selections. Профіль `package` використовує offline plugin coverage, щоб
перевірка published-package не залежала від доступності live ClawHub. Опційна
Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
published npm spec зберігається для standalone dispatches.

## Приймання package

Використовуйте `Package Acceptance`, коли питання звучить як “чи працює цей installable OpenClaw
package як product?” Це відрізняється від звичайної CI: звичайна CI перевіряє
source tree, тоді як package acceptance перевіряє один tarball через той самий
Docker E2E harness, який користувачі проходять після install або update.

Workflow має чотири jobs:

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує один package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і виводить source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, перевіряє tarball inventory, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька targeted `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як parallel targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав один; standalone Telegram dispatch
   усе ще може встановлювати published npm spec.
4. `summary` завершує workflow помилкою, якщо package resolution, Docker acceptance або
   опційна Telegram lane завершилися невдало.

Джерела candidate:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію OpenClaw release, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надавати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти
старіші trusted source commits без запуску старої workflow logic.

Profiles відповідають Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні chunks Docker release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають overlapping package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native proof для bundled-channel compat, offline plugin і
Telegram проти того самого resolved package tarball.
Cross-OS release checks і далі покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
installed package може імпортувати browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4-mini`, тому
install і gateway proof залишаються швидкими й deterministic. Dedicated live
provider/model lanes і далі покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має bounded legacy-compatibility windows для вже
published packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, omitted із tarball,
`doctor-switch` може пропускати subcase persistence `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune-ити
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти config metadata migration, водночас і далі
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може попереджати про local build metadata stamp files,
які вже були shipped. Пізніші packages мають відповідати modern contracts; ті самі
conditions завершуються failure замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lane замість повторного запуску повної валідації релізу.

QA Lab має виділені CI lane поза основним workflow зі smart scope. Workflow `Parity gate` запускається для відповідних змін у PR і вручну; він збирає приватний QA runtime і порівнює агентні пакети mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Release checks запускають Matrix і Telegram live transport lane з детермінованим mock provider і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway також вимикає пошук у пам’яті, тому що QA parity окремо покриває поведінку пам’яті; підключення provider покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і release gate, додаючи `--fail-fast` лише коли це підтримує checkout CLI. Типове значення CLI і ручний workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу QA Lab lane перед approval релізу; його QA parity gate запускає candidate і baseline пакети як паралельні lane-завдання, а потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння.
Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналу, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і дотримуйтеся scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` є ручним maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злито і що кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні й ручні запуски сканують код Actions workflow плюс найризиковіші JavaScript/TypeScript поверхні auth, secrets, sandbox, Cron і Gateway із high-precision security queries у категорії `/codeql-critical-security/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel, а також channel plugin runtime, Gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії auth/secrets. Завдання network-ssrf-boundary сканує поверхні core SSRF, IP parsing, network guard, web-fetch і Plugin SDK SSRF policy у категорії `/codeql-critical-security/network-ssrf-boundary`, щоб сигнал network trust boundary залишався окремим від security baseline auth/secrets.
Завдання mcp-process-tool-boundary сканує MCP servers, process execution helpers, outbound delivery і agent tool-execution gates у категорії `/codeql-critical-security/mcp-process-tool-boundary`, щоб сигнал command і tool boundary залишався окремим як від auth/secrets baseline, так і від non-security MCP/process quality shard. Завдання plugin-trust-boundary сканує поверхні довіри plugin install, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface і Plugin SDK package contract у категорії `/codeql-critical-security/plugin-trust-boundary`, щоб сигнали plugin supply-chain і runtime-loading залишалися окремими як від implementation code bundled plugin, так і від non-security plugin quality shard.

Workflow `CodeQL Android Critical Security` є запланованим Android security shard. Він вручну збирає Android app для CodeQL на найменшому label Blacksmith Linux runner, прийнятому workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` є щотижневим/ручним macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним default workflow, тому що macOS build домінує за runtime навіть коли проходить чисто.

Workflow `CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише JavaScript/TypeScript quality queries з error severity і non-security над вузькими high-value поверхнями на меншому Blacksmith Linux runner. Його ручний dispatch приймає
`profile=all|plugin-sdk-package-contract|session-diagnostics-boundary`; вузькі профілі є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано без dispatch решти workflow.
Його
завдання core-auth-secrets сканує код security boundary для auth, secrets, sandbox, Cron і Gateway в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує контракти config schema, migration, normalization і IO в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує контракти реалізації core channel в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers і tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує published package-side Plugin SDK source і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal.
Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні runtime і signal.

Workflow `Docs Agent` є event-driven Codex maintenance lane для підтримання узгодженості наявної документації з нещодавно landed змінами. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запускати його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тому один hourly run може покрити всі main changes, накопичені з останнього docs pass.

Workflow `Test Performance Agent` є event-driven Codex maintenance lane для повільних тестів. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC дня. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push буде landed, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати той самий drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                             | Коли виконується                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає CI-маніфест            | Завжди для нечернеткових push і PR              |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                              | Завжди для нечернеткових push і PR              |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                           | Завжди для нечернеткових push і PR              |
| `security-fast`                  | Обов'язковий агрегат для швидких завдань безпеки                                                        | Завжди для нечернеткових push і PR              |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream-артефакти           | Зміни, релевантні для Node                      |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol                        | Зміни, релевантні для Node                      |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним результатом агрегатної перевірки                     | Зміни, релевантні для Node                      |
| `checks-node-core-test`          | Shards тестів Core Node, за винятком ліній каналів, bundled, контрактів і розширень                     | Зміни, релевантні для Node                      |
| `check`                          | Sharded-еквівалент головного локального gate: production-типи, lint, guards, типи тестів і strict smoke | Зміни, релевантні для Node                      |
| `check-additional`               | Shards архітектури, boundary, guards поверхні розширень, package-boundary і gateway-watch               | Зміни, релевантні для Node                      |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                                        | Зміни, релевантні для Node                      |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                                      | Зміни, релевантні для Node                      |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-лінія                                                               | Ручний CI dispatch для релізів                  |
| `check-docs`                     | Перевірки форматування документації, lint і битих посилань                                              | Документацію змінено                            |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                               | Зміни, релевантні для Python Skills             |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів, а також регресії shared runtime import specifier          | Зміни, релевантні для Windows                   |
| `macos-node`                     | Лінія тестів TypeScript для macOS із використанням спільних зібраних артефактів                         | Зміни, релевантні для macOS                     |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                                         | Зміни, релевантні для macOS                     |
| `android`                        | Unit-тести Android для обох flavor плюс одна збірка debug APK                                           | Зміни, релевантні для Android                   |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                   | Успіх main CI або ручний dispatch               |

Ручні CI dispatches виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped-лінію, крім Android: Linux Node shards, bundled-plugin shards, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS та i18n Control UI. Автономні ручні CI dispatches виконують лише Android із `include_android=true`; повний релізний umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease Plugin, релізний лише shard `agentic-plugins`, повний batch sweep розширень і Docker-лінії prerelease Plugin виключені з CI. Docker-набір prerelease виконується лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation. Ручні запускі використовують унікальну concurrency group, щоб повний набір release-candidate не скасовувався іншим push або PR-запуском на тому самому ref. Необов'язковий вхід `target_ref` дає довіреному викликачеві змогу виконати цей граф для branch, tag або повного commit SHA, використовуючи workflow-файл з обраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Важчі платформні та runtime-лінії після цього розгалужуються: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області охоплення живе в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення області змін і змушує preflight-маніфест
діяти так, ніби змінилася кожна область із визначеною областю охоплення.
Редагування CI workflow перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні lanes залишаються прив’язаними до змін у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування fixture основних тестів і вузькі редагування helper/test-routing контрактів Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних основних shards, shards bundled-Plugin і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє напряму.
Перевірки Windows Node прив’язані до специфічних для Windows wrappers процесів/шляхів, helper-ів npm/pnpm/UI runner, конфігурації package manager і поверхонь CI workflow, які виконують цю lane; непов’язані зміни вихідного коду, Plugin, install-smoke і лише тестові зміни залишаються на Linux Node lanes, щоб вони не резервували Windows worker із 16 vCPU для покриття, яке вже перевіряють звичайні test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled Plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled Plugin, лише тестові редагування й редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker profile bundled-Plugin під 240-секундним сукупним timeout команди, причому Docker run кожного сценарію обмежено окремо. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запланованих запусків, ручних dispatches, workflow-call release checks і pull requests, які справді торкаються поверхонь installer/package/Docker. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-Plugin Docker E2E як окремі jobs, щоб installer work не чекав за root image smokes. Пуші в `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope запитала б full coverage на push, workflow зберігає fast Docker smoke і лишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він запускається за нічним розкладом і з release checks workflow, а ручні dispatches `install-smoke` можуть увімкнути його, але pull requests і пуші в `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для lanes installer/update/plugin-dependency і functional image, який установлює той самий tarball у `/app` для звичайних functionality lanes. Визначення Docker lanes живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner живе в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Ліміти heavy lanes за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за ефективні ліміти, усе одно може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникати локальних Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate виконує Docker preflights, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, і кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, як-от `install-e2e`, і split bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Docker image pulls повторюються з обмеженим 180-секундним timeout на спробу, щоб завислий registry/cache stream швидко повторювався, а не споживав більшість critical path CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти визначеного tarball. Docker suite release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI входить до `plugins-runtime-services`, коли full release-path coverage цього вимагає, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних reruns, але release workflow використовує split chunks, щоб installer E2E і sweeps install/uninstall bundled Plugin не домінували в critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, тож failed lane може повторно використати точні package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і надрукувати combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Запланований live/E2E workflow щодня запускає повний Docker suite release-path. Bundled update matrix розділено за update target, щоб повторні npm update і doctor repair passes могли shard з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate aliases plugin/runtime, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і sweeps install/uninstall bundled Plugin могли виконуватися паралельно. Targeted dispatches `docker_lanes` також розділяють кілька вибраних lanes на parallel jobs після одного спільного кроку package/image preparation, а bundled-channel update lanes повторюють спробу один раз у разі тимчасових npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний перевірочний gate суворіший щодо архітектурних меж, ніж широкий обсяг CI-платформи: зміни production-коду core запускають typecheck для core prod і core test, а також core lint/guards; зміни лише core-тестів запускають тільки typecheck core test плюс core lint; зміни production-коду extension запускають typecheck extension prod і extension test плюс extension lint; а зміни лише extension-тестів запускають typecheck extension test плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів, але Vitest-перевірки extensions є явною тестовою роботою. Version bump лише release-метаданих запускає цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переходять до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним мапінгам, потім sibling-тестам і залежним
елементам import-graph. Спільна конфігурація доставлення group-room є одним із явних мапінгів:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс регресії доставлення Discord і
Slack, щоб зміна спільного default падала ще до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
достатньо широка для harness, що дешевий mapped-набір не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й віддавайте перевагу свіжому warmed box для
широкого proof. Перед тим як витрачати повільний gate на box, який було повторно використано, строк якого минув або
який щойно повідомив про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity-перевірка швидко падає, коли потрібні root-файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що віддалений sync state не є надійною
копією PR. Зупиніть цей box і warmed свіжий замість налагодження
падіння product test. Для навмисних PR із великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається у
sync phase понад п’ять хвилин без post-sync output. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Ручні CI dispatch запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який dispatch-иться `Full Release Validation` або явним оператором. Звичайні pull requests, push-и в `main` і standalone manual CI dispatches не запускають цей suite.

Найповільніші сімейства Node-тестів розділено або збалансовано, щоб кожна job лишалася малою без надмірного резервування runners: channel contracts запускаються як три зважені shards, малі core unit lanes поєднано в пари, auto-reply запускається як чотири збалансовані workers із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують власні спеціалізовані Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона домінується import/scheduling, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів tail. Include-pattern shards записують timing entries з використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині однієї job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи їхні старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи при цьому дублювання debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони й далі повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже був superseded.
Автоматичний CI concurrency key версіоновано (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, extension shards із нижчою вагою, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час черги 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
- [Канали випусків](/uk/install/development-channels)
