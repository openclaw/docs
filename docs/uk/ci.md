---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, які не проходять
summary: Граф завдань CI, гейти області змін і локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T14:47:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c51dff5db84e2d11f98b363a55d0d21309eeb9fce00fe90a8a9013c9c80385
    source_path: ci.md
    workflow: 16
---

CI запускається для кожного push до `main` і кожного pull request. Вона використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації, а Android-лінії вмикаються через `include_android` для окремих ручних запусків. Релізні лінії попереднього релізу plugin розміщені в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, виробничий прохід Knip лише для залежностей, прив’язаний до останньої версії Knip, яку використовує цей script, з вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює виробничі знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник завершується помилкою, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, згенерованих артефактів, збірки, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для «запустити все
перед релізом». Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
релізного proof plugin/package/static/Docker, а також dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
ліній. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли
надано специфікацію опублікованого package. `release_profile=minimum|stable|full` керує широтою live/provider,
яка передається в release checks: `minimum` зберігає найшвидші OpenAI/core
критичні для релізу лінії, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory-матрицю provider/media. Umbrella записує
ідентифікатори запущених дочірніх run, а фінальний job `Verify full validation` повторно перевіряє
поточні висновки дочірніх run і додає таблиці найповільніших job для кожного дочірнього
run. Якщо дочірній workflow перезапущено й він став green, перезапустіть лише батьківський
verifier job, щоб оновити результат umbrella та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожної релізної дочірньої перевірки або вужчу
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує перезапуск невдалого
release box у межах після цільового виправлення.

Дочірній live/E2E release зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
jobs `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs` замість
одного serial job. Це зберігає те саме файлове покриття й водночас спрощує перезапуск і діагностику
повільних live provider failures. Агреговані імена shard
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Нативні live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирає
workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску nested Docker tests.

Docker-backed live model/backend shards використовують окремий shared
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow збирає й пушить цей image один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness shards запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards самостійно перебудовують повну source Docker
target, release run налаштовано неправильно, і він марнуватиме wall
clock на duplicate image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
як у live/E2E release-path Docker workflow, так і в shard package acceptance.
Це забезпечує узгодженість package bytes між release boxes і уникає
повторного пакування того самого кандидата в кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує одного кандидата з
опублікованої npm spec, trusted `package_ref`, зібраного вибраним
harness `workflow_ref`, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
вибори Docker lanes. Профіль `package` використовує offline plugin coverage, щоб
валідація published-package не залежала від доступності live ClawHub. Необов’язкова
Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях published npm spec
зберігається для standalone dispatches.

## Приймання package

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей інстальований package OpenClaw
як продукт?» Це відрізняється від звичайної CI: звичайна CI перевіряє
source tree, тоді як package acceptance перевіряє один tarball через той самий
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
   цей artifact, перевіряє tarball inventory, готує package-digest
   Docker images за потреби та запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька цільових `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як parallel targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав його; standalone Telegram dispatch
   все ще може встановити published npm spec.
4. `summary` завершує workflow помилкою, якщо package resolution, Docker acceptance або
   необов’язкова Telegram lane завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  досяжний з історії repository branch або release tag, встановлює deps у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти
старіші trusted source commits без запуску старої workflow logic.

Профілі відповідають Docker coverage:

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
`telegram_mode=mock-openai`. Docker chunks release-path
покривають перетин package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native proof для bundled-channel compat, offline plugin і
Telegram проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може імпортувати browser-control override з raw absolute
Windows path. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано, інакше `openai/gpt-5.4-mini`, тому
install і gateway proof залишаються швидкими й детермінованими. Окремі live
provider/model lanes і надалі покривають ширшу model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені windows legacy-compatibility для вже
опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені tarball,
`doctor-switch` може пропустити subcase persistence `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволити config metadata migration, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може попереджати про local build metadata stamp files,
які вже були shipped. Пізніші packages мають відповідати сучасним contracts; ті самі
умови завершуються помилкою замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали смуг, часові показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних смуг Docker замість повторного запуску повної валідації релізу.

