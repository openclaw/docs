---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося чи не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, перевірки за областю та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T04:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8989a33a2607776e709f7c732a14ce22dd15e1319a59f44b92fb3eb0ad0e079
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації, причому Android-доріжки вмикаються через `include_android` для окремих ручних запусків. Релізні доріжки попереднього випуску плагінів живуть в окремому робочому процесі `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений за останньою версією Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні динамічні плагінні, згенеровані, build, live-test і package bridge поверхні, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний парасольковий робочий процес для «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, dispatch-ить
ручний робочий процес `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
релізного proof плагінів/пакетів/static/Docker і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
доріжок. Він також може запускати post-publish робочий процес `NPM Telegram Beta E2E`, коли надано
опубліковану специфікацію пакета. `release_profile=minimum|stable|full` керує широтою live/provider,
яку передають у release checks: `minimum` залишає найшвидші OpenAI/core
критичні для релізу доріжки, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media матрицю. Парасолька записує
id запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього
run. Якщо дочірній робочий процес перезапущено і він стає зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат парасольки та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайного дочірнього full CI, `release-checks` для кожного релізного дочірнього, або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує перезапуск failed
release box у межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди, і
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме покриття файлів, водночас полегшуючи
перезапуск і діагностику повільних live provider збоїв. Агреговані імена шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному робочим
процесом `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють двійкові файли перед налаштуванням. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, тому що container jobs — неправильне
місце для запуску вкладених Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Робочий процес live
release збирає і надсилає цей образ один раз, після чого шарди Docker live model,
gateway, CLI backend, ACP bind і Codex harness запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
ціль, release run налаштовано неправильно, і він витратить wall
clock на дубльовані збірки образів.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей артефакт
і live/E2E release-path Docker робочому процесу, і шарду package acceptance.
Це зберігає bytes пакета узгодженими між release boxes і уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run робочий процес для валідації артефакта пакета
без блокування release workflow. Він розв’язує одного кандидата з
опублікованої npm spec, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
вибори Docker lane. Профіль `package` використовує offline plugin coverage, щоб
валідація опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова
Telegram-доріжка повторно використовує артефакт
`package-under-test` у робочому процесі `NPM Telegram Beta E2E`, причому шлях
опублікованої npm spec зберігається для standalone dispatches.

## Package acceptance

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей installable OpenClaw
package як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує
дерево source, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі застосовують після install або update.

Робочий процес має чотири завдання:

1. `resolve_package` робить checkout `workflow_ref`, розв’язує одного package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей артефакт, валідує tarball inventory, готує package-digest
   Docker images за потреби і запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька цільових `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як паралельні цільові Docker
   jobs з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`,
   коли Package Acceptance розв’язав його; standalone Telegram dispatch
   усе ще може встановити опубліковану npm spec.
4. `summary` провалює робочий процес, якщо package resolution, Docker acceptance або
   необов’язкова Telegram-доріжка завершилися збоєм.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  опублікованого beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit є
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає поточному test harness змогу валідувати
старіші trusted source commits без запуску старої workflow logic.

Профілі відображаються на Docker coverage:

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
chunks release-path покривають перетин package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram proof проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може імпортувати browser-control override з raw absolute
Windows path. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його задано, інакше `openai/gpt-5.4-mini`, тому
install і gateway proof залишаються швидкими й детермінованими. Окремі live
provider/model lanes усе ще покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені legacy-compatibility windows для вже
опублікованих package. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені tarball,
`doctor-switch` може пропустити subcase persistence для `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune-ити
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може log-ити відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволити config metadata migration, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може warn-ити щодо local build metadata stamp files,
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

Під час налагодження невдалого запуску приймання пакета почніть із зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали смуг, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних смуг Docker замість повторного запуску повної валідації релізу.

