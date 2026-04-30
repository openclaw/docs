---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, контрольні перевірки за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T03:10:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ec23255d46d3242979fc4bd40f062ffbaf1c825d08ebfd962c847b0a56ab81
    source_path: ci.md
    workflow: 16
---

CI запускається на кожному push до `main` і кожному pull request. Він використовує розумне визначення області, щоб пропускати витратні завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області й розгортають повний звичайний граф CI для release candidate або широкої валідації, з Android-лініями, які вмикаються через `include_android` для окремих ручних запусків. Лінії попереднього випуску plugin, призначені лише для релізу, розміщені в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або через явний ручний dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений на останній версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей guard падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, згенерованих файлів, збірки, live-тестів і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для «запустити все
перед релізом». Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` з цим target, dispatch-ить `Plugin Prerelease` для
release-only plugin/package/static/Docker-підтвердження, а також dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
ліній. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли
надано published package spec. `release_profile=minimum|stable|full` керує live/provider
шириною, що передається в release checks: `minimum` залишає найшвидші OpenAI/core
release-critical лінії, `stable` додає stable provider/backend набір, а
`full` запускає широку advisory provider/media matrix. Umbrella записує
id запущених child run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки child run і додає таблиці найповільніших завдань для кожного child
run. Якщо child workflow перезапущено і він став green, перезапустіть лише parent
verifier job, щоб оновити результат umbrella і summary часу виконання.

Для recovery `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для
звичайного full CI child, `release-checks` для кожного release child або вужчу
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує перезапуск failed
release box у межах після сфокусованого виправлення.

Release live/E2E child зберігає широке native покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs` замість
одного serial job. Це зберігає те саме file coverage, але робить повільні live
provider failures простішими для перезапуску й діагностики. Агреговані
назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються valid для ручних
one-shot reruns.

Native live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирає
workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий shared
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow збирає і push-ить цей image один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness shards запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards незалежно перебудовують повний source Docker
target, release run сконфігуровано неправильно, і він марнуватиме wall
clock на дубльовані image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
як live/E2E release-path Docker workflow, так і package acceptance
shard. Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох child jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує одного candidate з
published npm spec, trusted `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Profiles покривають smoke, package, product, full і custom
Docker lane selections. Profile `package` використовує offline plugin coverage, тому
валідація published-package не залежить від live доступності ClawHub. Опційна
Telegram lane повторно використовує
artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
published npm spec зберігається для standalone dispatches.

## Package acceptance

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей installable OpenClaw
package як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує
source tree, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі застосовують після install або update.

Workflow має чотири jobs:

1. `resolve_package` check out-ить `workflow_ref`, розв’язує одного package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, валідує inventory tarball, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   package замість packing workflow checkout. Коли profile вибирає
   кілька targeted `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім fan out-ить ці lanes як parallel targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий artifact `package-under-test`,
   якщо Package Acceptance розв’язав його; standalone Telegram dispatch
   усе ще може встановити published npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   опційна Telegram lane failed.

Candidate sources:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  OpenClaw release version, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: packs trusted `package_ref` branch, tag або повний commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, installs deps у
  detached worktree і packs його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є required.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` є optional, але його варто надавати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати
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
chunks покривають overlap package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram proof проти того самого resolved package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation слід починати з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
installed package може import-ити browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо задано, інакше `openai/gpt-5.4-mini`, щоб
install і Gateway proof залишалися швидкими та deterministic. Dedicated live
provider/model lanes усе ще покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має bounded legacy-compatibility windows для вже
published packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, omitted from tarball,
`doctor-switch` може пропустити subcase persistence `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune
missing `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може log missing persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або accept missing marketplace install-record
persistence, а `plugin-update` може allow config metadata migration, водночас
усе ще requiring install record і no-reinstall behavior залишатися unchanged. Published
package `2026.4.26` також може warn for local build metadata stamp files,
які вже були shipped. Later packages must satisfy the modern contracts; ті самі
conditions fail instead of warn or skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали смуг, часові показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-смуг замість повторного запуску повної валідації релізу.

QA Lab має окремі CI-смуги поза основним workflow із розумним визначенням області. Workflow `Parity gate` запускається для відповідних змін PR і вручну; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, live-смугу Matrix, а також live-смуги Telegram і Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу запускають live-смуги транспорту Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway також вимикає пошук пам’яті, бо QA parity окремо покриває поведінку пам’яті; підключення провайдерів покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише коли checkout-нутий CLI це підтримує. Стандартне значення CLI та ручний ввід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу смуги QA Lab перед схваленням релізу; його QA parity gate запускає кандидатні та базові пакети як паралельні завдання смуг, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння parity. Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або модульних тестів вважайте це необов’язковим сигналом і спирайтеся на scoped CI/check докази.

