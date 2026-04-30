---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, які не проходять
summary: Граф завдань CI, контрольні перевірки за областю та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T05:04:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5174412ed135f5f9b3712fb5ac28e0e2d781e2d45232b49f7bbed06085596c5a
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли зміни стосуються лише непов'язаних ділянок. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження області й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації, а доріжки Android вмикаються через `include_android` для окремих ручних запусків. Передрелізні доріжки Plugin лише для релізів містяться в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений на найновішій версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник падає, коли PR додає новий неперевірений невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні динамічні поверхні Plugin, згенеровані поверхні, build-поверхні, live-test-поверхні та пакетні bridge-поверхні, які Knip не може розв'язати статично.

`Full Release Validation` — це ручний umbrella workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний SHA коміту, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
release-only доказу Plugin/пакета/статичних перевірок/Docker і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
доріжок. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано
специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує live/provider
шириною, яку передають у перевірки релізу: `minimum` залишає найшвидші OpenAI/ядро
release-critical доріжки, `stable` додає стабільний набір провайдерів/бекендів, а
`full` запускає широку advisory матрицю провайдерів/медіа. Umbrella записує
ідентифікатори дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній workflow перезапустили і він став зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат umbrella та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного дочірнього релізного workflow або вужчу
групу релізу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це тримає повторний запуск
невдалого релізного бокса обмеженим після точкового виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за провайдером
`native-live-src-gateway-profiles` jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені audio/video шарди медіа та
відфільтровані за провайдером музичні шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме файлове покриття, але робить повільні live
збої провайдерів простішими для повторного запуску й діагностики. Агреговані
назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових повторних запусків.

Нативні live медіа-шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; медіа-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed
live набори на звичайних Blacksmith runners, бо контейнерні завдання не підходять
для запуску вкладених Docker-тестів.

Docker-backed шарди live моделей/бекендів використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
release workflow один раз збирає й публікує цей образ, а потім шарди Docker live model,
Gateway, CLI backend, ACP bind і Codex harness запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди самостійно перебудовують повну Docker
ціль джерел, релізний запуск налаштовано неправильно, і він марнуватиме реальний час
на дубльовані збірки образів.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв'язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей артефакт
і в live/E2E release-path Docker workflow, і в шард package acceptance.
Це зберігає байти пакета узгодженими між релізними боксами й уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації артефакту пакета
без блокування release workflow. Він розв'язує одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS URL tarball із SHA-256 або tarball artifact
з іншого запуску GitHub Actions, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
вибір Docker-доріжок. Профіль `package` використовує offline покриття Plugin, щоб
валідація опублікованого пакета не залежала від доступності live ClawHub. Необов'язкова
доріжка Telegram повторно використовує артефакт
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
опублікованої npm-специфікації зберігається для окремих dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей встановлюваний пакет OpenClaw
як продукт?" Це відрізняється від звичайного CI: звичайний CI валідовує
дерево джерел, тоді як приймання пакета валідовує один tarball через той самий
Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв'язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і друкує джерело, workflow ref, package
   ref, версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей артефакт, валідовує інвентар tarball, готує package-digest
   Docker-образи за потреби й запускає вибрані Docker-доріжки проти цього
   пакета замість пакування workflow checkout. Коли профіль вибирає
   кілька targeted `docker_lanes`, reusable workflow готує пакет
   і спільні образи один раз, а потім розгортає ці доріжки як паралельні targeted Docker
   завдання з унікальними артефактами.
3. `package_telegram` необов'язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`,
   коли Package Acceptance розв'язав його; окремий Telegram dispatch
   усе ще може встановити опубліковану npm-специфікацію.
4. `summary` провалює workflow, якщо розв'язання пакета, Docker acceptance або
   необов'язкова доріжка Telegram завершилися збоєм.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  релізну версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  доступний з історії гілки репозиторію або релізного тегу, встановлює залежності у
  відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов'язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов'язковий, але його варто надати для
  артефактів, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідовувати
старіші довірені коміти джерел без запуску старої логіки workflow.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов'язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker
chunks release-path покривають перетин package/update/plugin доріжок, тоді як Package
Acceptance зберігає artifact-native доказ bundled-channel compat, offline Plugin і
Telegram проти того самого розв'язаного tarball пакета.
Крос-OS перевірки релізу все ще покривають OS-специфічне onboarding, installer і
поведінку платформи; product-валідацію package/update слід починати з Package
Acceptance. Windows packaged і installer fresh доріжки також перевіряють, що
встановлений пакет може імпортувати browser-control override із сирого абсолютного
Windows-шляху. OpenAI крос-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли він заданий, інакше `openai/gpt-5.4-mini`, щоб
install і Gateway proof залишалися швидкими й детермінованими. Окремі live
доріжки provider/model усе ще покривають ширшу маршрутизацію моделей, зокрема повільніші
frontier defaults.