QA Lab має окремі CI-смуги поза основним workflow із розумною областю дії. Workflow `Parity gate` запускається для відповідних змін PR і ручного запуску; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, живу смугу Matrix, а також живі смуги Telegram і Discord як паралельні завдання. Живі завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу запускають живі транспортні смуги Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки живої моделі та звичайного запуску provider-plugin. Живий транспортний Gateway також вимикає пошук пам’яті, оскільки parity QA окремо покриває поведінку пам’яті; підключення провайдера покривають окремі набори живої моделі, нативного провайдера та Docker-провайдера. Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли взятий із репозиторію CLI це підтримує. Значення за замовчуванням CLI і ручний ввід workflow залишаються `all`; ручний запуск `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу смуги QA Lab перед затвердженням релізу; його parity gate QA запускає кандидатний і базовий пакети як паралельні завдання смуг, а потім завантажує обидва артефакти в невелике завдання звіту для фінального порівняння parity.
Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається середовища виконання QA, parity модельних пакетів або поверхні, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або модульних тестів розглядайте це як необов’язковий сигнал і спирайтеся на докази зі scoped CI/check.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після landing. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільну згадану issue, або перекривні змінені hunks.

Workflow `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та guard-запуски pull request без статусу draft сканують код workflow Actions плюс найризикованіші поверхні JavaScript/TypeScript для автентифікації, секретів, sandbox, cron і Gateway за допомогою security-запитів із високою впевненістю, відфільтрованих до високої/критичної `security-severity` у категорії `/codeql-security-high/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти реалізації основних каналів плюс середовище виконання channel Plugin, Gateway, Plugin SDK, секрети й audit touchpoints у категорії `/codeql-security-high/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії auth/secrets. Завдання network-ssrf-boundary сканує поверхні core SSRF, IP parsing, network guard, web-fetch і політики SSRF Plugin SDK у категорії `/codeql-security-high/network-ssrf-boundary`, щоб сигнал межі довіри мережі залишався окремим від security baseline auth/secrets.
Завдання mcp-process-tool-boundary сканує MCP-сервери, помічники виконання процесів, outbound delivery і gate виконання інструментів агентів у категорії `/codeql-security-high/mcp-process-tool-boundary`, щоб сигнал меж команд та інструментів залишався окремим як від baseline auth/secrets, так і від non-security shard якості MCP/process. Завдання plugin-trust-boundary сканує поверхні довіри встановлення plugin, loader, manifest, registry, staging runtime-dependency, source-loading, public-surface і контракту пакета Plugin SDK у категорії `/codeql-security-high/plugin-trust-boundary`, щоб сигнал supply-chain plugin і runtime-loading залишався окремим як від коду реалізації bundled plugin, так і від non-security shard якості plugin.
Guard pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і запускає ту саму матрицю security із високою впевненістю, що й запланований workflow. Android і macOS CodeQL залишаються поза стандартними PR-запусками.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшій мітці Blacksmith Linux runner, яку приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, бо збірка macOS домінує за часом виконання навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security запити якості JavaScript/TypeScript для вузьких поверхонь із високою цінністю на меншому Blacksmith Linux runner. Його guard pull request навмисно менший за запланований профіль: PR без статусу draft запускають лише відповідні shards `gateway-runtime-boundary`, `plugin-boundary` і `plugin-sdk-package-contract` для змін gateway protocol/server-method, plugin loader, Plugin SDK або package-contract. Зміни конфігурації CodeQL і workflow якості запускають усі три PR quality shards. Його ручний запуск приймає `profile=all|gateway-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; вузькі профілі — це hooks для навчання/ітерацій, щоб запускати один quality shard ізольовано без запуску решти workflow.
Його завдання core-auth-secrets сканує код меж автентифікації, секретів, sandbox, cron і Gateway security в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує контракти config schema, migration, normalization та IO в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує схеми gateway protocol і контракти server method в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує контракти реалізації основних каналів в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також runtime-контракти control-plane ACP в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP-сервери та tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує внутрішню логіку reply queue, session delivery queues, helpers для outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти session doctor CLI в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання plugin-sdk-reply-runtime сканує inbound reply dispatch Plugin SDK, payload/chunking/runtime helpers для reply, channel reply options, delivery queues і helpers для session/thread binding в окремій категорії `/codeql-critical-quality/plugin-sdk-reply-runtime`. Завдання provider-runtime-boundary сканує model catalog normalization, provider auth і discovery, provider runtime registration, provider defaults/catalogs, а також registries web/search/fetch/embedding provider в окремій категорії `/codeql-critical-quality/provider-runtime-boundary`. Завдання ui-control-plane сканує bootstrap Control UI, local persistence, control flows Gateway і runtime-контракти task control-plane в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і entrypoint contracts Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує опубліковане package-side джерело Plugin SDK і helpers контракту plugin package в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб результати якості можна було планувати, вимірювати, вимикати або розширювати без розмивання security signal.
Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

Workflow `Docs Agent` — це подієво-керована смуга обслуговування Codex для підтримання наявної документації у відповідності з нещодавно landed змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а ручний запуск може запустити його напряму. Виклики через workflow-run пропускаються, коли `main` уже зсунувся або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з моменту останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво-керований напрям супроводу Codex
для повільних тестів. Він не має чистого розкладу: успішний запуск CI для push не від бота на
`main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже
виконувався або виконується цього дня за UTC. Ручний запуск обходить цей щоденний
шлюз активності. Цей напрям формує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex
вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують
базову кількість успішних тестів. Якщо в базовому стані є тести, що падають, Codex може виправляти
лише очевидні збої, а звіт повного набору тестів після агента має пройти перед тим, як
щось буде закомічено. Коли `main` просувається вперед до того, як push бота потрапить у гілку, цей напрям
перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі patches пропускаються. Він використовує Ubuntu на GitHub-hosted runner, щоб дія Codex
могла зберігати ту саму позицію безпеки drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені plugins і будує маніфест CI       | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                 | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для non-draft pushes і PRs  |
| `build-artifacts`                | Будує `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts           | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от bundled/plugin-contract/protocol checks               | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним агрегованим результатом перевірки               | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, без channel, bundled, contract і extension lanes                       | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node     |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards     | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                  | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для built-artifact channel tests                                                   | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності Node 22 і smoke lane                                                        | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки непрацюючих посилань                              | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс спільні регресії runtime import specifier      | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane з використанням спільних built artifacts                           | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                 | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх Main CI або ручний запуск    |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожен
не-Android scoped lane: Linux Node shards, bundled-plugin shards, channel
contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки docs,
Python Skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI
виконують Android лише з `include_android=true`; повна релізна парасолька
вмикає Android, передаючи `include_android=true`. Static checks для Plugin prerelease,
лише релізний shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes
виключені з CI. Набір Docker prerelease запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим запуском push або PR на тому самому ref. Необов’язковий input `target_ref` дає
довіреному викликачеві змогу запускати цей граф для branch, tag або повного commit SHA, водночас
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих завдань матриці artifacts і платформ.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області дії та змушує preflight-маніфест
діяти так, ніби змінилася кожна область із заданою областю дії.
Редагування CI workflow перевіряють граф Node CI і linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні гілки залишаються обмеженими змінами у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування fixture для основних тестів, а також вузькі редагування helper/test-routing для контрактів Plugin використовують швидкий шлях маніфесту тільки для Node: preflight, security і один task `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних основних shards, shards вбудованих Plugin і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидкий task перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows process/path wrappers, helper для npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю гілку; непов'язані зміни у вихідному коді, Plugin, install-smoke і зміни тільки тестів залишаються в Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/package, змін пакетів/маніфестів вбудованих Plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни тільки у вихідному коді вбудованих Plugin, редагування тільки тестів і редагування тільки документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg для вбудованого extension і запускає обмежений Docker profile для вбудованих Plugin із сукупним timeout команди 240 секунд, причому Docker run кожного сценарію обмежений окремо. Повний шлях зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав після root image smokes. Pushes у `main`, зокрема merge commits, не примушують повний шлях; коли changed-scope logic запитала б повне покриття під час push, workflow залишає fast Docker smoke і передає full install smoke нічній або release validation. Повільний Bun global install image-provider smoke окремо обмежується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з release checks workflow, а ручні `install-smoke` dispatches можуть увімкнути його, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один shared live-test image, один раз пакує OpenClaw як npm tarball і збирає два shared `scripts/e2e/Dockerfile` images: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує тільки вибраний plan. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких lanes за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за ефективні обмеження, все одно може стартувати з порожнього pool, а потім виконується самостійно, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникнути локальних Docker daemon create storms; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate виконує preflight Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першого failure, і кожна lane має fallback timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, зокрема release-only lanes, як-от `install-e2e`, і розділені bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне, після чого `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає та публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache від Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker image повторюються з обмеженим timeout 180 секунд на кожну спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшу частину критичного шляху CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або artifact попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA щодо resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включено в `plugins-runtime-services`, коли full release-path coverage запитує його, і він зберігає standalone chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в critical path. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*`, а не serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes на підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job збирає live-test image локально для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для summaries slow-lane і phase critical-path. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділено за update target, щоб повторні npm update і doctor repair passes могли виконуватися shards разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних lanes на паралельні jobs після одного shared package/image preparation step, а bundled-channel update lanes повторюють спробу один раз у разі transient npm network failures.