Workflow `Duplicate PRs After Merge` — це ручний workflow мейнтейнера для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільну посилану issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким першим проходом security scanner, а не повним скануванням репозиторію. Щоденні, ручні та guard-запуски для non-draft pull request сканують код Actions workflow і найризикованіші поверхні JavaScript/TypeScript auth, secrets, sandbox, cron і gateway з високодостовірними security queries, відфільтрованими до високої/критичної `security-severity` у категорії `/codeql-security-high/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel, а також runtime channel Plugin, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-security-high/channel-runtime-boundary`, щоб security signal каналів міг масштабуватися без розширення baseline категорії auth/secrets. Завдання network-ssrf-boundary сканує поверхні core SSRF, IP parsing, network guard, web-fetch і Plugin SDK SSRF policy у категорії `/codeql-security-high/network-ssrf-boundary`, щоб сигнал межі довіри мережі залишався окремим від security baseline auth/secrets. Завдання mcp-process-tool-boundary сканує MCP servers, helpers виконання процесів, outbound delivery і gates виконання інструментів агентом у категорії `/codeql-security-high/mcp-process-tool-boundary`, щоб сигнал меж command і tool залишався окремим і від baseline auth/secrets, і від non-security MCP/process quality shard. Завдання plugin-trust-boundary сканує trust surfaces встановлення plugin, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface і package contract Plugin SDK у категорії `/codeql-security-high/plugin-trust-boundary`, щоб signal supply-chain і runtime-loading plugin залишався окремим і від коду bundled plugin implementation, і від non-security plugin quality shard. Guard pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму високодостовірну security matrix, що й запланований workflow. Android і macOS CodeQL не входять у стандартні PR-запуски.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшій мітці Blacksmith Linux runner, прийнятій workflow sanity, і завантажує результати в категорії `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це тижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорії `/codeql-critical-security/macos`. Тримайте його поза щоденним стандартним workflow, бо macOS build домінує за часом виконання навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries для вузьких високоцінних поверхонь на меншому Blacksmith Linux runner. Його guard pull request навмисно менший за запланований профіль: non-draft PR запускають лише shards `plugin-boundary` і `plugin-sdk-package-contract`, коли змінюються plugin loader, Plugin SDK, package-contract, CodeQL config або quality workflow files. Його ручний dispatch приймає `profile=all|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; вузькі профілі є навчальними/ітераційними hooks для запуску одного quality shard ізольовано без dispatch решти workflow. Його завдання core-auth-secrets сканує код меж безпеки auth, secrets, sandbox, cron і gateway в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers і tool bridges, process supervision helpers та outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання plugin-sdk-reply-runtime сканує Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-reply-runtime`. Завдання provider-runtime-boundary сканує model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding provider registries в окремій категорії `/codeql-critical-quality/provider-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і entrypoint contracts Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує published package-side source Plugin SDK і helpers plugin package contract в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення Swift, Python і bundled-plugin CodeQL слід повертати як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні runtime і signal.

Workflow `Docs Agent` — це подієво-керована смуга підтримки Codex для збереження наявної документації узгодженою з нещодавно landed змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його тригерити, а manual dispatch може запускати його напряму. Workflow-run invocations пропускаються, коли `main` уже зсунувся вперед або коли інший non-skipped Docs Agent run був створений за останню годину. Коли він запускається, то переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до поточного `main`, тому один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу документації.

