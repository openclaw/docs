---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються помилкою
summary: Граф завдань CI, гейти області охоплення та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T13:37:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 706dfe3a1b92a4e561ec76d8a6f192ad5d821f4c21ab546d28a9a1f6d4b962cb
    source_path: ci.md
    workflow: 16
---

CI запускається для кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати витратні завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для release candidates або широкої валідації, а Android-напрями вмикаються окремо через `include_android` для автономних ручних запусків. Напрями prerelease для Plugin, призначені лише для релізів, містяться в окремому workflow `Plugin Prerelease` і запускаються тільки з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений на останній версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник падає, коли PR додає новий неперевірений невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, згенеровані, build, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний парасольковий workflow для «запустити все
перед релізом». Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` з цією ціллю, dispatch-ить `Plugin Prerelease` для
release-only доказів plugin/package/static/Docker і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
напрямів. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано
published package spec. `release_profile=minimum|stable|full` керує шириною live/provider,
яку передають у release checks: `minimum` залишає найшвидші критичні для релізу напрями OpenAI/core,
`stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media matrix. Парасолька записує
ids запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні conclusions дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього
run. Якщо дочірній workflow перезапущено і він став green, перезапустіть лише батьківське
завдання verifier, щоб оновити результат парасольки й підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожної release child або вужчу
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує перезапуск невдалого
release box у межах після сфокусованого виправлення.

Дочірній live/E2E реліз зберігає широке native-покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди та
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме покриття файлів, але робить повільні збої live
provider легшими для повторного запуску й діагностики. Агреговані назви шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Native live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють binaries перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску nested Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow один раз збирає й публікує цей image, потім Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
ціль, release run налаштовано неправильно, і він марнуватиме wall clock на дубльовані image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, потім передає цей artifact
і live/E2E release-path Docker workflow, і package acceptance
шарду. Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує одного candidate з
published npm spec, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Profiles покривають smoke, package, product, full і custom
Docker lane selections. Profile `package` використовує offline plugin coverage, щоб
published-package validation не залежала від live-доступності ClawHub. Опційний Telegram-напрям повторно використовує
artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а
published npm spec path збережено для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей installable OpenClaw
package як product?» Він відрізняється від звичайного CI: звичайний CI перевіряє
source tree, тоді як package acceptance перевіряє один tarball через той самий
Docker E2E harness, який користувачі використовують після install або update.

Workflow має чотири завдання:

1. `resolve_package` check out `workflow_ref`, розв’язує одного package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, перевіряє tarball inventory, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька targeted `docker_lanes`, reusable workflow готує package
   і shared images один раз, потім розгортає ці lanes як паралельні targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не є `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав один; standalone Telegram dispatch
   усе ще може встановити published npm spec.
4. `summary` валить workflow, якщо package resolution, Docker acceptance або
   опційний Telegram-напрям зазнали невдачі.

Джерела candidate:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  release version OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його з `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти
старіші trusted source commits без запуску старої workflow logic.

