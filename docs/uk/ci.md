---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, контрольні перевірки за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T22:06:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64ba894cef8b847b3e7a298cfeb2c2977f7c589c64998a8fb5feb17a9e359160
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне визначення області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації, а Android-доріжки вмикаються через `include_android` для окремих ручних запусків. Передрелізні доріжки plugin, призначені лише для релізів, живуть в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений на останній версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник завершується помилкою, коли PR додає новий неперевірений невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, згенеровані, build, live-test і package bridge поверхні, які Knip не може розв’язати статично.

`Full Release Validation` — це ручний umbrella workflow для «запустити все
перед релізом». Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` з цією ціллю, dispatch-ить `Plugin Prerelease` для
release-only доказів plugin/package/static/Docker, і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
доріжок. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли
надано published package spec. `release_profile=minimum|stable|full` керує live/provider
шириною, переданою в release checks: `minimum` залишає найшвидші критичні для
релізу OpenAI/core доріжки, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media матрицю. Umbrella записує
ідентифікатори dispatch-нутих дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише parent
verifier job, щоб оновити результат umbrella та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайної повної дочірньої CI, `release-checks` для кожного release child або вужчої
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує перезапуск невдалої
release box у межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди та
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме файлове покриття, але робить повільні live
provider збої простішими для перезапуску й діагностики. Агрегатні
назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються дійсними для ручних
одноразових перезапусків.

Native live media шарди працюють у
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють бінарні файли перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску вкладених Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для вибраного коміту. Live
release workflow один раз збирає й публікує цей image, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
target, release run налаштований неправильно й марнуватиме wall clock на дубльовані
image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
і в live/E2E release-path Docker workflow, і в package acceptance
шард. Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого кандидата в кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує одного кандидата з
published npm spec, trusted `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі покривають smoke, package, product, full і custom
Docker lane selections. Профіль `package` використовує offline plugin coverage, щоб
валідація published-package не залежала від live доступності ClawHub. Опціональна
Telegram-доріжка повторно використовує
artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а
published npm spec path зберігається для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований package OpenClaw
як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує
source tree, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі проходять після встановлення або оновлення.

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
   Docker images за потреби та запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька targeted `docker_lanes`, reusable workflow один раз готує package
   і shared images, а потім розгортає ці lanes як parallel targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав його; standalone Telegram dispatch
   усе ще може встановлювати published npm spec.
4. `summary` завершує workflow помилкою, якщо package resolution, Docker acceptance або
   опціональна Telegram lane завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA.
  Resolver отримує OpenClaw branches/tags, перевіряє, що вибраний commit
  досяжний з історії branch repository або release tag, встановлює deps у
  detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опціональний, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати
старіші trusted source commits без запуску старої workflow logic.