Робочий процес `Test Performance Agent` — це керована подіями смуга супроводу Codex для повільних тестів. Вона не має суто розкладу: успішний запуск CI після push не від бота в `main` може її запустити, але вона пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього дня за UTC. Ручний запуск обходить цю щоденну перевірку активності. Смуга створює згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують базову кількість успішних тестів. Якщо базова версія має тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push потрапляє в репозиторій, смуга перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-хостований Ubuntu, щоб дія Codex могла зберегти таку саму позицію безпеки drop-sudo, як і агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR не в draft   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в draft   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для push і PR не в draft   |
| `security-fast`                  | Обов’язкова агрегація для швидких завдань безпеки                                             | Завжди для push і PR не в draft   |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і перевикористовувані downstream артефакти | Зміни, релевантні для Node        |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node        |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node        |
| `checks-node-core-test`          | Shards основних Node-тестів, за винятком смуг каналів, bundled, контрактів і розширень       | Зміни, релевантні для Node        |
| `check`                          | Sharded-еквівалент основного локального gate: production-типи, lint, guards, типи тестів і строгий smoke | Зміни, релевантні для Node        |
| `check-additional`               | Shards архітектури, меж, guards поверхні розширень, меж пакетів і gateway-watch              | Зміни, релевантні для Node        |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke стартової пам’яті                                         | Зміни, релевантні для Node        |
| `checks`                         | Верифікатор тестів каналів зібраних артефактів                                               | Зміни, релевантні для Node        |
| `checks-node-compat-node22`      | Смуга сумісності Node 22: збірка та smoke                                                    | Ручний запуск CI для релізів      |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс регресії спільних специфікаторів імпорту runtime | Зміни, релевантні для Windows     |
| `macos-node`                     | Смуга тестів TypeScript для macOS зі спільними зібраними артефактами                         | Зміни, релевантні для macOS       |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні для macOS       |
| `android`                        | Unit-тести Android для обох варіантів плюс одна debug APK-збірка                             | Зміни, релевантні для Android     |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх CI в main або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, shards bundled-plugin, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease Plugin, release-only shard `agentic-plugins`, повний пакетний sweep розширень і Docker-смуги prerelease Plugin виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation. Ручні запуски використовують унікальну concurrency group, щоб повний набір release-candidate не скасовувався іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-смугами, щоб downstream consumers могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформи та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії розташована в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест
діяти так, ніби змінилася кожна область у межах області дії.
Редагування CI workflow перевіряють граф Node CI і linting workflow, але самі по собі не примушують до нативних збірок Windows, Android або macOS; ці платформні лінії залишаються обмеженими змінами в платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-test і вузькі редагування допоміжних засобів/тестової маршрутизації контракту plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів bundled-plugin і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни вихідного коду, plugin, install-smoke і лише тестові зміни залишаються на лініях Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для Docker/package-поверхонь, змін пакетів/маніфестів bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений bundled-plugin Docker profile з агрегованим таймаутом команди 240 секунд, причому Docker-запуск кожного сценарію обмежується окремо. Повний шлях зберігає QR package install і installer Docker/update покриття для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker-поверхонь. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke-образ, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб installer-робота не чекала після root image smokes. Push-и в `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-валідації. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch-и `install-smoke` можуть увімкнути його, але pull requests і push-и в `main` його не запускають. QR і installer Docker-тести зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника розташована в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів tail-pool 10, чутливу до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб лінії npm install і multi-service не перевантажували Docker, тоді як легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні обмеження, все одно може стартувати з порожнього pool, а потім працює сама, доки не звільнить місткість. Запуски ліній за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат виконує preflight для Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус active-lane, зберігає timings ліній для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна лінія має fallback-таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші обмеження на рівні лінії. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, як-от `install-e2e`, і розділеними bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу лінію. Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker images повторюються з обмеженим таймаутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшу частину критичного шляху CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у багаторазовий Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають власну delta Package Acceptance для цільового ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти визначеного tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька ліній через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage цього вимагає, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі агреговані назви chunk `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` все ще працюють для ручних rerun, але release workflow використовує розділені chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в критичному шляху. Псевдонім лінії `install-e2e` залишається агрегованим псевдонімом ручного rerun для обох provider installer lanes. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість серійної all-in-one лінії `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і командами rerun для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує debugging невдалої лінії одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана лінія є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані GitHub rerun commands для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний package і images із невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для summaries slow-lane і phase critical-path. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матриця bundled update розділена за update target, щоб повторні npm update і doctor repair passes могли шардитися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований chunk `bundled-channels` залишається доступним для ручних одноразових rerun, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime, але release workflow використовує розділені chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted dispatches `docker_lanes` також розділяють кілька вибраних ліній на паралельні jobs після одного спільного кроку package/image preparation, а лінії bundled-channel update повторюються один раз у разі тимчасових npm network failures.

Локальна логіка змінених ліній живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний шлюз суворіший щодо архітектурних меж, ніж широка область платформи CI: зміни у production-коді ядра запускають typecheck для core prod і core test плюс lint/guards ядра, зміни лише в тестах ядра запускають тільки typecheck core test плюс lint ядра, зміни у production-коді розширень запускають typecheck extension prod і extension test плюс lint розширень, а зміни лише в тестах розширень запускають typecheck extension test плюс lint розширень. Зміни публічного Plugin SDK або контрактів Plugin розширюються до typecheck розширень, бо розширення залежать від цих контрактів ядра, але проходи Vitest для розширень є явною тестовою роботою. Зміни лише release-метаданих із підвищенням версії запускають цільові перевірки версії/config/root-залежностей. Невідомі зміни root/config у безпечному режимі переходять до всіх check-ліній.
Локальна маршрутизація змінених тестів живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним мапінгам, потім sibling-тестам і
залежним елементам import-graph. Спільна конфігурація доставки group-room є одним з явних мапінгів:
зміни конфігурації group visible-reply, режиму source reply delivery або
маршруту message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна спільного default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped-набір не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й віддавайте перевагу свіжому прогрітому box для
широкого доказу. Перед тим як витрачати повільний gate на box, який було повторно використано, термін дії якого минув або
який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли потрібні root-файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість налагодження
product test failure. Для навмисних PR із великим видаленням задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у
фазі sync понад п’ять хвилин без post-sync output. Задайте
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Ручні dispatch CI запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push у `main` і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднані в пари, auto-reply запускається як чотири balanced workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона домінована import/scheduling, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не тримав tail. Include-pattern shards записують timing entries з використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все ще повідомляють нормальні shard failures, але не стають у чергу після того, як увесь workflow уже superseded.
Автоматичний CI concurrency key версійований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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

- [Огляд установлення](/uk/install)
- [Канали release](/uk/install/development-channels)