Package Acceptance має обмежені вікна legacy-сумісності для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих приватних QA записів у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball,
`doctor-switch` може пропустити підвипадок persistence `gateway install --wrapper`,
коли пакет не exposes цей прапорець, `update-channel-switch` може обрізати
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
розташування install-record або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволити migration config metadata, усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Уже
опублікований пакет `2026.4.26` також може попереджати про файли stamp metadata локального build,
які вже були shipped. Пізніші пакети мають задовольняти сучасні contracts; ті самі
умови падають замість попередження або пропуску.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній, а не повторному запуску повної валідації релізу.

QA Lab має окремі CI-лінії поза основним workflow з розумною областю. Workflow `Parity gate` запускається для відповідних змін у PR і вручну; він збирає приватний QA runtime і порівнює агентні пакети mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгалужує mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Перевірки релізу запускають live transport lanes Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway також вимикає пошук у пам’яті, тому що QA parity окремо покриває поведінку пам’яті; підключення провайдерів покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для планових і релізних gates, додаючи `--fail-fast` лише тоді, коли це підтримує перевірений CLI. Типове значення CLI і ручний ввід workflow лишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу QA Lab lanes перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane-завдання, потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння. Не ставте шлях приземлення PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналу, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і дотримуйтеся доказів із CI/перевірок відповідної області.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для прибирання дублікатів після приземлення. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що приземлений PR змерджено і що кожен дублікат має або спільну referenced issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким первинним security scanner, а не повним sweep репозиторію. Щоденні, ручні та guard-запуски non-draft pull request сканують код Actions workflow, а також найризикованіші JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і gateway за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity` у категорії `/codeql-security-high/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel, а також channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-security-high/channel-runtime-boundary`, щоб security signal каналів міг масштабуватися без розширення базової категорії auth/secrets. Завдання network-ssrf-boundary сканує core SSRF, IP parsing, network guard, web-fetch і поверхні SSRF policy Plugin SDK у категорії `/codeql-security-high/network-ssrf-boundary`, щоб signal межі довіри мережі лишався окремим від security baseline auth/secrets. Завдання mcp-process-tool-boundary сканує MCP servers, process execution helpers, outbound delivery і agent tool-execution gates у категорії `/codeql-security-high/mcp-process-tool-boundary`, щоб signal меж команд і tools лишався окремим як від baseline auth/secrets, так і від non-security MCP/process quality shard. Завдання plugin-trust-boundary сканує plugin install, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface і trust surfaces контракту пакета Plugin SDK у категорії `/codeql-security-high/plugin-trust-boundary`, щоб signal supply-chain і runtime-loading для plugin лишався окремим як від коду реалізації bundled plugin, так і від non-security plugin quality shard. Pull request guard лишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і запускає ту саму high-confidence security matrix, що й плановий workflow. Android і macOS CodeQL лишаються поза типовими PR-запусками.

Workflow `CodeQL Android Critical Security` — це плановий Android security shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним типовим workflow, тому що macOS build домінує в runtime навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за плановий профіль: non-draft PR запускають лише відповідні shards `channel-runtime-boundary`, `gateway-runtime-boundary`, `provider-runtime-boundary`, `plugin-boundary` і `plugin-sdk-package-contract` для змін channel runtime, gateway protocol/server-method, provider runtime/model catalog, plugin loader, Plugin SDK або package-contract. Зміни конфігурації CodeQL і quality workflow запускають усі п’ять PR quality shards. Його manual dispatch приймає `profile=all|channel-runtime-boundary|gateway-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; вузькі профілі є teaching/iteration hooks для запуску одного quality shard ізольовано без dispatch решти workflow. Його завдання core-auth-secrets сканує auth, secrets, sandbox, cron і код межі gateway security в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization та IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers and tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання plugin-sdk-reply-runtime сканує Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-reply-runtime`. Завдання provider-runtime-boundary сканує model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding provider registries в окремій категорії `/codeql-critical-quality/provider-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і entrypoint contracts Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує published package-side Plugin SDK source і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

