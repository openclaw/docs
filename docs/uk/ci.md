---
read_when:
    - Потрібно з’ясувати, чому завдання CI було або не було запущене
    - Ви діагностуєте перевірки GitHub Actions, що завершуються з помилкою
summary: Граф завдань CI, контрольні перевірки за областю та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-29T08:15:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: fedb986b861ed53f97cb94eecd17b94b1f49008070fb87fb0fad8848ede82fb7
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли зміни торкнулися лише непов’язаних ділянок. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для кандидатів на реліз або широкої перевірки, з Android-ланами, які вмикаються через `include_android` для окремих ручних запусків. Лани попереднього релізу Plugin, призначені лише для релізів, живуть в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production Knip-перевірку лише залежностей, закріплену на останній версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він блокує нові невикористані, незазначені, нерозв’язані, бінарні або каталогові залежності, не вмикаючи повний режим Knip для невикористаних файлів, який залишається ручним аудитом, оскільки OpenClaw навмисно завантажує багато Plugin і runtime-поверхонь через manifests та рядкові specifiers.

`Full Release Validation` — це ручний umbrella workflow для "запустити все перед релізом". Він приймає branch, tag або повний commit SHA, dispatch-ить ручний workflow `CI` з цією ціллю, dispatch-ить `Plugin Prerelease` для release-only доказу plugin/package/static/Docker, а також dispatch-ить `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram ланів. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано published package spec. `release_profile=minimum|stable|full` керує шириною live/provider, яку передають у release checks: `minimum` залишає найшвидші OpenAI/core release-critical лани, `stable` додає stable provider/backend набір, а `full` запускає широку advisory provider/media матрицю. Umbrella записує dispatched child run ids, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки child run і додає таблиці найповільніших завдань для кожного child run. Якщо child workflow перезапущено і він став green, перезапустіть лише parent verifier job, щоб оновити umbrella result і timing summary.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного full CI child, `release-checks` для кожного release child або вужчу release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в umbrella. Це утримує rerun невдалого release box у межах після сфокусованого виправлення.

Release live/E2E child зберігає широке native покриття `pnpm test:live`, але запускає його як named shards (`native-live-src-agents`, `native-live-src-gateway-core`, provider-filtered завдання `native-live-src-gateway-profiles`, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z-other`, `native-live-extensions-xai`, split media audio/video shards і provider-filtered music shards) через `scripts/test-live-shard.mjs` замість одного serial job. Це зберігає те саме файлове покриття, водночас полегшуючи rerun і діагностику повільних live provider failures. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються дійсними для ручних one-shot reruns.

Native live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирає workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed live suites на звичайних Blacksmith runners, бо container jobs є неправильним місцем для запуску nested Docker tests.

Docker-backed live model/backend shards використовують окремий спільний image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live release workflow збирає й push-ить цей image один раз, після чого Docker live model, gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards незалежно перебудовують повну source Docker target, release run налаштований неправильно і марнуватиме wall clock на дубльовані image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей artifact як у live/E2E release-path Docker workflow, так і в package acceptance shard. Це зберігає однакові package bytes між release boxes і уникає повторного repacking того самого candidate у кількох child jobs.

`Package Acceptance` — це side-run workflow для перевірки package artifact без блокування release workflow. Він розв’язує одного candidate з published npm spec, trusted `package_ref`, зібраного за допомогою вибраного harness `workflow_ref`, HTTPS tarball URL із SHA-256 або tarball artifact з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує Docker release/E2E scheduler із цим tarball замість repacking workflow checkout. Профілі покривають smoke, package, product, full і custom Docker lane selections. Профіль `package` використовує offline Plugin покриття, щоб перевірка published-package не залежала від live доступності ClawHub. Необов’язковий Telegram lane повторно використовує artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях published npm spec збережено для standalone dispatches.

## Приймання package

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей installable package OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного package candidate, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як artifact `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 та profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей artifact, перевіряє tarball inventory, готує package-digest Docker images за потреби й запускає вибрані Docker lanes проти цього package замість packing workflow checkout. Коли profile вибирає кілька targeted `docker_lanes`, reusable workflow готує package і shared images один раз, а потім розгортає ці lanes як parallel targeted Docker jobs з унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`, коли Package Acceptance розв’язав його; standalone Telegram dispatch усе ще може встановлювати published npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або optional Telegram lane завершилися невдало.

Джерела candidates:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну OpenClaw release version, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA. Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit досяжний з repository branch history або release tag, встановлює deps у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted workflow/harness code, який запускає test. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші trusted source commits без запуску старої workflow logic.

Profiles зіставляються з Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язковий, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Release-path Docker chunks покривають overlapping package/update/plugin lanes, тоді як Package Acceptance зберігає artifact-native bundled-channel compat, offline Plugin і Telegram proof проти того самого resolved package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Windows packaged і installer fresh lanes також перевіряють, що встановлений package може імпортувати browser-control override із raw absolute Windows path.

