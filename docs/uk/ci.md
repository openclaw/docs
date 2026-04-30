---
read_when:
    - Потрібно зрозуміти, чому завдання CI запускалося або не запускалося
    - Ви налагоджуєте перевірки GitHub Actions, які завершуються невдало
summary: Граф завдань CI, гейти за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T04:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf49b1c3ac7b596b0c92652f69de86053b3ba711dabcf083f4f31dd8e27fdd8f
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне визначення області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої перевірки, а Android-напрями вмикаються через `include_android` для окремих ручних запусків. Релізні напрями попередніх релізів Plugin живуть в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або через явний ручний dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, виробничий прохід Knip лише для залежностей, прив’язаний до найновішої версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, що порівнює виробничі знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні динамічні Plugin, згенеровані, збіркові, live-test і package bridge поверхні, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний commit SHA, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
релізного доказу Plugin/package/static/Docker, а також dispatch-ить
`OpenClaw Release Checks` для smoke-перевірки встановлення, приймання package, Docker
наборів для релізного шляху, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
напрямів. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли
надано специфікацію опублікованого package. `release_profile=minimum|stable|full` керує live/provider
шириною, переданою до release checks: `minimum` залишає найшвидші критичні для релізу OpenAI/core
напрями, `stable` додає стабільний набір provider/backend, а
`full` запускає широку рекомендаційну матрицю provider/media. Парасолька записує
id дочірніх запусків, які були dispatch-нуті, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат парасольки та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього workflow або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує перезапуск невдалого
релізного середовища в межах після сфокусованого виправлення.

Дочірній live/E2E реліз зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди та
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме покриття файлів, водночас роблячи повільні live
збої provider простішими для перезапуску та діагностики. Агреговані назви шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють двійкові файли перед налаштуванням. Тримайте Docker-backed
live набори на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску вкладених Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для вибраного commit. Live
release workflow збирає і надсилає цей образ один раз, потім Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди самостійно перебудовують повну source Docker
ціль, release run налаштовано неправильно і він марнуватиме wall
clock на дубльовані збірки образів.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, потім передає цей artifact
і до live/E2E release-path Docker workflow, і до шарда package acceptance.
Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate в кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для перевірки package artifact
без блокування release workflow. Він розв’язує одного candidate з
опублікованої npm spec, trusted `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
Docker lane selections. Профіль `package` використовує offline Plugin coverage, щоб
перевірка published-package не залежала від live доступності ClawHub. Необов’язковий
Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
published npm spec збережено для standalone dispatches.

## Приймання package

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей installable OpenClaw
package як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє
source tree, тоді як package acceptance перевіряє один tarball через той самий
Docker E2E harness, який користувачі виконують після встановлення або оновлення.

Workflow має чотири jobs:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, перевіряє inventory tarball, готує package-digest
   Docker images за потреби та запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька цільових `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як паралельні цільові Docker
   jobs з унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   якщо Package Acceptance розв’язав його; standalone Telegram dispatch
   усе ще може встановити published npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   необов’язковий Telegram lane завершилися невдало.

Джерела candidates:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти
старіші trusted source commits без запуску old workflow logic.

Профілі відповідають Docker coverage:

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
chunks охоплюють overlapping package/update/Plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline Plugin і
Telegram proof проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще охоплюють OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може import-ити browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли він заданий, інакше `openai/gpt-5.4-mini`, тож
install і gateway proof залишаються швидкими та deterministic. Dedicated live
provider/model lanes усе ще охоплюють ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені вікна legacy-compatibility для вже
опублікованих packages. Packages до `2026.4.25`, включно з `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на tarball-omitted files,
`doctor-switch` може пропускати subcase persistence `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune-ити
відсутні `pnpm.patchedDependencies` із tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, Plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти migration config metadata, водночас
усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може warn-ити про local build metadata stamp files,
які вже були shipped. Пізніші packages мають відповідати modern contracts; ті
самі умови fail-яться замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета почніть із зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, часові показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lane замість повторного запуску повної валідації релізу.

QA Lab має окремі CI lane поза основним smart-scoped workflow. Робочий процес `Parity gate` запускається за відповідних змін у PR і через ручний dispatch; він збирає приватне QA runtime та порівнює агентні пакети mock GPT-5.5 і Opus 4.6. Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Release checks запускають Matrix і Telegram live transport lane з детермінованим mock provider і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway також вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення provider покривають окремі набори live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і release gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і ручне workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу QA Lab lane перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невелике report job для фінального parity comparison. Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check evidence.

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. Типово він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR об’єднано і що кожен дублікат має або спільне referenced issue, або перетин changed hunks.