Локальна логіка змінених доріжок живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи: зміни production-коду core запускають typecheck production і тестів core плюс lint/guards core, зміни лише тестів core запускають тільки typecheck тестів core плюс lint core, зміни production-коду розширень запускають typecheck production і тестів розширень плюс lint розширень, а зміни лише тестів розширень запускають typecheck тестів розширень плюс lint розширень. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck розширень, бо розширення залежать від цих core-контрактів, але Vitest-прогони розширень є явною тестовою роботою. Version bump-и лише release metadata запускають цільові перевірки версії/config/root-dependency. Невідомі зміни root/config безпечно переходять до всіх check-доріжок.
Локальна маршрутизація змінених тестів живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним мапінгам, потім sibling tests і залежним
через import-graph. Спільна конфігурація доставки group-room є одним із явних мапінгів:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і
Slack, щоб зміна спільного default падала до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й віддавайте перевагу свіжому прогрітому box для
широкого proof. Перш ніж витрачати повільний gate на box, який було повторно використано, термін дії якого минув або
який щойно повідомив про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли потрібні root-файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що стан remote sync не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість того, щоб налагоджувати
падіння product test. Для навмисних PR із великим видаленням установіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у
sync phase понад п’ять хвилин без post-sync output. Установіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diff-ів.

Ручні CI dispatch-и запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який dispatch-иться через `Full Release Validation` або явним оператором. Звичайні pull request-и, push-и в `main` і standalone manual CI dispatch-и тримають цей suite вимкненим.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожна job залишалася малою без надмірного резервування runner-ів: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднані в пари, auto-reply запускається як чотири balanced workers із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media й miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона домінується import/scheduling, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не забирав tail. Include-pattern shards записують timing entries із CI shard name, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині однієї job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі check names як lightweight verifier jobs, водночас уникаючи двох додаткових Blacksmith workers і другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або `main` ref. Вважайте це CI noise, якщо newest run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють нормальні shard failures, але не стають у queue після того, як весь workflow уже superseded.
Automatic CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, fast security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), fast protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в queue раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback-яться до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback-яться до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
- [Release channels](/uk/install/development-channels)
