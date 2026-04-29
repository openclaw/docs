---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущено.
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, контрольні перевірки області дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T21:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1ebc8e9e34c27f4ae176e8183637dfe4e1c84c2510b8ffe5614eb4c21c8963
    source_path: ci.md
    workflow: 16
---

CI запускається на кожен push у `main` і кожен pull request. Вона використовує розумне звуження області, щоб пропускати дорогі завдання, коли змінювалися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне звуження області й розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації, з Android-ланами, які вмикаються через `include_android` для окремих ручних запусків. Релізні лани попереднього випуску Plugin живуть в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, продакшн-прохід Knip лише для залежностей, прив’язаний до найновішої версії Knip, яку використовує цей скрипт, з вимкненим мінімальним віком релізу pnpm для встановлення через `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює продакшн-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей захист падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, згенерованих артефактів, збірки, live-тестів і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для "запустити все
перед релізом." Він приймає branch, tag або повний commit SHA, запускає
ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для
релізного proof plugin/package/static/Docker, і запускає
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
ланів. Він також може запустити post-publish workflow `NPM Telegram Beta E2E`, коли
надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує широтою live/provider,
що передається в release checks: `minimum` залишає найшвидші критичні для релізу лани OpenAI/core,
`stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory matrix provider/media. Umbrella записує
ідентифікатори запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього
run. Якщо дочірній workflow перезапустили і він став зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат umbrella і зведення таймінгів.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього workflow або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це тримає перезапуск невдалого
release box обмеженим після сфокусованого виправлення.

Дочірній live/E2E релізу зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені шарди медіа audio/video і
відфільтровані за provider музичні шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме файлове покриття, водночас роблячи повільні live
збої provider простішими для перезапуску й діагностики. Агреговані
назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, тому що container jobs — неправильне
місце для запуску nested Docker tests.

Docker-backed live model/backend шарди використовують окремий shared
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow будує і пушить цей image один раз, після чого шарди Docker live model,
gateway, CLI backend, ACP bind і Codex harness запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повний source Docker
target, release run неправильно налаштований і марнуватиме wall clock на дубльовані збірки image.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей артефакт
і в live/E2E release-path Docker workflow, і в package acceptance
шард. Це тримає байти пакета узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації артефакта пакета
без блокування release workflow. Він розв’язує один candidate з
опублікованої npm spec, trusted `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі покривають smoke, package, product, full і custom
вибори Docker lane. Профіль `package` використовує offline plugin coverage, щоб
валідація опублікованого пакета не залежала від live доступності ClawHub. Опційний
Telegram lane повторно використовує артефакт
`package-under-test` у workflow `NPM Telegram Beta E2E`, зі шляхом
опублікованої npm spec, збереженим для standalone dispatches.

## Package acceptance

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей інстальований пакет OpenClaw
як продукт?" Це відрізняється від звичайної CI: звичайна CI валідує
source tree, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі запускають після встановлення або оновлення.

Workflow має чотири jobs:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує один package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей артефакт, валідує inventory tarball, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   пакета замість пакування workflow checkout. Коли профіль вибирає
   кілька цільових `docker_lanes`, reusable workflow готує пакет
   і shared images один раз, а потім розгортає ці lanes як паралельні цільові Docker
   jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`,
   коли Package Acceptance розв’язав його; standalone Telegram dispatch
   все ще може встановити опубліковану npm spec.
4. `summary` валить workflow, якщо package resolution, Docker acceptance або
   опційний Telegram lane завершилися невдало.

Джерела candidate:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  acceptance опублікованої beta/stable.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA.
  Resolver fetch-ить branches/tags OpenClaw, перевіряє, що вибраний commit
  досяжний з історії branch репозиторію або release tag, встановлює deps у
  detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надати для
  зовнішньо поширених artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає поточному test harness змогу валідувати
старіші trusted source commits без запуску старої workflow logic.

