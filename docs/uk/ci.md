---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, які не проходять
summary: Граф завдань CI, перевірки області застосування та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T02:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60576e126bd5012b12c62acfb72a991d2c3207e532a5b7137b218ae9b37852d2
    source_path: ci.md
    workflow: 16
---

CI запускається при кожному push до `main` і кожному pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації, з Android-лініями як опціональними через `include_android` для окремих ручних запусків. Релізні лінії попереднього релізу Plugin живуть в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або через явний ручний dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений на останній версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей guard завершується з помилкою, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічного plugin, згенеровані, build, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella-workflow для «запустити все
перед релізом». Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
релізного доказу plugin/package/static/Docker і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
ліній. Він також може запустити post-publish workflow `NPM Telegram Beta E2E`, коли
надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує live/provider
широтою, переданою до release checks: `minimum` залишає найшвидші OpenAI/core
релізно-критичні лінії, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media матрицю. Umbrella записує
ідентифікатори запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього
run. Якщо дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське
verifier-завдання, щоб оновити результат umbrella та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожної релізної дитини або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує повторний запуск невдалої
релізної box обмеженим після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але
запускає його як іменовані shard-и (`native-live-src-agents`,
`native-live-src-gateway-core`, provider-фільтровані
`native-live-src-gateway-profiles` завдання,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shard-и та
provider-фільтровані music shard-и) через `scripts/test-live-shard.mjs` замість
одного serial job. Це зберігає те саме файлове покриття й водночас полегшує повторний запуск
і діагностику повільних live provider помилок. Агреговані назви shard-ів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових повторних запусків.

Native live media shard-и запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску nested Docker tests.

Docker-backed live model/backend shard-и використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow збирає й push-ить цей image один раз, а потім Docker live model,
gateway, CLI backend, ACP bind і Codex harness shard-и запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shard-и незалежно перебудовують повну source Docker
ціль, release run неправильно налаштований і витрачатиме wall clock на дубльовані image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
і до live/E2E release-path Docker workflow, і до package acceptance
shard. Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує один candidate із
опублікованої npm spec, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
вибори Docker lane. Профіль `package` використовує offline plugin coverage, щоб
валідація published-package не залежала від live-доступності ClawHub. Опціональна
Telegram-лінія повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, з
опублікованим npm spec path, збереженим для окремих dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований OpenClaw
пакет як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує
source tree, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі задіюють після install або update.

Workflow має чотири jobs:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, валідує tarball inventory, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   package замість packing workflow checkout. Коли profile вибирає
   кілька цільових `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як паралельні цільові Docker
   jobs з унікальними artifacts.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не є `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав його; standalone Telegram dispatch
   усе ще може встановити опубліковану npm spec.
4. `summary` завершує workflow з помилкою, якщо package resolution, Docker acceptance або
   опціональна Telegram lane зазнали невдачі.

Джерела candidate:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, таку як `openclaw@2026.4.27-beta.2`. Використовуйте це для
  acceptance опублікованої beta/stable.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його з `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опціональний, але його варто надати для
  зовнішньо поширених artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає поточному test harness змогу валідувати
старіші trusted source commits без запуску старої workflow logic.

Profiles мапляться на Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker
chunks release-path покривають overlapping package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram proof проти того самого resolved package tarball.
Cross-OS release checks і далі покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може import-ити browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4-mini`, тож
install і gateway proof залишаються швидкими й детермінованими. Окремі live
provider/model lanes і далі покривають ширше model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені вікна legacy-сумісності для вже
опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, що вказують на файли, пропущені з tarball,
`doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`,
коли package не exposes цей flag, `update-channel-switch` може prune-ити
відсутні `pnpm.patchedDependencies` із tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволити config metadata migration, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може warn для local build metadata stamp files,
які вже були shipped. Пізніші packages мають відповідати modern contracts; ті самі
умови fail замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали доріжок, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-доріжок замість повторного запуску повної перевірки релізу.

