---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалі перевірки GitHub Actions
summary: Граф завдань CI, перевірки за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T23:48:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8ebc01707b673ab866c584abdfa5ccb8064d580f3a250c60304c2d056d109dc
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для release candidates або широкої перевірки, з Android-доріжками, які вмикаються через `include_android` для окремих ручних запусків. Доріжки prerelease для Plugin лише для релізів містяться в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, виробничий прохід Knip лише для залежностей, зафіксований на найновішій версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, що порівнює виробничі знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей захист завершується помилкою, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні динамічні поверхні Plugin, згенеровані, build, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для «запустити все
перед релізом». Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` з цією ціллю, dispatch-ить `Plugin Prerelease` для
доказів Plugin/package/static/Docker лише для релізу, а також dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
доріжок. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано
специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує шириною live/provider,
переданою в release checks: `minimum` залишає найшвидші критичні для релізу OpenAI/core
доріжки, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media матрицю. Umbrella записує
ідентифікатори dispatch-нутих дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній workflow перезапущено й він став green, перезапустіть лише батьківське
завдання verifier, щоб оновити результат umbrella та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для
звичайного дочірнього full CI, `release-checks` для кожного релізного дочірнього запуску або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує перезапуск невдалої
release box обмеженим після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди та
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs` замість
одного serial завдання. Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск
і діагностику повільних live provider збоїв. Агреговані назви шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Native live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — невідповідне
місце для запуску вкладених Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow один раз збирає й публікує цей image, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
ціль, release run налаштований неправильно й марнуватиме wall clock на дубльовані збірки image.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
і в live/E2E release-path Docker workflow, і в шард package acceptance.
Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для перевірки package artifact
без блокування release workflow. Він розв’язує один candidate з
опублікованої npm spec, trusted `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Profiles охоплюють smoke, package, product, full і custom
вибори Docker lanes. Профіль `package` використовує offline plugin coverage, щоб
перевірка published-package не залежала від live доступності ClawHub. Необов’язкова
Telegram доріжка повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, при цьому шлях
published npm spec зберігається для окремих dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей installable OpenClaw
package як product?» Це відрізняється від звичайного CI: звичайний CI перевіряє
source tree, тоді як package acceptance перевіряє один tarball через той самий
Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує один package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile в GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, перевіряє tarball inventory, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька targeted `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як паралельні targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав його; окремий Telegram dispatch
   усе ще може встановити published npm spec.
4. `summary` завершує workflow помилкою, якщо package resolution, Docker acceptance або
   необов’язкова Telegram доріжка зазнали невдачі.

Джерела candidate:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps в
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  зовнішньо поширених artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає поточному test harness змогу перевіряти
старіші trusted source commits без запуску старої workflow logic.

Profiles відображаються на Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають overlapping package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram proof проти того самого resolved package tarball.
Cross-OS release checks і надалі покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може import-ити browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його встановлено, інакше `openai/gpt-5.4-mini`, тож
install і gateway proof лишаються швидкими та deterministic. Окремі live
provider/model lanes і надалі покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені legacy-compatibility windows для вже
опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball,
`doctor-switch` може пропускати subcase persistence `gateway install --wrapper`,
коли package не exposes цей flag, `update-channel-switch` може prune-ити
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти config metadata migration, водночас
і далі вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може попереджати про local build metadata stamp files,
які вже були shipped. Пізніші packages мають задовольняти modern contracts; ті самі
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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого профілю пакета або точних lane Docker, а не повторному запуску повної валідації релізу.

QA Lab має окремі lane CI поза основним workflow зі smart-scope. Workflow `Parity gate` запускається для відповідних змін PR і вручну; він збирає приватне середовище виконання QA і порівнює agentic-пакети mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгалужує mock parity gate, live lane Matrix, а також live lane Telegram і Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Релізні перевірки запускають live transport lane Matrix і Telegram із детермінованим mock provider і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway також вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення provider покривають окремі набори live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли checkout-нутий CLI це підтримує. Стандартне значення CLI і вхідний параметр ручного workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардує повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу lane QA Lab перед затвердженням релізу; його QA parity gate запускає candidate і baseline пакети як паралельні lane-завдання, а потім завантажує обидва артефакти в невелике завдання звіту для фінального порівняння parity. Не ставте шлях landing PR за `Parity gate`, якщо зміна насправді не зачіпає середовище виконання QA, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check докази.