Профілі відповідають Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` plus `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають перекривні package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native proof для bundled-channel compat, offline plugin і
Telegram проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
інстальований пакет може імпортувати browser-control override із raw абсолютного
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано, інакше `openai/gpt-5.4-mini`, тож
install і gateway proof залишаються швидкими й deterministic. Окремі live
provider/model lanes усе ще покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені legacy-compatibility windows для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, включно з `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені tarball,
`doctor-switch` може пропускати subcase persistence `gateway install --wrapper`,
коли пакет не expose-ить цей flag, `update-channel-switch` може prune
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти migration config metadata, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
пакет `2026.4.26` також може попереджати про local build metadata stamp files,
які вже були shipped. Пізніші пакети мають відповідати modern contracts; ті самі
умови fail-яться замість warn або skip.

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

Під час налагодження невдалого запуску перевірки прийнятності пакета починайте зі
зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256.
Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали лейн, таймінги
фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого
профілю пакета або точних Docker-лейн замість повторного запуску повної релізної
валідації.

QA Lab має окремі CI-лейни поза основним workflow із розумною прив’язкою до
області змін. Workflow `Parity gate` запускається для відповідних змін у PR і
вручну; він збирає приватний QA runtime і порівнює агентні пакети mock GPT-5.5
та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і
вручну; він розгортає mock parity gate, live Matrix-лейн, а також live-лейни
Telegram і Discord як паралельні завдання. Live-завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex.
Релізні перевірки запускають live transport-лейни Matrix і Telegram із
детермінованим mock-провайдером і моделями, кваліфікованими як mock
(`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був
ізольований від затримок live-моделей і звичайного запуску provider-plugin. Live
transport gateway також вимикає пошук у пам’яті, бо QA parity окремо покриває
поведінку пам’яті; підключення провайдерів покривається окремими live model,
native provider і Docker provider наборами. Matrix використовує `--profile fast`
для запланованих і релізних гейтів, додаючи `--fail-fast` лише тоді, коли
отриманий CLI це підтримує. Типове значення CLI і ручний вхід workflow
залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне
покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і
`e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу лейни
QA Lab перед схваленням релізу; його QA parity gate запускає пакети candidate і
baseline як паралельні lane-завдання, а потім завантажує обидва артефакти в мале
звітне завдання для фінального порівняння parity. Не ставте шлях landing PR за
`Parity gate`, якщо зміна фактично не торкається QA runtime, parity модельного
пакета або поверхні, якою володіє parity workflow. Для звичайних виправлень
каналів, конфігурації, документації або unit-тестів вважайте це необов’язковим
сигналом і спирайтеся на scoped CI/check докази.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для
очищення дублікатів після landing. За замовчуванням він працює в dry-run і
закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він
перевіряє, що landed PR злито, і що кожен дублікат має або спільну згадану
issue, або перетин змінених hunk.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не
повним sweep репозиторію. Щоденні й ручні запуски сканують код Actions workflow,
а також найризикованіші JavaScript/TypeScript поверхні auth, secrets, sandbox,
cron і gateway високоточними security queries у категорії
`/codeql-critical-security/core-auth-secrets`. Завдання
channel-runtime-boundary окремо сканує контракти реалізації core channel разом
із runtime channel plugin, gateway, Plugin SDK, secrets і audit touchpoints у
категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security
signal каналів міг масштабуватися без розширення базової категорії auth/secrets.
Завдання network-ssrf-boundary сканує core SSRF, IP parsing, network guard,
web-fetch і поверхні SSRF policy у Plugin SDK у категорії
`/codeql-critical-security/network-ssrf-boundary`, щоб сигнал межі довіри мережі
залишався окремим від security baseline auth/secrets. Завдання
mcp-process-tool-boundary сканує MCP servers, process execution helpers,
outbound delivery і agent tool-execution gates у категорії
`/codeql-critical-security/mcp-process-tool-boundary`, щоб сигнал меж команд і
tool залишався окремим як від baseline auth/secrets, так і від
non-security MCP/process quality shard.

Workflow `CodeQL Android Critical Security` — це запланований Android security
shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux
runner label, прийнятому workflow sanity, і завантажує результати в категорію
`/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security
shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, фільтрує
результати dependency build із завантаженого SARIF і завантажує результати в
категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
типовим workflow, бо macOS build домінує за часом виконання навіть у чистому
стані.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він
запускає лише JavaScript/TypeScript quality queries із severity error і без
security overtones на вузьких high-value поверхнях на меншому Blacksmith Linux
runner. Його ручний dispatch приймає `profile=all|plugin-sdk-package-contract`;
вузький профіль є першим teaching/iteration hook для запуску одного quality
shard ізольовано без dispatch решти workflow. Його завдання core-auth-secrets
сканує код меж auth, secrets, sandbox, cron і gateway security в окремій
категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary
сканує config schema, migration, normalization і IO contracts в окремій
категорії `/codeql-critical-quality/config-boundary`. Завдання
gateway-runtime-boundary сканує gateway protocol schemas і server method
contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`.
Завдання channel-runtime-boundary сканує core channel implementation contracts в
окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання
agent-runtime-boundary сканує command execution, model/provider dispatch,
auto-reply dispatch and queues і ACP control-plane runtime contracts в окремій
категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання
mcp-process-runtime-boundary сканує MCP servers and tool bridges, process
supervision helpers і outbound delivery contracts в окремій категорії
`/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання
memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory
Plugin SDK aliases, memory runtime activation glue і memory doctor commands в
окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання
ui-control-plane сканує Control UI bootstrap, local persistence, gateway control
flows і task control-plane runtime contracts в окремій категорії
`/codeql-critical-quality/ui-control-plane`. Завдання
web-media-runtime-boundary сканує core web fetch/search, media IO, media
understanding, image-generation і media-generation runtime contracts в окремій
категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання
plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint
contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Завдання plugin-sdk-package-contract сканує опубліковане джерело Plugin SDK на
боці package і helpers контракту package plugin в окремій категорії
`/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо
від security, щоб quality findings можна було планувати, вимірювати, вимикати
або розширювати без затемнення security signal. Розширення CodeQL для Swift,
Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work
лише після того, як вузькі профілі матимуть стабільні runtime і signal.

Workflow `Docs Agent` — це подієво-керований Codex maintenance lane для
підтримання наявної документації в узгодженому стані з нещодавно landed
змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main`
може його запустити, а manual dispatch може запускати його безпосередньо.
Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли
інший non-skipped Docs Agent run було створено протягом останньої години. Коли
він запускається, то переглядає діапазон комітів від попереднього non-skipped
Docs Agent source SHA до поточного `main`, тож один погодинний запуск може
покрити всі зміни main, накопичені з моменту останнього docs pass.