QA Lab має окремі CI-доріжки поза основним workflow із розумною областю. Workflow `Parity gate` запускається для відповідних змін у PR і вручну; він збирає приватний QA runtime і порівнює agentic-пакети mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, live Matrix-доріжку та live Telegram і Discord-доріжки як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу запускають live-доріжки транспорту Matrix і Telegram з детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway також вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдерів покривається окремими наборами live-моделі, нативного провайдера та Docker-провайдера. Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли це підтримує перевірений CLI. Типове значення CLI і ручний input workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардує повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає релізно-критичні доріжки QA Lab перед затвердженням релізу; його QA parity gate запускає кандидатний і базовий пакети як паралельні lane jobs, а потім завантажує обидва артефакти в невелике report job для фінального порівняння parity. Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і натомість дотримуйтеся доказів scoped CI/check.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR об’єднано, і що кожен дублікат має або спільну згадану issue, або перекривні змінені hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні, ручні та guard-запуски non-draft pull request сканують код Actions workflow плюс найризикованіші поверхні JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway з високоточними security-запитами в категорії `/codeql-critical-security/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel плюс runtime channel plugin, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security-сигнал каналів міг масштабуватися без розширення базової категорії auth/secrets. Завдання network-ssrf-boundary сканує core SSRF, IP parsing, network guard, web-fetch і поверхні SSRF policy Plugin SDK у категорії `/codeql-critical-security/network-ssrf-boundary`, щоб сигнал межі довіри мережі залишався відокремленим від базового security-рівня auth/secrets. Завдання mcp-process-tool-boundary сканує MCP-сервери, process execution helpers, outbound delivery і agent tool-execution gates у категорії `/codeql-critical-security/mcp-process-tool-boundary`, щоб сигнал межі команд та інструментів залишався відокремленим як від базового рівня auth/secrets, так і від не-security MCP/process quality shard. Завдання plugin-trust-boundary сканує plugin install, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface і trust surfaces контракту пакета Plugin SDK у категорії `/codeql-critical-security/plugin-trust-boundary`, щоб сигнал supply-chain plugin і runtime-loading залишався відокремленим як від коду реалізації bundled plugin, так і від не-security plugin quality shard. Guard pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму critical-security matrix, що й запланований workflow. Android, macOS і не-security quality CodeQL не входять до стандартних PR-запусків.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, бо збірка macOS домінує за часом виконання навіть у чистому стані.

Workflow `CodeQL Critical Quality` — це відповідний не-security shard. Він запускає лише JavaScript/TypeScript quality-запити з error-severity і без security над вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Його manual dispatch приймає `profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; вузькі профілі є teaching/iteration hooks для запуску одного quality shard ізольовано без dispatch решти workflow. Його завдання core-auth-secrets сканує код security boundary для auth, secrets, sandbox, cron і gateway в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує контракти реалізації core channel в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, і runtime contracts ACP control-plane в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP-сервери та tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання plugin-sdk-reply-runtime сканує inbound reply dispatch Plugin SDK, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-reply-runtime`. Завдання provider-runtime-boundary сканує model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding provider registries в окремій категорії `/codeql-critical-quality/provider-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує опублікований package-side source Plugin SDK і helpers контракту plugin package в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу. Swift, Python і bundled-plugin CodeQL expansion слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації в узгодженості з нещодавно landed changes. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він виконується, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може покрити всі main changes, накопичені з моменту останнього docs pass.

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується в цей UTC-день. Manual dispatch обходить цей daily activity gate. Доріжка будує grouped Vitest performance report для full-suite, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправити лише obvious failures, а after-agent full-suite report має пройти перед тим, як щось буде закомічено. Коли `main` просувається вперед до того, як bot push потрапить у репозиторій, доріжка rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                                   | Коли виконується                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та формує маніфест CI                  | Завжди для нечернеткових push і PR            |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                    | Завжди для нечернеткових push і PR            |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо рекомендацій npm                                               | Завжди для нечернеткових push і PR            |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                              | Завжди для нечернеткових push і PR            |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream-артефакти                | Зміни, релевантні для Node                    |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, як-от перевірки bundled/plugin-contract/protocol                              | Зміни, релевантні для Node                    |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                       | Зміни, релевантні для Node                    |
| `checks-node-core-test`          | Шарди тестів ядра Node, за винятком смуг каналів, bundled, контрактів і розширень                            | Зміни, релевантні для Node                    |
| `check`                          | Шардований еквівалент головного локального gate: production-типи, lint, guards, типи тестів і строгий smoke  | Зміни, релевантні для Node                    |
| `check-additional`               | Архітектура, межі, guards поверхні розширень, межі пакетів і шарди gateway-watch                             | Зміни, релевантні для Node                    |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke для пам’яті запуску                                                        | Зміни, релевантні для Node                    |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                                           | Зміни, релевантні для Node                    |
| `checks-node-compat-node22`      | Смуга збірки й smoke для сумісності з Node 22                                                                | Ручний запуск CI для релізів                  |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                   | Документацію змінено                          |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                                    | Зміни, релевантні для Python Skills           |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів, а також регресії спільних runtime-специфікаторів імпорту       | Зміни, релевантні для Windows                 |
| `macos-node`                     | Смуга TypeScript-тестів macOS із використанням спільних зібраних артефактів                                  | Зміни, релевантні для macOS                   |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                                              | Зміни, релевантні для macOS                   |
| `android`                        | Модульні тести Android для обох flavor, а також одна debug APK-збірка                                        | Зміни, релевантні для Android                 |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                        | Успіх CI на main або ручний запуск            |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
обмежену не-Android смугу: Linux Node-шарди, bundled-plugin-шарди, контракти каналів,
сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI
виконують лише Android із `include_android=true`; повна парасолька релізу
вмикає Android, передаючи `include_android=true`. Статичні перевірки Plugin prerelease,
релізний шард `agentic-plugins`, повний пакетний sweep розширень
і Docker-смуги Plugin prerelease виключені з CI. Docker-набір prerelease
виконується лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Ручні запуски використовують
унікальну групу concurrency, щоб повний набір release-candidate не скасовувався
іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає
довіреному виклику змогу виконати цей граф для гілки, тегу або повного SHA коміту,
використовуючи файл workflow з вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-смугами, щоб downstream-споживачі могли почати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує preflight-маніфест
діяти так, ніби змінилася кожна область у межах області охоплення.
Зміни CI workflow перевіряють CI-граф Node разом із лінтингом workflow, але самі по собі не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються прив’язаними до змін у платформному вихідному коді.
Зміни лише маршрутизації CI, вибрані дешеві зміни фікстур core-test, а також вузькі зміни допоміжних засобів/маршрутизації тестів контрактів Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів вбудованих Plugin-ів і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами запуску npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни вихідного коду, Plugin-ів, install-smoke і лише тестові зміни залишаються на лініях Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих Plugin-ів і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованих Plugin-ів, лише тестові зміни та зміни лише документації не резервують Docker worker-и. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення та запускає обмежений Docker-профіль вбудованих Plugin-ів із сукупним таймаутом команди 240 секунд, окремо обмежуючи Docker run для кожного сценарію. Повний шлях зберігає QR package install і installer Docker/update-покриття для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull request-ів, які справді зачіпають поверхні installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR smoke-образ кореневого Dockerfile, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота installer не чекала завершення smoke-перевірок кореневого образу. Пуші в `main`, зокрема merge-коміти, не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-валідації. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch-и `install-smoke` можуть увімкнути його, але pull request-и та пуші в `main` його не запускають. QR і installer Docker-тести зберігають власні Dockerfile-и, сфокусовані на встановленні. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника живе в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної лінії через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Ліміти важких ліній за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service-лінії не перевантажували Docker, тоді як легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні ліміти, все одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить capacity. Старти ліній за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, виводить статус активних ліній, зберігає тривалість ліній для впорядкування longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled-лінії після першої помилки, і кожна лінія має fallback-таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail-лінії використовують жорсткіші per-lane ліміти. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler-лінії, зокрема release-only лінії, як-от `install-e2e`, і розділені bundled update-лінії, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу лінію. Багаторазово використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакетів, типів образів, live-образів, ліній і облікових даних потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає та публікує package-digest-tagged bare/functional GHCR Docker E2E-образи через Docker layer cache Blacksmith, коли план потребує ліній із установленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Pull-и Docker-образів повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий registry/cache stream швидко повторювався замість споживання більшої частини критичного шляху CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у багаторазово використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені коміти без checkout старого workflow-коду. Release checks запускають власну Package Acceptance delta для цільового ref: bundled-channel compat, offline plugin fixtures і Telegram package QA щодо визначеного tarball. Release-path Docker suite запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу й виконував кілька ліній через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path-покриття його запитує, і зберігає окремий chunk `openwebui` лише для dispatch-ів тільки для OpenWebUI. Застарілі aggregate-назви chunk-ів `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для ручних повторних запусків, але release workflow використовує розділені chunks, щоб installer E2E і sweep-и встановлення/видалення вбудованих Plugin-ів не домінували в критичному шляху. Псевдонім лінії `install-e2e` залишається aggregate-псевдонімом ручного повторного запуску для обох provider installer-ліній. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну all-in-one лінію `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із логами ліній, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Вхід workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує налагодження failed-lane одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker lane, цільове завдання локально збирає live-test image для цього повторного запуску. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділено за ціллю оновлення, щоб повторні npm update і doctor repair passes могли шардитися разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує розділені chunks, щоб channel smokes, update targets, plugin runtime checks і sweep-и встановлення/видалення вбудованих Plugin-ів могли виконуватися паралельно. Targeted dispatch-и `docker_lanes` також розділяють кілька вибраних ліній на паралельні jobs після одного спільного кроку підготовки package/image, а bundled-channel update lanes повторюють спробу один раз у разі тимчасових npm network failures.