Робочий процес `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard запуски сканують код Actions workflow плюс найбільш ризикові JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і gateway з high-confidence security queries, відфільтрованими до high/critical `security-severity` у категорії `/codeql-security-high/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує core channel implementation contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-security-high/channel-runtime-boundary`, щоб security signal каналу міг масштабуватися без розширення baseline категорії auth/secrets. Завдання network-ssrf-boundary сканує core SSRF, IP parsing, network guard, web-fetch і поверхні Plugin SDK SSRF policy у категорії `/codeql-security-high/network-ssrf-boundary`, щоб сигнал network trust boundary залишався окремим від security baseline auth/secrets. Завдання mcp-process-tool-boundary сканує MCP servers, process execution helpers, outbound delivery і agent tool-execution gates у категорії `/codeql-security-high/mcp-process-tool-boundary`, щоб сигнал command і tool boundary залишався окремим як від baseline auth/secrets, так і від non-security MCP/process quality shard. Завдання plugin-trust-boundary сканує plugin install, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface і trust surfaces контракту пакета Plugin SDK у категорії `/codeql-security-high/plugin-trust-boundary`, щоб plugin supply-chain і runtime-loading signal залишалися окремими як від bundled plugin implementation code, так і від non-security plugin quality shard. Pull request guard залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до типових PR-запусків.

Робочий процес `CodeQL Android Critical Security` — це scheduled Android security shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це weekly/manual macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним default workflow, оскільки macOS build домінує за runtime навіть у чистому стані.

Робочий процес `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PR запускають лише відповідні shards `gateway-runtime-boundary`, `provider-runtime-boundary`, `plugin-boundary` і `plugin-sdk-package-contract` для змін gateway protocol/server-method, provider runtime/model catalog, plugin loader, Plugin SDK або package-contract. Зміни CodeQL config і quality workflow запускають усі чотири PR quality shards. Його manual dispatch приймає `profile=all|gateway-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; вузькі profiles є навчальними/ітераційними hooks для запуску одного quality shard ізольовано без dispatch решти workflow. Його завдання core-auth-secrets сканує auth, secrets, sandbox, cron і gateway security boundary code в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues і ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers and tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання plugin-sdk-reply-runtime сканує Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-reply-runtime`. Завдання provider-runtime-boundary сканує model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding provider registries в окремій категорії `/codeql-critical-quality/provider-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує published package-side Plugin SDK source і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі profiles матимуть стабільні runtime і signal.

Робочий процес `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації у відповідності з нещодавно landed changes. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже змістився вперед або коли за останню годину було створено інший non-skipped Docs Agent run. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може покрити всі main changes, накопичені з часу останнього docs pass.