Workflow `Test Performance Agent` — це подієво-керований Codex maintenance lane
для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run
на `main` може його запустити, але він пропускається, якщо інший workflow-run
invocation уже виконувався або виконується цього UTC-дня. Manual dispatch обходить
цей daily activity gate. Лейн створює grouped Vitest performance report для
повного набору, дозволяє Codex вносити лише невеликі test performance fixes зі
збереженням coverage замість широких refactor, потім повторно запускає звіт
повного набору й відхиляє зміни, що зменшують baseline test count, який
проходить. Якщо baseline має failing tests, Codex може виправляти лише obvious
failures, а after-agent full-suite report має пройти перед будь-яким комітом.
Коли `main` просувається вперед до landing bot push, лейн rebase перевірений
patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale
patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action
міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдання

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production-файла блокування без залежностей щодо попереджень npm                       | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирає `dist/`, UI керування, перевірки зібраних артефактів і перевикористовні downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/Plugin-контрактів/протоколу          | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів ядра Node, крім ліній каналів, bundled, контрактів і розширень                  | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент головного локального гейта: production-типи, lint, guard-перевірки, типи тестів і строгий smoke-тест | Зміни, релевантні для Node         |
| `check-additional`               | Архітектура, межі, guard-перевірки поверхні розширень, межі пакетів і шарди gateway-watch    | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті запуску                                       | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналу зібраних артефактів                                            | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-лінія                                                    | Ручний запуск CI для релізів       |
| `check-docs`                     | Перевірки форматування документації, lint і непрацюючих посилань                            | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python-Skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресійні перевірки специфікаторів імпорту runtime | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія тестів TypeScript для macOS зі спільними зібраними артефактами                         | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                        | Unit-тести Android для обох варіантів плюс одна збірка debug APK                             | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх основного CI або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
не-Android scoped-лінію: Linux Node-шарди, шарди bundled-Plugin, контракти каналів,
сумісність із Node 22, `check`, `check-additional`, smoke-тест збірки, перевірки документації,
Python Skills, Windows, macOS і i18n UI керування. Окремі ручні запуски CI
виконують лише Android з `include_android=true`; повна релізна
парасоля вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin,
релізний шард `agentic-plugins`, повний batch sweep розширень
і Docker-лінії передрелізу Plugin виключені з CI. Передрелізний набір Docker
запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим гейтом release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному виклику запустити цей граф для гілки, тегу або повного SHA коміту, водночас
використовуючи файл workflow з вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих завдань матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Важчі платформні й runtime-лінії розгалужуються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест
діяти так, ніби кожна область дії змінилася.
Редагування CI workflow перевіряють граф Node CI та linting workflow, але самі по собі не примушують запускати Windows, Android або macOS native builds; ці платформні lanes залишаються прив’язаними до змін у платформному вихідному коді.
Редагування лише CI routing, вибрані дешеві редагування core-test fixture, а також вузькі редагування helper/test-routing для plugin contract використовують швидкий Node-only шлях маніфесту: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, channel contracts, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені routing або helper surfaces, які fast task перевіряє напряму.
Windows Node checks обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і поверхнями CI workflow, які виконують цей lane; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для Docker/package surfaces, змін пакетів/маніфестів bundled plugin, а також core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Зміни лише source у bundled plugin, test-only редагування і docs-only редагування не резервують Docker workers. Fast path один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений bundled-plugin Docker profile під 240-секундним aggregate command timeout, причому Docker run кожного сценарію обмежений окремо. Full path зберігає QR package install і installer Docker/update покриття для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав після root image smokes. Пуші в `main`, включно з merge commits, не примушують full path; коли changed-scope logic запросила б full coverage під час push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть увімкнути його, але pull requests і пуші в `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожного lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, за допомогою `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool, що дорівнює 10, за допомогою `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких lanes за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, тоді як легші lanes усе ще заповнюють доступні слоти. Один lane, важчий за ефективні обмеження, усе одно може стартувати з порожнього pool, а потім виконується сам, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникнути локальних Docker daemon create storms; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate виконує preflight Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої failure, а кожен lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, такими як `install-e2e`, і split bundled update lanes, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити один failed lane. Reusable live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає і публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache від Blacksmith, коли plan потребує package-installed lanes; і повторно використовує передані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Pulls Docker images повторюються з обмеженим 180-секундним timeout на спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшу частину CI critical path. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або artifact попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли full release-path coverage цього потребує, і зберігає standalone chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*`, а не serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти prepared images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо selected lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane міг повторно використати точний package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає full release-path Docker suite. Bundled update matrix розділена за update target, щоб повторювані npm update і doctor repair passes могли виконуватися shards разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька selected lanes на parallel jobs після одного спільного package/image preparation step, а bundled-channel update lanes один раз повторюються в разі transient npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий обсяг CI-платформи: зміни production-коду ядра запускають typecheck для core prod і core test, а також core lint/guards; зміни лише в тестах ядра запускають тільки typecheck для core test і core lint; зміни production-коду розширень запускають typecheck для extension prod і extension test, а також extension lint; зміни лише в тестах розширень запускають typecheck для extension test і extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck розширень, бо розширення залежать від цих контрактів ядра, але Vitest-перевірки розширень є явною тестовою роботою. Версійні оновлення лише release-метаданих запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переходять на всі check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни джерел віддають перевагу явним мапінгам, потім sibling-тестам і залежним
за import-graph. Shared group-room delivery config є одним із явних мапінгів:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна shared default падала до першого push у PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки harness-wide, що дешевий mapped set не є надійним proxy.