Profiles зіставляються з Docker coverage:

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
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають перехресні package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram-доказ проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
installed package може імпортувати browser-control override із raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4-mini`, тож
install і gateway proof залишаються швидкими й детермінованими. Окремі live
provider/model lanes усе ще покривають ширшу model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені legacy-compatibility windows для вже
published packages. Packages до `2026.4.25`, включно з `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на tarball-omitted files,
`doctor-switch` може пропускати subcase persistence `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune-ити
відсутні `pnpm.patchedDependencies` із tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти config metadata migration, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Published
package `2026.4.26` також може попереджати про local build metadata stamp files,
які вже були shipped. Пізніші packages мають відповідати сучасним contracts; ті
самі conditions завершуються помилкою замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lane замість повторного запуску повної перевірки релізу.

QA Lab має окремі CI lane поза основним workflow із розумним визначенням scope. Workflow `Parity gate` запускається для відповідних змін у PR і вручну; він збирає приватне QA-середовище виконання та порівнює агентні пакети mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Перевірки релізу запускають Matrix і Telegram live transport lane з детермінованим mock provider і моделями, кваліфікованими як mock (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway також вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення provider покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для scheduled і release gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Значення CLI за замовчуванням і ручний ввід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу QA Lab lane перед затвердженням релізу; його QA parity gate запускає candidate і baseline пакети як паралельні lane jobs, а потім завантажує обидва артефакти в невелике report job для фінального порівняння parity. Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test розглядайте це як необов’язковий сигнал і спирайтеся на scope CI/check evidence.

Workflow `Duplicate PRs After Merge` — це ручний workflow для maintainer після landing, призначений для очищення дублікатів. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено, а кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код Actions workflow, а також найризикованіші JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і gateway за допомогою високоточних security queries у категорії `/codeql-critical-security/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти core channel implementation, а також channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security signal каналів міг масштабуватися без розширення базової категорії auth/secrets. Завдання network-ssrf-boundary сканує поверхні core SSRF, IP parsing, network guard, web-fetch і Plugin SDK SSRF policy у категорії `/codeql-critical-security/network-ssrf-boundary`, щоб signal межі network trust залишався окремим від security baseline auth/secrets. Завдання mcp-process-tool-boundary сканує MCP servers, process execution helpers, outbound delivery і agent tool-execution gates у категорії `/codeql-critical-security/mcp-process-tool-boundary`, щоб signal меж command і tool залишався окремим як від baseline auth/secrets, так і від non-security MCP/process quality shard. Завдання plugin-trust-boundary сканує plugin install, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface і trust surfaces контракту пакета Plugin SDK у категорії `/codeql-critical-security/plugin-trust-boundary`, щоб signal plugin supply-chain і runtime-loading залишався окремим як від bundled plugin implementation code, так і від non-security plugin quality shard.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner label, який приймає workflow sanity, і завантажує результати в категорії `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорії `/codeql-critical-security/macos`. Тримайте його поза щоденним default workflow, оскільки macOS build домінує за runtime навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його ручний dispatch приймає `profile=all|plugin-sdk-package-contract`; вузький профіль є першим teaching/iteration hook для запуску одного quality shard ізольовано без dispatch решти workflow. Його завдання core-auth-secrets сканує код меж auth, secrets, sandbox, cron і gateway security у окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers and tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує опублікований package-side Plugin SDK source і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scope або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

Workflow `Docs Agent` — це подієва Codex maintenance lane для підтримання наявної документації відповідною до нещодавно landed змін. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже зрушив далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він перевіряє commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тому один погодинний запуск може покрити всі main changes, накопичені з останнього docs pass.

Workflow `Test Performance Agent` — це подієва Codex maintenance lane для повільних тестів. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC дня. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі test performance fixes зі збереженням покриття замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline test count, що проходить. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push landed, lane робить rebase validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action могла зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та будує CI-маніфест | Завжди для недрафтових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за advisory npm                                    | Завжди для недрафтових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів ядра Node, крім смуг каналів, bundled, contract і extension                     | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент головного локального gate: production-типи, lint, guards, test-типи та strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, boundary, guards для extension-surface, package-boundary і gateway-watch | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke startup-memory                                            | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-смуга                                                    | Ручний CI-запуск для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії специфікаторів імпорту runtime | Зміни, релевантні для Windows      |
| `macos-node`                     | Смуга TypeScript-тестів macOS із використанням спільних зібраних артефактів                  | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка та тести для застосунку macOS                                             | Зміни, релевантні для macOS        |
| `android`                        | Unit-тести Android для обох flavor плюс одна debug APK-збірка                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх основного CI або ручний запуск |

Ручні CI-запуски виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
не-Android scoped-смугу: Linux Node-шарди, bundled-plugin-шарди, контракти
каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки
документації, Python Skills, Windows, macOS і Control UI i18n. Окремі ручні CI-
запуски виконують лише Android із `include_android=true`; повна release
umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease
Plugin, релізний шард `agentic-plugins`, повний batch sweep розширень
і Docker-смуги prerelease Plugin виключено з CI. Docker
prerelease suite запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` із увімкненим gate release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не було скасовано
іншим push або PR-запуском на тому самому ref. Необов’язковий ввід `target_ref` дає
довіреному виклику змогу запустити цей граф для гілки, тегу або повного commit SHA, водночас
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Важчі platform і runtime-смуги розгалужуються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області дії й змушує preflight-маніфест
діяти так, ніби змінилася кожна область дії.

Локальна логіка changed-lane розташована в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи: зміни в production-коді core запускають core prod і core test typecheck плюс core lint/guards, зміни лише в тестах core запускають тільки core test typecheck плюс core lint, зміни в production-коді extension запускають extension prod і extension test typecheck плюс extension lint, а зміни лише в тестах extension запускають extension test typecheck плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів, але Vitest-перевірки extension є явною тестовою роботою. Version bumps лише в release metadata запускають цільові перевірки версії/config/root-dependency. Невідомі зміни root/config fail safe до всіх check lanes.
Локальний changed-test routing розташований у `scripts/test-projects.test-support.mjs` і
навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source надають перевагу явним mappings, потім sibling tests та import-graph
dependents. Shared group-room delivery config є одним із явних mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і
Slack, щоб shared default change падав до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
достатньо harness-wide, що дешевий mapped set не є надійним proxy.

Для Testbox validation запускайте з repo root і надавайте перевагу свіжому warmed box для
широкого proof. Перш ніж витрачати повільний gate на box, який було reused, expired або
який щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли потрібні root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і warmed свіжий, замість того щоб debug
product test failure. Для навмисних PR із великими deletions встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run. `pnpm
testbox:run` також завершує локальний Blacksmith CLI invocation, який залишається у
sync phase понад п’ять хвилин без post-sync output. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих local diffs.

Manual CI dispatches запускають `checks-node-compat-node22` як broad compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускає `Full Release Validation` або явний operator. Звичайні pull requests, push до `main` і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node tests розділено або збалансовано, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes згруповані попарно, auto-reply запускається як чотири збалансовані workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і різні plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Broad agents lane використовує shared Vitest file-parallel scheduler, бо вона домінована import/scheduling, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries з використанням CI shard name, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards concurrently в одному job. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже побудовані, зберігаючи їхні старі check names як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім будує Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI noise, якщо newest run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють нормальні shard failures, але не стають у queue після того, як увесь workflow уже superseded.
Automatic CI concurrency key versioned (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Ранери

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, fast security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), fast protocol/contract/bundled checks, sharded channel contract checks, `check` shards крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в queue раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де queue time для 32-vCPU коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