The `Test Performance Agent` workflow є подієво-керованою лінією обслуговування Codex для повільних тестів. Вона не має чистого розкладу: успішний запуск CI після push не від бота на `main` може її запустити, але вона пропускається, якщо інший виклик через workflow-run уже виконувався або виконується цього дня за UTC. Ручний dispatch обходить цей щоденний шлюз активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, що зменшують базову кількість пройдених тестів. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після роботи агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде доставлено, лінія перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-хостed Ubuntu, щоб дія Codex могла зберігати таку саму безпечну позицію drop-sudo, як агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та будує маніфест CI   | Завжди для push і PR, що не є чернетками |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для push і PR, що не є чернетками |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                 | Завжди для push і PR, що не є чернетками |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для push і PR, що не є чернетками |
| `build-artifacts`                | Будує `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol              | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, крім ліній каналів, bundled, контрактів і розширень                   | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основного локального шлюзу: production-типи, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, boundary, guards для extension-surface, package-boundary і gateway-watch   | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                              | Зміни, релевантні для Node         |
| `checks`                         | Перевіряльник для тестів каналів зібраних артефактів                                          | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збірки та smoke для сумісності з Node 22                                                | Ручний dispatch CI для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс регресії спільних runtime import specifier     | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія тестів TypeScript для macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і тести для macOS-застосунку                                                | Зміни, релевантні для macOS        |
| `android`                        | Unit-тести Android для обох flavors плюс одна debug APK-збірка                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх CI main або ручний dispatch  |

Ручні dispatch CI запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped-лінію не для Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS і Control UI i18n. Окремі ручні dispatch CI запускають лише Android з `include_android=true`; повна release-umbrella вмикає Android, передаючи `include_android=true`. Static checks для prerelease Plugin, release-only шард `agentic-plugins`, повний пакетний sweep розширень і Docker-лінії prerelease Plugin виключені з CI. Набір prerelease Docker запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим шлюзом release-validation. Ручні запуски використовують унікальну concurrency group, щоб повний набір release-candidate не скасовувався іншим push або PR-запуском на тому самому ref. Необов’язковий input `target_ref` дає довіреному викликачеві змогу запускати цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перетинається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформні та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення області змін і змушує preflight-маніфест
поводитися так, ніби змінилася кожна область із заданою областю.
Редагування CI workflow перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні доріжки залишаються обмеженими змінами платформного вихідного коду.
Редагування, що стосуються лише маршрутизації CI, вибрані дешеві редагування фікстур core-тестів і вузькі редагування допоміжних засобів/тестової маршрутизації контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів bundled-plugin і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю доріжку; непов’язані зміни вихідного коду, plugin, install-smoke і лише тестові зміни залишаються на доріжках Linux Node, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/пакетів, змін пакета/маніфесту bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним тайм-аутом команди 240 секунд, при цьому Docker run кожного сценарію обмежений окремо. Повний шлях зберігає встановлення QR-пакета та покриття Docker/update інсталятора для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR smoke-образ кореневого Dockerfile, потім запускає встановлення QR-пакета, smoke-тести кореневого Dockerfile/gateway, smoke-тести installer/update і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за smoke-тестами кореневого образу. Пуші в `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow залишає швидкий Docker smoke і передає повний install smoke нічній або release-валідації. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть увімкнути його, але pull request і пуші в `main` його не запускають. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: мінімальний Node/Git runner для доріжок installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних доріжок. Визначення Docker-доріжок містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної доріжки за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів provider-sensitive tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких доріжок за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service доріжки не перевантажували Docker, тоді як легші доріжки й далі заповнюють доступні слоти. Одна доріжка, важча за ефективні обмеження, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Запуски доріжок за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегатор попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E containers, виводить статус активних доріжок, зберігає таймінги доріжок для впорядкування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна доріжка має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail доріжки використовують жорсткіші обмеження для кожної доріжки. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні доріжки планувальника, включно з release-only доріжками, такими як `install-e2e`, і розділеними bundled update доріжками, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу доріжку. Reusable live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, доріжки та облікових даних потрібне, потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає й пушить позначені package-digest bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує доріжок із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість перебудови. Docker image pulls повторюються з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий registry/cache stream швидко повторювався, а не споживав більшу частину критичного шляху CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, потім передає цей єдиний артефакт `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають кастомну Package Acceptance delta для цільового ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA проти визначеного tarball. Docker suite release-path запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний йому тип образу й виконував кілька доріжок через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI входить до `plugins-runtime-services`, коли повне покриття release-path цього вимагає, і зберігає окремий chunk `openwebui` лише для запусків OpenWebUI-only. Застарілі aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в критичному шляху. Псевдонім доріжки `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає розділені доріжки `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one доріжки `bundled-channel-deps`. Кожен chunk вивантажує `.artifacts/docker-tests/` із журналами доріжок, таймінгами, `summary.json`, `failures.json`, фазовими таймінгами, JSON плану планувальника, таблицями повільних доріжок і командами rerun для кожної доріжки. Input workflow `docker_lanes` запускає вибрані доріжки проти підготовлених образів замість chunk jobs, що обмежує debugging невдалої доріжки одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана доріжка є live Docker lane, цільове завдання локально збирає live-test image для цього rerun. Згенеровані команди GitHub rerun для кожної доріжки містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала доріжка могла повторно використати точний пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для summaries повільних доріжок і критичного шляху фаз. Scheduled live/E2E workflow щодня запускає повний Docker suite release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторні npm update і doctor repair passes могли шардитися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли працювати паралельно. Цільові запуски `docker_lanes` також розділяють кілька вибраних доріжок на паралельні jobs після одного спільного кроку підготовки пакета/образу, а доріжки bundled-channel update повторюються один раз для тимчасових npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний перевірковий gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI: зміни production-коду core запускають core prod і core test typecheck, а також core lint/guards; зміни лише в тестах core запускають тільки core test typecheck і core lint; зміни production-коду extension запускають extension prod і extension test typecheck, а також extension lint; зміни лише в тестах extension запускають extension test typecheck і extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extensions, бо extensions залежать від цих core-контрактів, але Vitest sweeps для extensions є явною тестовою роботою. Зміни лише release metadata version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переходять на всі check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним мапінгам, потім sibling tests та import-graph
dependents. Спільна конфігурація доставки group-room є одним із явних мапінгів:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests, а також регресії доставки Discord і
Slack, щоб зміна спільного default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня repo і надавайте перевагу свіжому warmed box для
широкого proof. Перш ніж витрачати повільний gate на box, який повторно використали, термін якого минув або
який щойно повідомив про несподівано великий sync, спочатку запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли обов’язкові root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий, замість того щоб налагоджувати
помилку product test. Для PR з навмисними великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається у
sync phase понад п’ять хвилин без post-sync output. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Manual CI dispatches запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, `main` pushes і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднані попарно, auto-reply запускається як чотири збалансовані workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широкий agents lane використовує спільний Vitest file-parallel scheduler, бо він домінований import/scheduling, а не належить одному повільному test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries із назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або `main` ref. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють нормальні shard failures, але не стають у чергу після того, як увесь workflow уже superseded.
Automatic CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