Для Testbox-валідації запускайте з кореня repo і віддавайте перевагу свіжому прогрітому box для
широкого доказу. Перед тим як витрачати повільний gate на box, який повторно використали, строк дії якого минув або
який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли зникли обов’язкові root-файли, такі як
`pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість того, щоб налагоджувати
product test failure. Для навмисних PR із великими видаленнями задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у
sync phase понад п’ять хвилин без post-sync output. Задайте
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Manual CI dispatches запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який dispatch-иться `Full Release Validation` або явним operator. Звичайні pull requests, `main` pushes і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три зважені shards, малі core unit lanes об’єднані в пари, auto-reply запускається як чотири збалансовані workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Широкий agents lane використовує shared Vitest file-parallel scheduler, бо він dominated by import/scheduling, а не належить одному повільному test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries з назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відділяє runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі check names як легкі verifier jobs, водночас уникаючи двох додаткових Blacksmith workers і другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе ще компілює цей flavor із SMS/call-log BuildConfig flags, водночас уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або `main` ref. Вважайте це CI noise, якщо найновіший run для того самого ref також не failing. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все ще повідомляють нормальні shard failures, але не стають у queue після того, як увесь workflow уже superseded.
Automatic CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в queue раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, нижчі за вагу extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, тому 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
- [Канали релізів](/uk/install/development-channels)
