---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося.
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять.
summary: Граф завдань CI, гейти області дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T20:52:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d448fb1d5b30b32bd71b79921c0eb8a36b00932e12a31bb069304cf0d1518a8
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для release candidate або широкої валідації, а Android-напрями вмикаються через `include_android` для окремих ручних запусків. Release-only напрями попереднього випуску Plugin розміщені в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, виробничий dependency-only прохід Knip, зафіксований на найновішій версії Knip, яку використовує цей скрипт, з вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює виробничі знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні динамічні Plugin, згенеровані, build, live-test і package bridge поверхні, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний commit SHA, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
release-only доказу Plugin/package/static/Docker і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suite, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
напрямів. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано
опублікований package spec. `release_profile=minimum|stable|full` керує live/provider
шириною, що передається в release checks: `minimum` залишає найшвидші OpenAI/core
release-critical напрями, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media matrix. Umbrella записує
ids dispatch-нутих child run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки child run і додає таблиці найповільніших завдань для кожного child
run. Якщо child workflow перезапущено й він став зеленим, перезапустіть лише parent
verifier job, щоб оновити результат umbrella і зведення часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для
звичайного повного CI child, `release-checks` для кожного release child або вужчу
release group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` на umbrella. Це утримує перезапуск
невдалого release box у межах після цільового виправлення.

Release live/E2E child зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, provider-filtered
`native-live-src-gateway-profiles` jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди та
provider-filtered music шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме покриття файлів, водночас
полегшуючи перезапуск і діагностику повільних збоїв live provider. Агреговані
назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирає
workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media jobs лише перевіряють бінарні файли перед setup. Тримайте Docker-backed
live suites на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску nested Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow збирає й push-ить цей образ один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
target, release run налаштовано неправильно, і він марнуватиме wall clock на
дубльовані збірки образів.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
як у live/E2E release-path Docker workflow, так і в шард package acceptance.
Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого candidate у кількох child jobs.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує один candidate з
опублікованого npm spec, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі покривають smoke, package, product, full і custom
Docker lane selections. Профіль `package` використовує offline Plugin coverage, щоб
валідація опублікованого package не залежала від live доступності ClawHub. Необов’язковий
Telegram lane повторно використовує
artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
опублікованого npm spec зберігається для standalone dispatches.

## Приймання package

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей інстальований OpenClaw
package як продукт?" Він відрізняється від звичайного CI: звичайний CI валідує
source tree, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі застосовують після install або update.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує один package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, валідує tarball inventory, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли профіль вибирає
   кілька цільових `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як паралельні цільові Docker
   jobs з унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав один; standalone Telegram dispatch
   все ще може встановлювати опублікований npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   необов’язковий Telegram lane завершилися з помилкою.

Джерела candidate:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  OpenClaw release version, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  опублікованого beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  досяжний з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати
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
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають overlapping package/update/Plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline Plugin і
Telegram proof проти того самого розв’язаного package tarball.
Cross-OS release checks все ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може імпортувати browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли він заданий, інакше `openai/gpt-5.4-mini`, тому
install і Gateway proof залишаються швидкими й детермінованими. Окремі live
provider/model lanes усе ще покривають ширший model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені legacy-compatibility windows для вже
опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені tarball,
`doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`,
коли package не exposes цей flag, `update-channel-switch` може обрізати
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може логувати відсутній persisted `update.channel`, Plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти config metadata migration, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може попереджати про local build metadata stamp files,
які вже були shipped. Пізніші packages мають задовольняти сучасні contracts; ті самі
умови завершуються failure замість warn або skip.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lane замість повторного запуску повної валідації релізу.