Profiles відповідають Docker coverage:

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
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають перетин package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram proof проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
installed package може import browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4-mini`, щоб
install і gateway proof залишалися швидкими й deterministic. Dedicated live
provider/model lanes усе ще покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені вікна legacy-compatibility для вже
published packages. Packages до `2026.4.25` включно, включно з `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, omitted з tarball,
`doctor-switch` може пропускати subcase з persistence `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune
відсутні `pnpm.patchedDependencies` із tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти migration config metadata, усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися unchanged. Published
package `2026.4.26` також може warning для local build metadata stamp files,
які вже були shipped. Пізніші packages мають задовольняти modern contracts; ті самі
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

Під час налагодження невдалого запуску перевірки прийнятності пакета почніть зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lane замість повторного запуску повної перевірки релізу.

QA Lab має окремі lane CI поза основним workflow зі смарт-обмеженням області. Workflow `Parity gate` запускається для відповідних змін у PR і вручну; він збирає приватний runtime QA та порівнює агентні пакети mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгалужує mock parity gate, live Matrix lane, а також live lane Telegram і Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу запускають live transport lane Matrix і Telegram з детермінованим mock-провайдером і моделями, кваліфікованими як mock (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримок live-моделей і звичайного запуску provider-Plugin. Live transport gateway також вимикає пошук пам’яті, бо QA parity окремо покриває поведінку пам’яті; підключення provider покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Значення CLI за замовчуванням і ручний ввід workflow залишаються `all`; ручний запуск `matrix_profile=all` завжди шардує повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу lane QA Lab перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane-завдання, а потім завантажує обидва артефакти в невелике report-завдання для фінального порівняння parity. Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає runtime QA, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, config, docs або unit-test вважайте це необов’язковим сигналом і спирайтеся на evidence зі scoped CI/check.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільну referenced issue, або перекриття змінених hunk.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні та ручні запуски сканують код Actions workflow плюс найризиковіші JavaScript/TypeScript поверхні auth, secrets, sandbox, Cron і gateway за допомогою high-precision security queries. Завдання channel-runtime-boundary окремо сканує контракти реалізації основних каналів плюс runtime channel Plugin, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security signal каналів міг масштабуватися без розширення baseline категорії JS/TS.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати в категорії `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорії `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, бо macOS build домінує runtime навіть коли чистий.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише JavaScript/TypeScript quality queries із severity error і non-security над вузькими high-value поверхнями на меншому Blacksmith Linux runner. Його завдання core-auth-secrets сканує код security boundary для auth, secrets, sandbox, Cron і gateway в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers і tool bridges, process supervision helpers та outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує опубліковане package-side джерело Plugin SDK і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без розмивання security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної docs у відповідності з нещодавно landed changes. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а ручний dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже змістився або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає діапазон commit від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу docs.

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інша workflow-run invocation уже запускалася або виконується цього UTC-дня. Ручний dispatch обходить цей daily activity gate. Lane будує grouped Vitest performance report для full-suite, дозволяє Codex вносити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline count прохідних тестів. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде закомічено. Коли `main` просувається до landing bot push, lane rebase validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли виконується                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені plugins і створює CI-маніфест    | Завжди для недрафтових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                  | Завжди для недрафтових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                            | Завжди для недрафтових push і PR   |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і reusable downstream artifacts    | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-ланцюжки коректності, як-от bundled/plugin-contract/protocol checks             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Shards тестів Core Node, за винятком channel, bundled, contract і extension lanes            | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для built-artifact channel tests                                                  | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke lane                                                      | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки broken links                                      | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                        | Зміни, релевантні для Python skills |
| `checks-windows`                 | Windows-specific process/path tests плюс regressions shared runtime import specifier          | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane із використанням спільних built artifacts                         | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                       | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                 | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх Main CI або ручний запуск    |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожен
scoped lane, не пов’язаний з Android: Linux Node shards, bundled-plugin shards, channel
contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI
виконують лише Android з `include_android=true`; повний release
umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для Plugin,
release-only shard `agentic-plugins`, повний batch sweep для extensions
і Docker lanes для prerelease Plugin виключено з CI. Набір Docker
prerelease виконується лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає
довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA, водночас
використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою до запуску дорогих:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи на важчі завдання artifact і platform matrix.
3. `build-artifacts` виконується паралельно зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області й змушує preflight-маніфест
діяти так, ніби змінилася кожна область із визначеним scope.
Редагування CI workflow перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні lanes залишаються прив’язаними до змін платформного вихідного коду.
Редагування, що стосуються лише маршрутизації CI, вибрані дешеві редагування core-test fixtures і вузькі редагування helper/test-routing для контрактів плагінів використовують швидкий Node-only шлях маніфесту: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Windows Node checks обмежені специфічними для Windows wrappers процесів/шляхів, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цю lane; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для Docker/package surfaces, змін package/manifest вбудованих плагінів і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді вбудованих плагінів, test-only edits і docs-only edits не резервують Docker workers. Fast path один раз збирає root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення і запускає bounded bundled-plugin Docker profile під 240-секундним aggregate command timeout, причому Docker run для кожного scenario обмежений окремо. Full path зберігає QR package install і installer Docker/update coverage для nightly scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. `main` pushes, зокрема merge commits, не примушують full path; коли changed-scope logic запитала б full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть opt into it, але pull requests і `main` pushes його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` prebuilds один shared live-test image, один раз пакує OpenClaw як npm tarball і збирає два shared `scripts/e2e/Dockerfile` images: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який installs той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes живуть у `scripts/lib/docker-e2e-scenarios.mjs`, planner logic живе в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте default main-pool slot count 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і provider-sensitive tail-pool slot count 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не overcommit Docker, поки lighter lanes все ще заповнюють доступні slots. Одна lane, важча за effective caps, все одно може стартувати з empty pool, а потім виконується самостійно, доки не звільнить capacity. Lane starts за замовчуванням рознесені на 2 секунди, щоб уникнути local Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Local aggregate preflights Docker, removes stale OpenClaw E2E containers, emits active-lane status, persists lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для scheduler inspection. Він припиняє планувати new pooled lanes після першого failure за замовчуванням, і кожна lane має 120-minute fallback timeout, overrideable через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; selected live/tail lanes використовують tighter per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, зокрема release-only lanes як-от `install-e2e` і split bundled update lanes як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, downloads current-run package artifact, або downloads package artifact з `package_artifact_run_id`; validates tarball inventory; builds and pushes package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan needs package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або existing package-digest images замість rebuild. Docker image pulls retries with a bounded 180-second per-attempt timeout, щоб stuck registry/cache stream швидко retry, а не споживав більшу частину CI critical path. Workflow `Package Acceptance` є high-level package gate: він resolves candidate з npm, trusted `package_ref`, HTTPS tarball plus SHA-256 або prior workflow artifact, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб current acceptance logic могла validate older trusted commits без checkout old workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA against the resolved tarball. Release-path Docker suite запускає smaller chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk pulls only the image kind it needs і executes multiple lanes through the same weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI folded into `plugins-runtime-services`, коли full release-path coverage requests it, і зберігає standalone `openwebui` chunk лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для manual reruns, але release workflow uses split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не dominated the critical path. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split `bundled-channel-*` і `bundled-channel-update-*` lanes замість serial all-in-one `bundled-channel-deps` lane. Кожен chunk uploads `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає selected lanes against the prepared images замість chunk jobs, що keeps failed-lane debugging bounded to one targeted Docker job і prepares, downloads, or reuses the package artifact for that run; якщо selected lane є live Docker lane, targeted job builds the live-test image locally for that rerun. Generated per-lane GitHub rerun commands include `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла reuse the exact package and images from the failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб download Docker artifacts from a GitHub run і print combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane and phase critical-path summaries. Scheduled live/E2E workflow запускає full release-path Docker suite daily. Bundled update matrix split by update target, щоб repeated npm update і doctor repair passes могли shard with other bundled checks.