Workflow `Duplicate PRs After Merge` — це ручний workflow для maintainers, призначений для очищення дублікатів після land. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільне згадане issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код workflow Actions плюс поверхні JavaScript/TypeScript із найвищим ризиком для auth, secrets, sandbox, cron і gateway за допомогою високоточних security queries у категорії `/codeql-critical-security/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel плюс runtime channel plugin, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security-сигнал каналів міг масштабуватися без розширення базової категорії auth/secrets. Завдання network-ssrf-boundary сканує core SSRF, IP parsing, network guard, web-fetch і поверхні політики SSRF у Plugin SDK у категорії `/codeql-critical-security/network-ssrf-boundary`, щоб сигнал межі довіри мережі залишався окремим від security baseline auth/secrets. Завдання mcp-process-tool-boundary сканує MCP servers, helpers виконання процесів, outbound delivery і gates tool-execution агентів у категорії `/codeql-critical-security/mcp-process-tool-boundary`, щоб сигнал меж команд і tools залишався окремим як від baseline auth/secrets, так і від quality shard MCP/process, що не стосується безпеки. Завдання plugin-trust-boundary сканує install plugin, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface і trust surfaces контракту пакета Plugin SDK у категорії `/codeql-critical-security/plugin-trust-boundary`, щоб сигнал supply-chain plugin і runtime-loading залишався окремим як від коду реалізації bundled plugin, так і від quality shard plugin, що не стосується безпеки.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, тому що збірка macOS домінує над часом виконання навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний shard, що не стосується безпеки. Він запускає лише quality queries JavaScript/TypeScript із severity error і безпекою поза scope на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його manual dispatch приймає `profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; вузькі профілі є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано без dispatch решти workflow. Його завдання core-auth-secrets сканує auth, secrets, sandbox, cron і код security boundary gateway в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує контракти реалізації core channel в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, і runtime contracts ACP control-plane в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers і tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання plugin-sdk-reply-runtime сканує inbound reply dispatch Plugin SDK, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-reply-runtime`. Завдання provider-runtime-boundary сканує model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding provider registries в окремій категорії `/codeql-critical-quality/provider-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і entrypoint contracts Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує опублікований package-side source Plugin SDK і helpers контракту пакета plugin в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримання наявної документації відповідно до нещодавно landed змін. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped запуск Docs Agent був створений протягом останньої години. Коли він запускається, він переглядає діапазон commit від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний activity gate. Lane збирає full-suite grouped performance report Vitest, дозволяє Codex вносити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline кількість passing tests. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має проходити перед будь-яким commit. Коли `main` просувається до того, як bot push буде landed, lane rebases валідований patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex міг зберігати таку саму safety posture drop-sudo, як docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдання

| Завдання                        | Призначення                                                                                                      | Коли запускається                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI                    | Завжди для нечернеткових push і PR         |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflows через `zizmor`                                                      | Завжди для нечернеткових push і PR         |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за рекомендаціями npm                                                  | Завжди для нечернеткових push і PR         |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                                 | Завжди для нечернеткових push і PR         |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти       | Зміни, релевантні для Node                 |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, як-от перевірки bundled/plugin-contract/protocol                                 | Зміни, релевантні для Node                 |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                           | Зміни, релевантні для Node                 |
| `checks-node-core-test`          | Шарди тестів ядра Node, за винятком смуг каналів, bundled, контрактів і розширень                                | Зміни, релевантні для Node                 |
| `check`                          | Шардований еквівалент основного локального gate: production-типи, lint, guards, test types і strict smoke        | Зміни, релевантні для Node                 |
| `check-additional`               | Архітектура, межі, guards поверхні розширень, межі пакетів і шарди gateway-watch                                 | Зміни, релевантні для Node                 |
| `build-smoke`                    | Smoke-тести зібраного CLI і startup-memory smoke                                                                 | Зміни, релевантні для Node                 |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                                               | Зміни, релевантні для Node                 |
| `checks-node-compat-node22`      | Смуга збірки й smoke для сумісності з Node 22                                                                    | Ручний запуск CI для релізів               |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                       | Змінено документацію                       |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                          | Зміни, релевантні для Python Skills        |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс регресії спільних runtime import specifier                     | Зміни, релевантні для Windows              |
| `macos-node`                     | Смуга TypeScript-тестів macOS із використанням спільних зібраних артефактів                                      | Зміни, релевантні для macOS                |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                                                  | Зміни, релевантні для macOS                |
| `android`                        | Unit-тести Android для обох варіантів плюс одна збірка debug APK                                                 | Зміни, релевантні для Android              |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                            | Успіх основного CI або ручний запуск       |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
область, не пов’язану з Android: Linux Node shards, bundled-plugin shards, контракти каналів,
сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI
виконують лише Android із `include_android=true`; повна release-парасолька
вмикає Android, передаючи `include_android=true`. Статичні prerelease-перевірки Plugin,
release-only шард `agentic-plugins`, повне batch-перебирання розширень
і Docker-смуги prerelease для Plugin виключено з CI. Docker
prerelease suite запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим push або PR run на тому самому ref. Необов’язковий вхід `target_ref` дає
довіреному викликачеві змогу запустити цей граф для branch, tag або повного commit SHA,
використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує передпольотний маніфест
діяти так, ніби змінилася кожна область із визначеною областю дії.
Редагування CI workflow перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні доріжки залишаються прив’язаними до змін у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-test і вузькі редагування helper/test-routing для контрактів плагінів використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core shards, shards вбудованих плагінів і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node прив’язані до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурації менеджера пакетів і поверхонь CI workflow, які виконують цю доріжку; непов’язані зміни вихідного коду, плагінів, install-smoke і лише тестові зміни залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/package, змін package/manifest вбудованих плагінів і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише вихідного коду вбудованих плагінів, лише тестові редагування та лише документаційні редагування не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення і запускає обмежений Docker-профіль вбудованих плагінів із сукупним timeout команди 240 секунд, причому Docker run кожного сценарію окремо обмежений. Повний шлях зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав за root image smokes. Pushes у `main`, включно з merge commits, не примушують full path; коли changed-scope logic запитала б full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть увімкнути його опціонально, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає image для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість slots основного pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість slots tail-pool, чутливого до providers, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, тоді як легші lanes і далі заповнюють доступні slots. Одна lane, важча за ефективні caps, усе одно може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникнути локальних create storms Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate preflights Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першого збою, і кожна lane має fallback timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують суворіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, такими як `install-e2e`, і розділеними bundled update lanes, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact з поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає і надсилає package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість перебудови. Pulls Docker images повторюються з обмеженим timeout 180 секунд на спробу, щоб завислий registry/cache stream швидко повторювався, а не займав більшу частину critical path CI. Workflow `Package Acceptance` є high-level package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли full release-path coverage цього потребує, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` і далі працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в critical path. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що утримує debugging failed-lane в межах одного targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job збирає live-test image локально для цього rerun. Згенеровані per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package та images із failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділена за update target, щоб repeated npm update і doctor repair passes могли shard разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли працювати паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних lanes на parallel jobs після одного shared package/image preparation step, а bundled-channel update lanes повторюють спробу один раз для transient npm network failures.

Локальна логіка changed-lane розташована в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний gate суворіше ставиться до архітектурних меж, ніж широкий scope платформи CI: зміни production-коду ядра запускають typecheck для core prod і core test, а також core lint/guards; зміни лише core test запускають тільки typecheck для core test і core lint; зміни production-коду розширень запускають typecheck для extension prod і extension test, а також extension lint; зміни лише extension test запускають typecheck для extension test і extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck розширень, бо розширення залежать від цих контрактів ядра, але Vitest-перевірки розширень є явною тестовою роботою. Version bump-и лише release metadata запускають цільові перевірки версій/config/root-dependency. Невідомі зміни root/config fail-safe до всіх check lanes.
Локальна маршрутизація changed-test розташована в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування source спершу віддають перевагу явним mapping-ам, потім sibling tests та
залежним вузлам import-graph. Спільна конфігурація доставки group-room є одним із явних mapping-ів:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests, а також Discord і
Slack delivery regressions, щоб зміна спільного default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію та віддавайте перевагу свіжому warmed box для
широкого proof. Перед тим як витрачати повільний gate на box, який був повторно використаний, протермінований або
щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли потрібні root-файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість того, щоб debug-ити
product test failure. Для навмисних PR із великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у
sync phase понад п’ять хвилин без post-sync output. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diff-ів.

Manual CI dispatches запускають `checks-node-compat-node22` як широке compatibility coverage. Android opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним operator. Звичайні pull requests, push-и в `main` і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожен job залишався малим без надмірного резервування runner-ів: channel contracts запускаються як три зважені shards, малі core unit lanes згруповані парами, auto-reply запускається як чотири збалансовані workers із reply subtree, поділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона обмежена imports/scheduling, а не одним повільним test file. `runtime-config` запускається разом з infra core-runtime shard, щоб спільний runtime shard не володів tail. Include-pattern shards записують timing entries із назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи їхні старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor з SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або ref `main`. Ставтеся до цього як до CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded.
Автоматичний CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runner-и

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs та aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, окрім lint, `check-additional` shards та aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback-яться до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback-яться до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
- [Release channels](/uk/install/development-channels)