Workflow `Docs Agent` — це event-driven maintenance lane Codex для підтримання наявної документації в синхроні з нещодавно приземленими змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з моменту останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має суто розкладного запуску: успішний запуск CI після небот-пушу в `main` може його ініціювати, але він пропускається, якщо інший виклик через workflow-run уже виконувався або виконується цього дня за UTC. Ручний запуск обходить цей щоденний шлюз активності. Лінія створює згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують базову кількість прохідних тестів. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а післяагентний звіт для повного набору тестів має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як бот-пуш потрапляє в репозиторій, лінія перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює пуш; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберегти таку саму безпечну позицію drop-sudo, як агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених plugins і побудова маніфесту CI | Завжди для недрафтових пушів і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит робочих процесів через `zizmor`                           | Завжди для недрафтових пушів і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі npm advisories                           | Завжди для недрафтових пушів і PR |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для недрафтових пушів і PR |
| `build-artifacts`                | Побудова `dist/`, Control UI, перевірки зібраних артефактів і багаторазових downstream-артефактів | Зміни, релевантні для Node        |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, за винятком ліній каналів, bundled, контрактів і extensions          | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент основного локального шлюзу: production-типи, lint, guards, тестові типи та strict smoke | Зміни, релевантні для Node |
| `check-additional`               | Архітектура, межі, guards поверхні extensions, межі пакетів і шарди gateway-watch            | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збірки та smoke для сумісності з Node 22                                               | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python-skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс регресії shared runtime import specifier   | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням спільних зібраних артефактів                  | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка і тести для macOS-застосунку                                              | Зміни, релевантні для macOS        |
| `android`                        | Модульні тести Android для обох варіантів плюс одна debug APK-збірка                         | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний запуск    |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped-лінію, не пов’язану з Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для plugins, shard лише для релізів `agentic-plugins`, повний batch sweep extensions і Docker-лінії plugin prerelease виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий робочий процес `Plugin Prerelease` з увімкненим шлюзом release-validation. Ручні запуски використовують унікальну групу конкурентності, щоб повний набір release-candidate не був скасований іншим пушем або PR-запуском на тому самому ref. Необов’язковий ввід `target_ref` дає змогу довіреному викликачеві запустити цей граф для гілки, тегу або повного SHA коміту, використовуючи файл робочого процесу з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок швидкої відмови

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформні та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області та змушує preflight-маніфест
поводитися так, ніби змінилася кожна область з визначеною областю дії.
Редагування CI workflow перевіряють граф Node CI разом із лінтингом workflow, але самі собою не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються обмеженими змінами платформного вихідного коду.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-test, а також вузькі редагування допоміжних засобів/маршрутизації тестів контрактів плагінів використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів вбудованих плагінів і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами запуску npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю лінію; не пов’язані зміни вихідного коду, плагінів, install-smoke і лише тестові зміни залишаються на лініях Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих плагінів і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованих плагінів, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та запускає обмежений Docker-профіль вбудованих плагінів із 240-секундним агрегованим тайм-аутом команди, де Docker-запуск кожного сценарію обмежений окремо. Повний шлях зберігає встановлення QR-пакета й Docker/update-покриття інсталятора для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull requests, які справді торкаються поверхонь інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR root Dockerfile smoke-образ для target-SHA, а потім запускає встановлення QR-пакета, smoke-перевірки root Dockerfile/gateway, smoke-перевірки інсталятора/update і швидкий Docker E2E вбудованих плагінів як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками root-образу. Пуші в `main`, зокрема merge commits, не примушують повний шлях; коли логіка changed-scope запитувала б повне покриття на push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки. Повільний Bun global install image-provider smoke окремо контролюється `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть увімкнути його, але pull requests і пуші в `main` його не запускають. QR і Docker-тести інсталятора зберігають власні інсталяційно-орієнтовані Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а чутливу до провайдерів кількість слотів tail-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб лінії npm install і multi-service не перевантажували Docker, тоді як легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні обмеження, все ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Запуски ліній за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ліній, зберігає таймінги ліній для сортування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планувати нові pooled-лінії після першого збою, і кожна лінія має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail-лінії використовують жорсткіші обмеження для окремих ліній. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні лінії планувальника, зокрема release-only лінії на кшталт `install-e2e` і розділені лінії bundled update на кшталт `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу лінію. Багаторазово використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує artifact пакета з поточного запуску, або завантажує artifact пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через кеш Docker-шарів Blacksmith, коли план потребує ліній із установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторювався замість того, щоб споживати більшу частину критичного шляху CI. Workflow `Package Acceptance` є високорівневим пакувальним gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або artifact попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у багаторазово використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance-логіка могла перевіряти старіші довірені commits без checkout старого workflow-коду. Release checks запускають власну дельту Package Acceptance для цільового ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA проти визначеного tarball. Docker-набір release-path запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу та виконував кілька ліній через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне покриття release-path цього вимагає, і зберігає окремий chunk `openwebui` лише для запусків тільки OpenWebUI. Застарілі агреговані назви chunk `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` все ще працюють для ручних повторних запусків, але release workflow використовує розділені chunks, щоб installer E2E і перевірки встановлення/видалення вбудованих плагінів не домінували над критичним шляхом. Alias лінії `install-e2e` залишається агрегованим alias ручного повторного запуску для обох provider installer-ліній. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*`, а не серійну all-in-one лінію `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, фазовими таймінгами, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує налагодження невдалої лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує artifact пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає live-test image для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної лінії включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень повільних ліній і критичного шляху фаз. Запланований workflow live/E2E щодня запускає повний Docker-набір release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторні npm update і doctor repair проходи могли шардитися з іншими bundled-перевірками.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований chunk `bundled-channels` залишається доступним для ручних one-shot повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими alias для plugin/runtime, але release workflow використовує розділені chunks, щоб channel smokes, цілі оновлення, перевірки plugin runtime і перевірки встановлення/видалення вбудованих плагінів могли працювати паралельно. Цільові запуски `docker_lanes` також розділяють кілька вибраних ліній на паралельні завдання після одного спільного етапу підготовки пакета/образу, а bundled-channel update-лінії повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Локальна логіка змінених смуг живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний шлюз суворіший щодо архітектурних меж, ніж широкий обсяг CI-платформи: зміни виробничого коду core запускають перевірку типів core prod і core test, а також core lint/guards; зміни лише тестів core запускають тільки перевірку типів core test і core lint; зміни виробничого коду розширень запускають перевірку типів extension prod і extension test, а також extension lint; зміни лише тестів розширень запускають перевірку типів extension test і extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до перевірки типів розширень, бо розширення залежать від цих контрактів core, але Vitest-прогони розширень є явною тестовою роботою. Зміни лише метаданих випуску для підвищення версії запускають цільові перевірки версії/конфігурації/root-залежностей. Невідомі зміни root/config безпечно переходять до всіх смуг перевірок.
Локальна маршрутизація змінених тестів живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування джерел віддають перевагу явним відображенням, потім сусіднім тестам і
залежним елементам графа імпортів. Спільна конфігурація доставки group-room є одним
із явних відображень: зміни до конфігурації видимої відповіді групи, режиму доставки
відповіді джерела або маршруту системного промпта message-tool проходять через
основні тести відповідей плюс регресії доставки Discord і Slack, щоб зміна
спільного типового значення впала до першого push PR. Використовуйте
`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо
широка для всього тестового каркаса, щоб дешевий відображений набір не був надійним
замінником.

Для валідації Testbox запускайте з кореня репозиторію та віддавайте перевагу свіжо прогрітому box для
широкого доказу. Перш ніж витрачати повільний шлюз на box, який було повторно використано, термін дії якого сплив або
який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity-перевірка швидко завершується невдачею, коли потрібні кореневі файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість налагодження
помилки продуктового тесту. Для навмисних PR із великим видаленням встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у
фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Ручні CI-dispatch запускають `checks-node-compat-node22` як широке покриття сумісності. Android є опційним для самостійного ручного CI через `include_android=true` і завжди увімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і самостійні ручні CI-dispatch тримають цей suite вимкненим.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося малим без надмірного резервування runner: контракти каналів запускаються як три зважені шарди, малі core unit-смуги поєднані, auto-reply запускається як чотири збалансовані worker з reply-піддеревом, розділеним на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin-конфігурації розподілені між наявними source-only agentic Node-завданнями замість очікування на зібрані артефакти. Широкі browser, QA, media та різні plugin-тести використовують свої виділені Vitest-конфіги замість спільного plugin catch-all. `Plugin Prerelease` балансує тести bundled plugin між вісьмома worker розширень; ці shard-завдання розширень запускають до двох груп plugin-конфігів одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy plugin-пакети не створювали додаткових CI-завдань. Широка agents-смуга використовує спільний file-parallel scheduler Vitest, бо вона визначається імпортами/плануванням, а не одним повільним тестовим файлом. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів хвостом. Include-pattern shard записують timing-записи з назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий конфіг від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary-роботу разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, тести каналів і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі verifier-завдання й водночас уникаючи двох додаткових Blacksmith worker і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test-смуга все одно компілює цей flavor із SMS/call-log BuildConfig-прапорцями, уникаючи дублювання завдання пакування debug APK для кожного Android-релевантного push.
GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все ще повідомляють звичайні shard-помилки, але не стають у чергу після того, як увесь workflow уже був витіснений.
Автоматичний ключ паралельності CI версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші запуски main. Ручні full-suite запуски використовують `CI-manual-v1-*` і не скасовують уже запущені виконання.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled-перевірки, шардовані перевірки контрактів каналів, `check` shard, крім lint, `check-additional` shard і агрегати, verifier-и агрегатів Node-тестів, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard розширень із меншою вагою, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard Linux Node-тестів, shard тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-чутливим, щоб 8 vCPU коштували більше, ніж заощаджували; Docker-збірки install-smoke, де час у черзі для 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