QA Lab має окремі CI lane поза основним smart-scoped workflow. Workflow `Parity gate` запускається для відповідних змін PR і через ручний dispatch; він збирає приватний runtime QA і порівнює агентні пакети mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lane як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують leases Convex. Release checks запускають Matrix і Telegram live transport lane з детермінованим mock provider і mock-qualified моделями (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider Plugin. Live transport gateway також вимикає пошук пам'яті, оскільки QA parity окремо покриває поведінку пам'яті; підключення provider покривають окремі набори live model, native provider і Docker provider. Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і ручний workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає release-critical QA Lab lane перед схваленням релізу; його QA parity gate запускає кандидатні та baseline пакети як паралельні lane jobs, потім завантажує обидва артефакти в невеликий report job для фінального порівняння parity. Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit tests розглядайте це як необов'язковий сигнал і спирайтеся на scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` є ручним workflow для maintainers, призначеним для очищення дублікатів після landing. Типово він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільне referenced issue, або overlapping changed hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні та ручні запуски сканують код Actions workflow разом із найризикованішими поверхнями JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway за допомогою high-precision security queries. Job channel-runtime-boundary окремо сканує основні контракти реалізації каналів разом із channel Plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення baseline категорії JS/TS. Job network-ssrf-boundary сканує основні поверхні SSRF, IP parsing, network guard, web-fetch і політики SSRF Plugin SDK у категорії `/codeql-critical-security/network-ssrf-boundary`, щоб сигнал межі довіри мережі залишався окремим від ширшого security baseline JS/TS. Job mcp-process-tool-boundary сканує MCP servers, process execution helpers, outbound delivery і agent tool-execution gates у категорії `/codeql-critical-security/mcp-process-tool-boundary`, щоб сигнал меж команд і tools залишався окремим як від загального JS/TS baseline, так і від non-security MCP/process quality shard.

Workflow `CodeQL Android Critical Security` є scheduled Android security shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner label, який приймає workflow sanity, і завантажує результати в категорії `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` є weekly/manual macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорії `/codeql-critical-security/macos`. Тримайте його поза щоденним типовим workflow, оскільки збірка macOS домінує за runtime навіть у чистому стані.

Workflow `CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value поверхнях на меншому Blacksmith Linux runner. Його manual dispatch приймає `profile=all|plugin-sdk-package-contract`; вузький профіль є першим teaching/iteration hook для запуску одного quality shard ізольовано без dispatch решти workflow. Його job core-auth-secrets сканує код меж безпеки auth, secrets, sandbox, cron і gateway в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Job config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Job gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Job channel-runtime-boundary сканує основні контракти реалізації каналів в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Job agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Job mcp-process-runtime-boundary сканує MCP servers і tool bridges, process supervision helpers і outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Job memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Job ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Job web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Job plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Job plugin-sdk-package-contract сканує published package-side Plugin SDK source і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні runtime і signal.

Workflow `Docs Agent` є event-driven Codex maintenance lane для підтримання наявної документації у відповідності до нещодавно landed changes. Він не має pure schedule: успішний non-bot push CI run на `main` може його запускати, а manual dispatch може запускати його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли за останню годину було створено інший non-skipped Docs Agent run. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може покрити всі зміни main, накопичені з моменту останнього docs pass.

Workflow `Test Performance Agent` є event-driven Codex maintenance lane для повільних tests. Він не має pure schedule: успішний non-bot push CI run на `main` може його запускати, але він пропускається, якщо інший workflow-run invocation уже запускався або працює цього UTC day. Manual dispatch обходить цей daily activity gate. Lane формує full-suite grouped Vitest performance report, дозволяє Codex вносити лише невеликі coverage-preserving test performance fixes замість broad refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline кількість passing tests. Якщо baseline має failing tests, Codex може виправляти лише obvious failures, і after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається вперед до того, як bot push landing, lane rebase валідований patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд jobs

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі npm advisories                           | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирає `dist/`, інтерфейс керування, перевірки зібраних артефактів і придатні до повторного використання downstream-артефакти | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от перевірки bundled/plugin-contract/protocol           | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди тестів основи Node, крім напрямів каналів, bundled, contract і extension               | Зміни, пов’язані з Node            |
| `check`                          | Шардований еквівалент основного локального gate: типи prod, lint, guard-и, типи тестів і строгий smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Архітектура, межі, guard-и extension-surface, package-boundary і шарди gateway-watch         | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke для пам’яті запуску                                       | Зміни, пов’язані з Node            |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, пов’язані з Node            |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-напрям                                                   | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, пов’язані з Python-Skills   |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів, а також спільні регресії специфікаторів імпорту runtime | Зміни, пов’язані з Windows         |
| `macos-node`                     | Напрям TypeScript-тестів macOS із використанням спільних зібраних артефактів                 | Зміни, пов’язані з macOS           |
| `macos-swift`                    | Swift lint, збірка та тести для застосунку macOS                                             | Зміни, пов’язані з macOS           |
| `android`                        | Android unit-тести для обох flavor-ів плюс одна debug APK-збірка                             | Зміни, пов’язані з Android         |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх CI на main або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожен
не-Android scoped-напрям: Linux Node-шарди, шарди bundled-plugin, контракти
каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки
документації, Python Skills, Windows, macOS та i18n інтерфейсу керування. Окремі ручні запуски CI
виконують лише Android з `include_android=true`; повна release-umbrella
вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease Plugin,
релізний лише шард `agentic-plugins`, повний пакетний sweep розширень
і Docker-напрями prerelease Plugin виключені з CI. Docker-набір prerelease
запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту,
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перетинається зі швидкими Linux-напрямами, щоб downstream-споживачі могли почати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі напрями платформ і runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає виявлення changed-scope і змушує preflight-маніфест
діяти так, ніби змінилася кожна область із визначеною областю дії.
Редагування CI workflow перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати native-збірки Windows, Android або macOS; ці платформні lane-и залишаються прив’язаними до змін платформного source-коду.
Редагування лише CI-маршрутизації, вибрані дешеві редагування fixture core-тестів і вузькі редагування helper/test-routing для plugin-contract використовують швидкий шлях Node-only маніфесту: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, channel contracts, повних core shard-ів, shard-ів bundled-plugin і додаткових guard matrix-ів, коли змінені файли обмежені поверхнями маршрутизації або helper-ів, які швидке завдання перевіряє напряму.
Windows Node checks обмежені специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цей lane; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node lane-ах, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shard-ами.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для Docker/package surfaces, змін package/manifest у bundled plugin і core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only зміни bundled plugin, test-only редагування і docs-only редагування не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений bounded bundled-plugin Docker profile під 240-секундним aggregate command timeout, причому Docker run кожного scenario обмежений окремо. Повний шлях зберігає QR package install і installer Docker/update coverage для nightly scheduled runs, manual dispatches, workflow-call release checks і pull request-ів, які справді торкаються installer/package/Docker surfaces. Push-и в `main`, включно з merge commit-ами, не примушують запускати повний шлях; коли changed-scope logic запитала б full coverage під час push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть увімкнути його, але pull request-и та push-и в `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfile-и. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні image-и `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lane-ів і functional image, який встановлює той самий tarball у `/app` для звичайних functionality lane-ів. Визначення Docker lane-ів містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість slot-ів main-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість slot-ів provider-sensitive tail-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження heavy lane-ів за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lane-и не перевантажували Docker, поки легші lane-и все ще заповнюють доступні slot-и. Окремий lane, важчий за ефективні caps, усе ще може стартувати з порожнього pool, а потім виконується сам, доки не звільнить capacity. Старти lane-ів за замовчуванням рознесені на 2 секунди, щоб уникнути local Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate виконує Docker preflight, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lane-и після першого failure, і кожен lane має fallback timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane-и використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lane-и, включно з release-only lane-ами, як-от `install-e2e`, і split bundled update lane-ами, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити один failed lane. Reusable live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lane-ів; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Docker image pulls повторюються з обмеженим 180-секундним timeout на спробу, щоб завислий registry/cache stream швидко повторювався, а не споживав більшу частину CI critical path. Workflow `Package Acceptance` є high-level package gate: він визначає candidate з npm, trusted `package_ref`, HTTPS tarball плюс SHA-256 або попереднього workflow artifact, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші trusted commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk pull-ив лише потрібний йому image kind і виконував кілька lane-ів через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли full release-path coverage цього запитує, і зберігає standalone chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в critical path. Alias lane-а `install-e2e` залишається aggregate manual rerun alias для обох provider installer lane-ів. Chunk `bundled-channels` запускає split lane-и `bundled-channel-*` і `bundled-channel-update-*`, а не серійний all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lane-и проти prepared images замість chunk jobs, що утримує debugging failed-lane в межах одного targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибраний lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane міг повторно використати точні package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділено за update target, щоб повторні npm update і doctor repair passes могли shard-итися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних lane-ів на parallel jobs після одного спільного package/image preparation step, а bundled-channel update lane-и повторюють спробу один раз для transient npm network failures.

Локальна changed-lane logic міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий CI platform scope: core production changes запускають core prod і core test typecheck плюс core lint/guards, core test-only changes запускають лише core test typecheck плюс core lint, extension production changes запускають extension prod і extension test typecheck плюс extension lint, а extension test-only changes запускають extension test typecheck плюс extension lint. Зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts, але Vitest extension sweeps є явною test work. Release metadata-only version bumps запускають targeted version/config/root-dependency checks. Unknown root/config changes fail safe до всіх check lanes.
Локальна changed-test routing міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: direct test edits запускають самі себе,
source edits надають перевагу explicit mappings, а потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із explicit mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб shared default change зазнала failure до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли change
достатньо harness-wide, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте команду з кореня репозиторію й для широкого підтвердження надавайте перевагу свіжо прогрітому боксу. Перш ніж витрачати повільний gate на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині бокса. Sanity-перевірка швидко завершується з помилкою, коли обов’язкові кореневі файли на кшталт `pnpm-lock.yaml` зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR. Зупиніть цей бокс і прогрійте свіжий, замість того щоб налагоджувати збій продуктового тесту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Ручні CI-запуски виконують `checks-node-compat-node22` як широке покриття сумісності. Android увімкнений за згодою для окремого ручного CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явно оператором. Звичайні pull request, push до `main` і окремі ручні CI-запуски тримають цей набір вимкненим.

Найповільніші сімейства Node-тестів розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування раннерів: контракти каналів запускаються як три зважені shard, малі core unit lanes поєднані попарно, auto-reply запускається як чотири збалансовані workers із піддеревом reply, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic Gateway/Plugin configs розподілено між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. Широкі browser, QA, media та різні Plugin-тести використовують свої окремі Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона домінована імпортом/плануванням, а не одним повільним тестовим файлом. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів хвостом. Include-pattern shards записують timing entries з використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрано, зберігаючи їхні старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із BuildConfig flags для SMS/call-log, водночас уникаючи дубльованого debug APK packaging job для кожного Android-релевантного push.
GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, щоб вони й далі повідомляли про звичайні shard failures, але не ставали в чергу після того, як увесь workflow уже було витіснено.
Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують runs, що вже виконуються.

## Ранери

| Ранер                            | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, тому 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час черги 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
- [Канали релізів](/uk/install/development-channels)