Локальна логіка змінених ліній живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний контрольний шлюз суворіший щодо архітектурних меж, ніж широкий обсяг платформи CI: зміни продакшн-коду ядра запускають перевірку типів core prod і core test плюс core lint/guards, зміни лише тестів ядра запускають тільки перевірку типів core test плюс core lint, зміни продакшн-коду розширень запускають перевірку типів extension prod і extension test плюс extension lint, а зміни лише тестів розширень запускають перевірку типів extension test плюс extension lint. Зміни публічного Plugin SDK або контракту plugin розширюються до перевірки типів розширень, бо розширення залежать від цих контрактів ядра, але проходи Vitest для розширень є явною тестовою роботою. Версійні оновлення лише метаданих релізу запускають цільові перевірки версії/конфігурації/кореневих залежностей. Невідомі зміни кореня/конфігурації безпечно переходять до всіх ліній перевірок.
Локальна маршрутизація змінених тестів живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування вихідного коду віддають перевагу явним зіставленням, потім сусіднім тестам і залежним
елементам графа імпортів. Спільна конфігурація доставки групової кімнати є одним із явних зіставлень:
зміни до конфігурації видимої відповіді групи, режиму доставки відповіді джерела або
системної підказки message-tool проходять через тести відповідей ядра плюс регресії доставки Discord і
Slack, щоб зміна спільного значення за замовчуванням падала ще до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для тестового каркаса, що дешевий зіставлений набір не є надійним замінником.