Package Acceptance має обмежені legacy-compatibility windows для вже published packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path для відомих private QA entries у `dist/postinstall-inventory.json`, які вказують на tarball-omitted files, `doctor-switch` може пропустити subcase persistence `gateway install --wrapper`, коли package не exposes цей flag, `update-channel-switch` може prune відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може log відсутній persisted `update.channel`, plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence, а `plugin-update` може дозволяти config metadata migration, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior лишалися unchanged. Published package `2026.4.26` також може warn щодо local build metadata stamp files, які вже були shipped. Пізніші packages мають задовольняти modern contracts; ті самі conditions завершуються failure замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, часові показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lane замість повторного запуску повної валідації релізу.

QA Lab має окремі CI lane поза основним workflow з розумною областю дії. Workflow `Parity gate` запускається для відповідних змін PR і через ручний запуск; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lane як паралельні job. Live job використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Перевірки релізу запускають Matrix і Telegram live transport lane з детермінованим mock-провайдером і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway також вимикає пошук у пам’яті, тому що QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли checkout-нутий CLI це підтримує. Стандарт CLI і ручне введення workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу QA Lab lane перед затвердженням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane job, а потім завантажує обидва артефакти в невелику report job для фінального порівняння parity.
Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або unit-тестів вважайте це опційним сигналом і дотримуйтеся scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів, призначений для очищення дублікатів після land. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR merged і що кожен дублікат має або спільну referenced issue, або overlapping changed hunks.

Workflow `CodeQL` навмисно є вузьким першим проходом security scanner, а не повним sweep репозиторію. Щоденні та ручні запуски сканують код Actions workflow плюс найризикованіші JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і gateway за допомогою high-precision security queries. Job channel-runtime-boundary окремо сканує core channel implementation contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб signal безпеки каналу міг масштабуватися без розширення базової категорії JS/TS.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшому label Blacksmith Linux runner, прийнятому workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантажуваного SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним стандартним workflow, бо macOS build домінує runtime навіть коли чистий.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише JavaScript/TypeScript quality queries з error severity і безпековою тематикою вимкненою над вузькими high-value surfaces на меншому Blacksmith Linux runner. Його job core-auth-secrets сканує код auth, secrets, sandbox, cron і gateway security boundary в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Job config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Job gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Job channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Job agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Job mcp-process-runtime-boundary сканує MCP servers and tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Job memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Job ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Job web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Job plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без приховування security signal.
Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні runtime і signal.

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації узгодженою з нещодавно landed changes. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запускати його напряму. Workflow-run invocation пропускаються, коли `main` просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, то переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тому один щогодинний запуск може покрити всі main changes, накопичені з часу останнього docs pass.

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей daily activity gate. Lane збирає full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти, перш ніж щось буде committed. Коли `main` просувається до того, як bot push lands, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд job

| Job                              | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only changes, changed scopes, changed extensions і будує CI manifest            | Завжди для non-draft pushes і PRs |
| `security-scm-fast`              | Виявлення private key і workflow audit через `zizmor`                                        | Завжди для non-draft pushes і PRs |
| `security-dependency-audit`      | Dependency-free production lockfile audit щодо npm advisories                                | Завжди для non-draft pushes і PRs |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Node-relevant changes              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                 | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, без channel, bundled, contract і extension lanes                      | Node-relevant changes              |
| `check`                          | Sharded еквівалент main local gate: prod types, lint, guards, test types і strict smoke      | Node-relevant changes              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-relevant changes              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-relevant changes             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-relevant changes           |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success або manual dispatch |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну лінію поза Android-областю: Linux Node-шарди, шарди bundled-plugin, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android із `include_android=true`; повна парасолька релізу вмикає Android, передаючи `include_android=true`. Статичні перевірки попереднього випуску Plugin, лише релізний шард `agentic-plugins`, повний пакетний прогін extension і Docker-лінії попереднього випуску Plugin вилучено з CI. Набір попереднього випуску Docker виконується лише тоді, коли `Full Release Validation` запускає окремий робочий процес `Plugin Prerelease` з увімкненим шлюзом релізної валідації. Ручні запуски використовують унікальну групу конкурентності, щоб повний набір для кандидата в реліз не було скасовано іншим запуском push або PR на тому самому ref. Необов’язковий ввід `target_ref` дає змогу довіреному викликачеві виконати цей граф для гілки, тегу або повного commit SHA, використовуючи файл робочого процесу з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок швидкого збою

Завдання впорядковано так, щоб дешеві перевірки завершувалися збоєм до запуску дорогих:

1. `preflight` визначає, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються збоєм, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перетинається зі швидкими Linux-лініями, щоб нижчі споживачі могли стартувати, щойно спільний build буде готовий.
4. Після цього розгалужуються важчі платформні та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає визначення changed-scope і змушує preflight manifest діяти так, ніби змінилася кожна scoped area.
Редагування робочого процесу CI валідують граф Node CI плюс linting робочих процесів, але самі по собі не примушують збірки Windows, Android або macOS native; ці платформні лінії залишаються обмеженими змінами платформного вихідного коду.
Редагування лише маршрутизації CI, вибрані дешеві редагування core-test fixtures і вузькі редагування helper/test-routing для контрактів Plugin використовують швидкий Node-only шлях manifest: preflight, security і один task `checks-fast-core`. Цей шлях оминає build artifacts, сумісність із Node 22, контракти каналів, повні core-шарди, bundled-plugin шарди та додаткові guard-матриці, коли змінені файли обмежено поверхнями routing або helper, які швидкий task перевіряє напряму.
Windows Node-перевірки обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни source, Plugin, install-smoke і test-only залишаються на Linux Node-лініях, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряють звичайні тестові шарди.
Окремий робочий процес `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають fast path для Docker/package поверхонь, змін bundled plugin package/manifest, а також core plugin/channel/gateway/Plugin SDK поверхонь, які перевіряють Docker smoke jobs. Source-only зміни bundled Plugin, test-only редагування та docs-only редагування не резервують Docker workers. Fast path один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із 240-секундним aggregate command timeout, причому Docker run кожного сценарію обмежено окремо. Full path зберігає QR package install і installer Docker/update покриття для нічних scheduled runs, ручних dispatches, workflow-call release checks і pull request, які справді торкаються installer/package/Docker поверхонь. Push у `main`, включно з merge commits, не примушують full path; коли changed-scope logic запитала б full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`; він виконується за нічним schedule і з release checks workflow, а ручні dispatches `install-smoke` можуть увімкнути його, але pull request і push у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency ліній і functional image, який встановлює той самий tarball у `/app` для звичайних functionality ліній. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте default main-pool slot count 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і provider-sensitive tail-pool slot count 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких lanes за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за effective caps, усе одно може стартувати з порожнього pool, а потім виконується самостійно, доки не звільнить capacity. Старти lanes за замовчуванням рознесено на 2 секунди, щоб уникати локальних Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першого збою, а кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують суворіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, як-от `install-e2e`, і split bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібне, після чого `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact із поточного запуску, або завантажує package artifact із `package_artifact_run_id`; валідує tarball inventory; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Blacksmith Docker layer cache, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Робочий процес `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або попереднього workflow artifact, а потім передає цей єдиний artifact `package-under-test` у багаторазовий Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла валідувати старіші trusted commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено в `plugins-runtime-services`, коли full release-path coverage запитує його, і він зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*`, а не serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package і images із failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і надрукувати combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає full release-path Docker suite. Bundled update matrix розділено за update target, щоб повторні npm update і doctor repair passes могли шардитися з іншими bundled checks.

Поточні release Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime, але release workflow використовує розділені фрагменти, щоб channel smokes, цілі оновлення, перевірки plugin runtime і повні проходи встановлення/видалення bundled plugin могли виконуватися паралельно. Цільові dispatch-и `docker_lanes` також розділяють кілька вибраних lanes на паралельні jobs після одного спільного кроку підготовки package/image, а lanes оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI: зміни core production запускають core prod і core test typecheck, а також core lint/guards; зміни лише в core tests запускають тільки core test typecheck і core lint; зміни extension production запускають extension prod і extension test typecheck, а також extension lint; зміни лише в extension tests запускають extension test typecheck і extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts, але Vitest extension sweeps є явною тестовою роботою. Version bumps лише release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переходять до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування source надають перевагу явним mappings, потім sibling tests і import-graph
dependents. Конфігурація доставки shared group-room є одним із явних mappings:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests, а також регресії доставки Discord і
Slack, щоб зміна shared default падала до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійною proxy-перевіркою.

Для валідації Testbox запускайте з кореня repo й надавайте перевагу свіжому прогрітому box для
широкого proof. Перед тим як витрачати повільний gate на box, який повторно використали, термін дії якого минув або
який щойно повідомив про неочікувано великий sync, спочатку запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли обов’язкові root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість того, щоб debug-ити
product test failure. Для навмисних PR із великим видаленням установіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

Manual CI dispatches запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускає `Full Release Validation` або явний оператор. Звичайні pull requests, push-и в `main` і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node tests розділені або збалансовані так, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes поєднані в пари, auto-reply запускається як чотири balanced workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу й більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона домінована import/scheduling, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards одночасно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються одночасно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе ще компілює цей flavor із SMS/call-log BuildConfig flags, водночас уникаючи дублювання debug APK packaging job на кожному Android-relevant push.
GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у queue після того, як увесь workflow уже замінено.
Автоматичний CI concurrency key версійований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, shards `check`, крім lint, shards і aggregates `check-additional`, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла раніше стати в queue |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, нижчі за вагою extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