Current release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається available for manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли run in parallel. Targeted `docker_lanes` dispatches також split multiple selected lanes into parallel jobs після одного shared package/image preparation step, а bundled-channel update lanes retry once for transient npm network failures.

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж broad CI platform scope: core production changes запускають core prod і core test typecheck плюс core lint/guards, core test-only changes запускають лише core test typecheck plus core lint, extension production changes запускають extension prod і extension test typecheck plus extension lint, а extension test-only changes запускають extension test typecheck plus extension lint. Public Plugin SDK або plugin-contract changes expand to extension typecheck, бо extensions залежать від цих core contracts, але Vitest extension sweeps є explicit test work. Release metadata-only version bumps запускають targeted version/config/root-dependency checks. Unknown root/config changes fail safe to all check lanes.
Local changed-test routing живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевший за `check:changed`: direct test edits запускають themselves,
source edits prefer explicit mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним з explicit mappings:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt route through the core reply tests плюс Discord і
Slack delivery regressions, щоб shared default change failed before the first PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
достатньо harness-wide, що cheap mapped set не є trustworthy proxy.

Для перевірки Testbox запускайте з кореня репозиторію й надавайте перевагу свіжому прогрітому боксу для широкого підтвердження. Перед тим як витрачати повільний gate на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині боксу. Перевірка справності швидко завершується з помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR. Зупиніть цей бокс і прогрійте свіжий замість налагодження збою продуктового тесту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності. `pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Ручні запуски CI виконують `checks-node-compat-node22` як широке покриття сумісності. Android вмикається окремо для автономного ручного CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і автономні ручні запуски CI тримають цей набір вимкненим.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner: контрактні перевірки каналів виконуються як три зважені shard, малі core unit lane об’єднано в пари, auto-reply виконується як чотири збалансовані worker із піддеревом reply, розділеним на shard для agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node завданнями замість очікування на зібрані артефакти. Широкі browser, QA, media та різні plugin тести використовують власні конфіги Vitest замість спільного plugin catch-all. `Plugin Prerelease` балансує тести bundled plugin між вісьмома extension worker; ці extension shard завдання запускають до двох груп plugin config одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy plugin пакети не створювали додаткових CI завдань. Широка agents lane використовує спільний file-parallel планувальник Vitest, бо вона визначається імпортом/плануванням, а не одним повільним тестовим файлом. `runtime-config` виконується разом з infra core-runtime shard, щоб спільний runtime shard не володів хвостом. Include-pattern shards записують timing entries з використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює архітектуру runtime topology від покриття gateway watch; boundary guard shard запускає свої малі незалежні guard паралельно всередині одного завдання. Gateway watch, тести каналів і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі verifier jobs, але уникаючи двох додаткових Blacksmith worker і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе ще компілює цей flavor із прапорцями BuildConfig для SMS/call-log, уникаючи дублювання завдання пакування debug APK для кожного push, релевантного Android.
GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було замінено.
Автоматичний ключ конкурентності CI версійовано (`CI-v7-*`), щоб zombie з боку GitHub у старій групі черги не міг нескінченно блокувати новіші запуски main. Ручні full-suite запуски використовують `CI-manual-v1-*` і не скасовують уже запущені виконання.

## Runner

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security завдання й aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled перевірки, sharded channel contract перевірки, `check` shards окрім lint, `check-additional` shards і aggregate, Node test aggregate verifiers, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, нижчі за вагою extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час очікування в черзі 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
- [Канали випусків](/uk/install/development-channels)