Для валідації Testbox запускайте з кореня репозиторію й надавайте перевагу свіжій прогрітій машині для
широкого підтвердження. Перед тим як витрачати повільний шлюз на машину, яку повторно використали, строк дії якої минув або
яка щойно повідомила про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині
машини. Перевірка працездатності швидко падає, коли потрібні кореневі файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що віддалений стан синхронізації не є надійною
копією PR. Зупиніть цю машину й прогрійте нову замість налагодження
падіння продуктового тесту. Для PR з навмисними великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі
синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше
значення в мілісекундах для незвично великих локальних різниць.

Ручні запуски CI виконують `checks-node-compat-node22` як широке покриття сумісності. Android є опційним для окремого ручного CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і окремі ручні запуски CI тримають цей набір вимкненим.

Найповільніші сімейства тестів Node розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування раннерів: контракти каналів запускаються як три зважені шарди, малі core unit лінії об’єднано в пари, auto-reply запускається як чотири збалансовані воркери з піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node завданнями замість очікування на зібрані артефакти. Широкі браузерні, QA, медійні та різні тести plugin використовують власні конфігурації Vitest замість спільного catch-all для plugin. `Plugin Prerelease` балансує тести вбудованих plugin між вісьмома воркерами розширень; ці завдання шардів розширень запускають до двох груп конфігурації plugin одночасно з одним воркером Vitest на групу та більшим heap Node, щоб import-heavy пакети plugin не створювали додаткових завдань CI. Широка лінія agents використовує спільний file-parallel планувальник Vitest, бо в ній домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів хвостом. Include-pattern шарди записують записи таймінгів із назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілу конфігурацію від відфільтрованого shard. `check-additional` тримає compile/canary роботу меж пакетів разом і відділяє архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, тести каналів і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори й уникаючи двох додаткових Blacksmith воркерів та другої черги споживача артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його лінія unit-test усе ще компілює цей flavor із прапорцями SMS/call-log BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK на кожному Android-релевантному push.
GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shard використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні падіння shard, але не стають у чергу після того, як увесь workflow уже було замінено.
Автоматичний ключ concurrency CI версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують поточні запуски.

## Ранери

| Ранер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки docs, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, шарди розширень із меншою вагою, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається настільки CPU-чутливим, що 8 vCPU коштували більше, ніж заощадили; Docker-збірки install-smoke, де час у черзі 32-vCPU коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