QA Lab має окремі смуги CI поза головним робочим процесом із розумним визначенням області. Робочий процес `Parity gate` запускається для відповідних змін у PR і вручну; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.5 і Opus 4.6. Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, живу смугу Matrix, а також живі смуги Telegram і Discord як паралельні завдання. Живі завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу запускають живі транспортні смуги Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки живої моделі та звичайного запуску provider-plugin. Живий транспортний Gateway також вимикає пошук у пам’яті, оскільки parity QA покриває поведінку пам’яті окремо; підключення провайдерів покривають окремі набори живої моделі, нативного провайдера та Docker-провайдера. Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли CLI з checkout це підтримує. Стандартне значення CLI і ручний ввід робочого процесу залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу смуги QA Lab перед затвердженням релізу; його QA parity gate запускає candidate і baseline пакети як паралельні завдання смуг, а потім завантажує обидва артефакти в невелике завдання звіту для фінального порівняння parity.
Не ставте шлях посадки PR за `Parity gate`, якщо зміна насправді не зачіпає середовище виконання QA, parity model-pack або поверхню, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або модульних тестів вважайте це необов’язковим сигналом і дотримуйтеся доказів scoped CI/check.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для очищення дублікатів після посадки. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що посаджений PR злито і що кожен дублікат має або спільну referenced issue, або перекривні змінені hunk.

Робочий процес `CodeQL` навмисно є вузьким першим проходом сканера безпеки, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код робочих процесів Actions, а також найризикованіші поверхні JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway за допомогою високоточних security queries. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel, а також channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії JS/TS.

Робочий процес `CodeQL Android Critical Security` — це запланований Android shard безпеки. Він вручну збирає Android app для CodeQL на найменшій мітці Blacksmith Linux runner, яку приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це щотижневий/ручний macOS shard безпеки. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним стандартним робочим процесом, оскільки збірка macOS домінує за часом виконання навіть коли все чисто.

Робочий процес `CodeQL Critical Quality` — це відповідний не-безпековий shard. Він запускає лише не-безпекові quality queries JavaScript/TypeScript із severity error на вузьких цінних поверхнях на меншому Blacksmith Linux runner. Його ручний dispatch приймає `profile=all|plugin-sdk-package-contract`; вузький профіль є першим teaching/iteration hook для запуску одного quality shard в ізоляції без dispatch решти робочого процесу.
Його завдання core-auth-secrets сканує boundary code для auth, secrets, sandbox, cron і gateway security в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує схеми протоколу gateway і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers and tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує опублікований package-side Plugin SDK source і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте робочий процес окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад лише як scoped або sharded follow-up work після того, як вузькі профілі матимуть стабільні runtime і signal.

Робочий процес `Docs Agent` — це подієво-керована смуга підтримки Codex для утримання наявної документації узгодженою з нещодавно посадженими змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже зрушив далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво-керована смуга підтримки Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC-дня. Manual dispatch обходить цей daily activity gate. Смуга формує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline count успішних тестів. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до посадки bot push, смуга rebase валідованого patch, повторно запускає `pnpm check:changed` і повторює push; conflict stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдання

| Завдання                         | Призначення                                                                                 | Коли запускається                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для недрафтових push і PR          |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR          |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі npm advisories                           | Завжди для недрафтових push і PR          |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR          |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і перевикористовні downstream-артефакти | Зміни, релевантні для Node                |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, релевантні для Node                |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node                |
| `checks-node-core-test`          | Шарди тестів ядра Node, без ліній каналів, bundled, контрактів і розширень                   | Зміни, релевантні для Node                |
| `check`                          | Шардований еквівалент основного локального gate: prod-типи, lint, guards, тестові типи та строгий smoke | Зміни, релевантні для Node                |
| `check-additional`               | Архітектура, межі, guards поверхні розширень, package-boundary і шарди gateway-watch         | Зміни, релевантні для Node                |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke стартової пам’яті                                         | Зміни, релевантні для Node                |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні для Node                |
| `checks-node-compat-node22`      | Лінія збірки й smoke сумісності з Node 22                                                    | Ручний запуск CI для релізів              |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію                      |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills       |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів і спільні регресії специфікаторів імпорту runtime | Зміни, релевантні для Windows             |
| `macos-node`                     | Лінія тестів TypeScript для macOS, що використовує спільні зібрані артефакти                 | Зміни, релевантні для macOS               |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні для macOS               |
| `android`                        | Модульні тести Android для обох flavor плюс одна збірка debug APK                            | Зміни, релевантні для Android             |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний запуск           |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово
вмикають кожну не-Android scoped-лінію: Linux Node shards, bundled-plugin shards, channel
contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки
документації, Python Skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI
виконують лише Android з `include_android=true`; повна релізна
парасолька вмикає Android, передаючи `include_android=true`. Статичні перевірки попереднього випуску Plugin,
release-only шард `agentic-plugins`, повний пакетний sweep розширень
і Docker-лінії попереднього випуску Plugin виключено з CI. Docker
набір попереднього випуску запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим push або PR-запуском на тому самому ref. Необов’язковий input `target_ref` дає змогу
довіреному виклику запустити цей граф для branch, tag або повного commit SHA,
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі лінії платформ і runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує preflight-маніфест
поводитися так, ніби змінилася кожна область дії.
Зміни CI workflow перевіряють граф Node CI та linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються прив'язаними до змін у платформному вихідному коді.
Зміни лише маршрутизації CI, вибрані дешеві зміни core-test fixture, а також вузькі зміни plugin contract helper/test-routing використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цю лінію; непов'язані зміни у вихідному коді, plugin, install-smoke і лише тестові зміни залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для Docker/package surfaces, змін bundled plugin package/manifest, а також core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled plugin, лише тестові зміни та лише docs-зміни не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений bundled-plugin Docker profile із 240-секундним сукупним таймаутом команди, де Docker run кожного сценарію окремо обмежений. Повний шлях зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. Пуші в `main`, зокрема merge commits, не примушують повний шлях; коли логіка changed-scope запитала б повне покриття на push, workflow зберігає fast Docker smoke і залишає full install smoke для нічної або релізної валідації. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з release checks workflow, а ручні `install-smoke` dispatches можуть увімкнути його опціонально, але pull requests і пуші в `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і функціональний образ, який встановлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і чутливу до provider кількість слотів tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження heavy lanes за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, тоді як легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за ефективні обмеження, усе одно може стартувати з порожнього pool, а потім виконується сама, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникнути локальних create storms Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус active-lane, зберігає timings lanes для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першого збою, і кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, зокрема release-only lanes, як-от `install-e2e`, і split bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу lane. Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає та пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache від Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker images повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий registry/cache stream швидко повторився, а не споживав більшу частину критичного шляху CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або попереднього workflow artifact, а потім передає цей єдиний artifact `package-under-test` у багаторазовий Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA для resolved tarball. Docker suite release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage запитує його, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в критичному шляху. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split `bundled-channel-*` і `bundled-channel-update-*` lanes замість послідовної all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що тримає debugging failed-lane обмеженим одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділена за update target, щоб повторні npm update і doctor repair passes могли shard-итися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних lanes на паралельні jobs після одного спільного package/image preparation step, а bundled-channel update lanes повторюють спробу один раз у разі transient npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо architecture boundaries, ніж широка platform scope CI: зміни core production запускають core prod і core test typecheck плюс core lint/guards, зміни лише core test запускають лише core test typecheck плюс core lint, зміни extension production запускають extension prod і extension test typecheck плюс extension lint, а зміни лише extension test запускають extension test typecheck плюс extension lint. Зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, тому що extensions залежать від цих core contracts, але Vitest extension sweeps є явною test work. Release metadata-only version bumps запускають targeted version/config/root-dependency checks. Невідомі root/config changes безпечно переходять до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни вихідного коду віддають перевагу явним mappings, а потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із explicit mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна shared default впала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для перевірки через Testbox запускайте з кореня репозиторію і для широкого підтвердження надавайте перевагу свіжому прогрітому box. Перш ніж витрачати повільний gate на box, який було повторно використано, строк дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box. Sanity-перевірка швидко завершується помилкою, коли зникли потрібні кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR. Зупиніть цей box і прогрійте свіжий замість того, щоб налагоджувати збій продуктового тесту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Ручні CI-dispatch запускають `checks-node-compat-node22` як широке покриття сумісності. Android є опціональним для окремого ручного CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається через `Full Release Validation` або явно оператором. Звичайні pull request, push у `main` і окремі ручні CI-dispatch тримають цей набір вимкненим.

Найповільніші сімейства тестів Node розділено або збалансовано, щоб кожна job залишалася малою без надмірного резервування runner: контракти каналів запускаються як три зважені shard, малі core unit lanes поєднані в пари, auto-reply запускається як чотири збалансовані worker із розділенням піддерева reply на shard agent-runner, dispatch і commands/state-routing, а agentic Gateway/Plugin-конфіги розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та різні plugin-тести використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує тести bundled Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу і більшим Node heap, щоб насичені імпортами plugin batches не створювали додаткові CI jobs. Широкий agents lane використовує спільний Vitest file-parallel scheduler, бо він обмежений імпортами/плануванням, а не одним повільним тестовим файлом. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів хвостом. Include-pattern shards записують timing entries з назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині однієї job. Gateway watch, тести каналів і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви check як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи дубльованої debug APK packaging job на кожному push, що стосується Android.
GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє на той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все ще звітують про звичайні shard failures, але не стають у чергу після того, як весь workflow уже було витіснено.
Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують runs, що виконуються.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, менш вагомі extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-чутливим, що 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

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
