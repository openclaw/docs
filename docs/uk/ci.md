---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте перевірки GitHub Actions, які завершуються невдало
summary: Граф завдань CI, контрольні перевірки області дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T07:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a804984bbffc5377d69aed508c83ef63e82b86e5ecbc24633a1dd2bbdb4ab4b3
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації, а Android-ланцюжки вмикаються через `include_android` для окремих ручних запусків. Ланцюжки попереднього релізу Plugin, призначені лише для релізів, містяться в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом." Він приймає branch, tag або повний commit SHA, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
release-only доказу plugin/package/static/Docker, і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
ланцюжків. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли
надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує live/provider
шириною, переданою в release checks: `minimum` зберігає найшвидші OpenAI/core
критично важливі для релізу ланцюжки, `stable` додає стабільний набір provider/backend, а
`full` запускає широку рекомендаційну матрицю provider/media. Парасолька записує
ідентифікатори dispatch-нутих дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат парасольки та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного дочірнього релізного workflow або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує повторний запуск невдалого
релізного бокса в межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені медіа-шарди audio/video, і
відфільтровані за provider музичні шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме покриття файлів, водночас роблячи повільні live
збої provider простішими для повторного запуску й діагностики. Агреговані
назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються дійсними для ручних
одноразових повторних запусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють binaries перед setup. Тримайте live-набори з Docker
на звичайних Blacksmith runners, бо container jobs — неправильне місце
для запуску вкладених Docker tests.

Live model/backend шарди з Docker використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
release workflow збирає й пушить цей образ один раз, потім Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
ціль, release run налаштовано неправильно, і він марнуватиме wall
clock на дубльовані image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, потім передає цей artifact
і до live/E2E release-path Docker workflow, і до package acceptance
shard. Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого кандидата в кількох дочірніх jobs.

`Package Acceptance` — це side-run workflow для валідації artifact пакета
без блокування release workflow. Він розв’язує одного кандидата з
published npm spec, trusted `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, потім повторно використовує
Docker release/E2E scheduler із цим tarball замість перепакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
вибори Docker lane. Профіль `package` використовує offline plugin coverage, щоб
валідація опублікованого пакета не залежала від live доступності ClawHub. Опціональний
Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
published npm spec збережено для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей встановлюваний пакет OpenClaw
як продукт?" Це відрізняється від звичайного CI: звичайний CI валідовує
дерево source, тоді як package acceptance валідовує один tarball через
той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

Workflow має чотири jobs:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного package candidate,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і виводить source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, валідовує інвентар tarball, готує package-digest
   Docker images за потреби й запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли profile вибирає
   кілька цільових `docker_lanes`, reusable workflow готує package
   і shared images один раз, а потім розгортає ці lanes як паралельні targeted Docker
   jobs з унікальними artifacts.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав його; standalone Telegram dispatch
   все ще може встановити published npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   опціональний Telegram lane зазнали невдачі.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  release version OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  published beta/stable acceptance.
- `source=ref`: пакує trusted branch, tag або full commit SHA `package_ref`.
  Resolver fetch-ить OpenClaw branches/tags, перевіряє, що вибраний commit
  reachable з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опціональний, але його варто надати для
  externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який запускає test. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідовувати
старіші trusted source commits без запуску старої workflow logic.

Профілі відображаються на Docker coverage:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язковий, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають overlapping package/update/plugin lanes, а Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram proof проти того самого розв’язаного package tarball.
Cross-OS release checks все ще покривають OS-specific onboarding, installer і
platform behavior; package/update product validation має починатися з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може import browser-control override з raw absolute
Windows path.

Package Acceptance має обмежені legacy-compatibility windows для вже
published packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на tarball-omitted files,
`doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`,
коли package не exposes that flag, `update-channel-switch` може prune
відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і
може логувати missing persisted `update.channel`, plugin smokes можуть read legacy
install-record locations або accept missing marketplace install-record
persistence, а `plugin-update` може allow config metadata migration, водночас все ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Published
package `2026.4.26` також може warn for local build metadata stamp files,
які вже були shipped. Пізніші packages мають задовольняти modern contracts; ті
самі conditions fail замість warn або skip.

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

Під час налагодження невдалого package acceptance run почніть із summary `resolve_package`,
щоб підтвердити package source, version і SHA-256. Потім перевірте
дочірній run `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Надавайте перевагу повторному запуску невдалого package profile або
точних Docker lanes замість повторного запуску full release validation.

QA Lab має окремі лінії CI поза основним розумно обмеженим workflow. Workflow
`Parity gate` запускається для відповідних змін у PR і ручного dispatch; він
збирає приватний runtime QA та порівнює mock agentic-пакети GPT-5.5 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за
ручним dispatch; він розгортає mock parity gate, live-лінію Matrix, а також live
лінії Telegram і Discord як паралельні jobs. Live jobs використовують
середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Release
checks запускають live transport-лінії Matrix і Telegram із deterministic mock
provider і mock-qualified моделями (`mock-openai/gpt-5.5` та
`mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model
і звичайного запуску provider-plugin. Live transport gateway також
вимикає пошук у памʼяті, оскільки QA parity окремо покриває поведінку памʼяті;
підключення provider покривають окремі live model, native provider
і Docker provider набори. Matrix використовує `--profile fast` для scheduled і release gates,
додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Стандарт CLI
і ручний workflow input залишаються `all`; ручний dispatch `matrix_profile=all`
завжди ділить повне покриття Matrix на jobs `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає release-critical лінії QA Lab перед release approval; його QA parity
gate запускає candidate і baseline пакети як паралельні lane jobs, потім завантажує
обидва artifacts у невеликий report job для фінального parity comparison.
Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не
торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow.
Для звичайних виправлень channel, config, docs або unit-test трактуйте його як optional
signal і натомість дотримуйтеся scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` є ручним workflow для maintainers для
post-land очищення дублікатів. За замовчуванням він працює в dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що
landed PR merged і що кожен дублікат має або спільний referenced issue,
або перетин changed hunks.

Workflow `CodeQL` навмисно є вузьким першим проходом security scanner,
а не повним скануванням репозиторію. Щоденні й ручні запуски сканують код Actions workflow
плюс найризикованіші JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і
gateway з high-precision security queries. Job
channel-runtime-boundary окремо сканує core channel implementation
contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets і
audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб channel security signal міг масштабуватися без розширення baseline
JS/TS category.

Workflow `CodeQL Android Critical Security` є scheduled Android
security shard. Він збирає Android app вручну для CodeQL на найменшому
Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` є щотижневим/ручним macOS
security shard. Він збирає macOS app вручну для CodeQL на Blacksmith macOS,
відфільтровує dependency build results із завантаженого SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
default workflow, бо macOS build домінує runtime навіть коли він чистий.

Workflow `CodeQL Critical Quality` є відповідним non-security shard. Він
запускає лише error-severity, non-security JavaScript/TypeScript quality queries
на вузьких high-value поверхнях на меншому Blacksmith Linux runner. Його
job core-auth-secrets сканує auth, secrets, sandbox, cron і gateway security
boundary code в окремій категорії `/codeql-critical-quality/core-auth-secrets`.
Job config-boundary
сканує config schema, migration, normalization і IO contracts в
окремій категорії `/codeql-critical-quality/config-boundary`. Job
gateway-runtime-boundary сканує gateway protocol schemas і server method
contracts в окремій категорії
`/codeql-critical-quality/gateway-runtime-boundary`. Job
channel-runtime-boundary сканує core channel implementation contracts в
окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Job
agent-runtime-boundary сканує command execution, model/provider dispatch,
auto-reply dispatch і queues, а також ACP control-plane runtime contracts в
окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Job
mcp-process-runtime-boundary сканує MCP servers і tool bridges, process
supervision helpers і outbound delivery contracts в окремій
категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Job
memory-runtime-boundary сканує memory host SDK, memory runtime facades,
memory Plugin SDK aliases, memory runtime activation glue і memory doctor
commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`.
Job
ui-control-plane сканує Control UI bootstrap, local persistence, gateway
control flows і task control-plane runtime contracts в окремій
категорії `/codeql-critical-quality/ui-control-plane`. Job
web-media-runtime-boundary сканує core web fetch/search, media IO, media
understanding, image-generation і media-generation runtime contracts в
окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Job
plugin-boundary сканує loader, registry, public-surface і Plugin SDK
entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте workflow окремо від security, щоб quality findings можна було
планувати, вимірювати, вимикати або розширювати без затінення security signal.
Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як
scoped або sharded follow-up work лише після того, як narrow profiles матимуть стабільні
runtime і signal.

Workflow `Docs Agent` є event-driven Codex maintenance lane для підтримання
наявних docs у відповідності до нещодавно landed changes. Він не має pure schedule:
успішний non-bot push CI run на `main` може його запустити, а manual dispatch може
запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли
інший non-skipped Docs Agent run був створений за останню годину. Коли він запускається, він
переглядає commit range від попереднього non-skipped Docs Agent source SHA до
поточного `main`, тож один hourly run може покрити всі main changes, накопичені з
останнього docs pass.

Workflow `Test Performance Agent` є event-driven Codex maintenance lane
для повільних тестів. Він не має pure schedule: успішний non-bot push CI run на
`main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже
запускався або виконується цього UTC day. Manual dispatch обходить цей daily activity
gate. Лінія будує full-suite grouped Vitest performance report, дозволяє Codex
робити лише невеликі coverage-preserving test performance fixes замість broad
refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують
passing baseline test count. Якщо baseline має failing tests, Codex може виправляти
лише очевидні failures, а after-agent full-suite report має пройти, перш ніж
щось буде committed. Коли `main` просувається до того, як bot push landed, лінія
перебазовує validated patch, повторно запускає `pnpm check:changed` і повторює push;
conflicting stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex
action міг зберігати таку саму drop-sudo safety posture, як docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд jobs

| Job                              | Призначення                                                                                      | Коли запускається                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only changes, changed scopes, changed extensions і збирає CI manifest      | Завжди на non-draft pushes і PRs |
| `security-scm-fast`              | Виявлення private key і workflow audit через `zizmor`                                        | Завжди на non-draft pushes і PRs |
| `security-dependency-audit`      | Dependency-free production lockfile audit щодо npm advisories                             | Завжди на non-draft pushes і PRs |
| `security-fast`                  | Обовʼязковий aggregate для fast security jobs                                                | Завжди на non-draft pushes і PRs |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts          | Node-relevant changes              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                 | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі stable aggregate check result                         | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes             | Node-relevant changes              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke   | Node-relevant changes              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                               | Node-relevant changes              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                   | Manual CI dispatch для releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed Skills                                                       | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                                  | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                               | macOS-relevant changes             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                 | Android-relevant changes           |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                    | Main CI success або manual dispatch |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
не-Android scoped lane: Linux Node shards, bundled-plugin shards, контракти каналів,
сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки docs,
Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI
виконують лише Android з `include_android=true`; повна release umbrella
вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin,
release-only shard `agentic-plugins`, повний пакетний sweep розширень
і Docker lanes передрелізу Plugin виключені з CI та виконуються в
окремому workflow `Plugin Prerelease`. Ручні запуски використовують
унікальну concurrency group, щоб повний набір release-candidate не скасовувався
іншим запуском push або PR на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному викликачеві запустити цей граф для гілки, тегу або повного commit SHA, водночас
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream-споживачі могли стартувати одразу після готовності спільного build.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає виявлення changed-scope і змушує preflight manifest
діяти так, ніби змінилася кожна scoped area.
Правки CI workflow перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують виконувати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
Правки лише маршрутизації CI, вибрані дешеві правки core-test fixtures і вузькі правки helper/test-routing для контрактів Plugin використовують швидкий Node-only manifest path: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені routing або helper surfaces, які швидке завдання перевіряє напряму.
Перевірки Windows Node scoped до специфічних для Windows process/path wrappers, helper-ів npm/pnpm/UI runner, конфігурації package manager і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для coverage, який уже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для Docker/package surfaces, змін package/manifest bundled Plugin і core Plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only зміни bundled Plugin, test-only правки та docs-only правки не резервують Docker workers. Fast path один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений bundled-plugin Docker profile під 240-секундним aggregate command timeout, причому Docker run кожного сценарію обмежений окремо. Full path зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. Pushes у `main`, включно з merge commits, не примушують full path; коли changed-scope logic запитувала б full coverage для push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatches `install-smoke` можуть увімкнути його, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а provider-sensitive кількість слотів tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Caps для heavy lanes за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, тоді як легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за effective caps, усе ще може стартувати з порожнього pool, після чого виконується сама, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникати локальних Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate preflight перевіряє Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, і кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, як-от `install-e2e`, і split bundled update lanes, як-от `bundled-channel-update-acpx`, водночас пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує передані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` є high-level package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено в `plugins-runtime-services`, коли full release-path coverage запитує його, і він зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних повторних запусків, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Вхід workflow `docker_lanes` запускає вибрані lanes проти prepared images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job збирає live-test image локально для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати exact package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділена за update target, щоб повторні npm update і doctor repair passes могли shard разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted dispatches `docker_lanes` також розділяють кілька вибраних lanes на parallel jobs після одного спільного кроку package/image preparation, а bundled-channel update lanes повторюють спробу один раз у разі transient npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний gate суворіший щодо архітектурних меж, ніж широка область платформи CI: зміни production-коду core запускають typecheck core prod і core test, а також lint/guards core; зміни лише тестів core запускають тільки typecheck core test і lint core; зміни production-коду розширень запускають typecheck extension prod і extension test, а також lint розширень; зміни лише тестів розширень запускають typecheck extension test і lint розширень. Зміни публічного Plugin SDK або контракту Plugin розширюються до typecheck розширень, бо розширення залежать від цих контрактів core, але проходи Vitest для розширень є явною тестовою роботою. Version bumps лише release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переходять до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source надають перевагу явним мапінгам, потім sibling tests і залежним
елементам import-graph. Спільна конфігурація доставки group-room є одним із явних мапінгів:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests, а також регресії доставки Discord і
Slack, щоб зміна спільного default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію та надавайте перевагу свіжому прогрітому box для
широкого proof. Перед тим як витрачати повільний gate на box, який був повторно використаний, прострочений або
щойно повідомив про неочікувано великий sync, спочатку запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли зникли потрібні root files, як-от
`pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість налагодження
product test failure. Для навмисних PR з великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

Manual CI dispatches запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускає `Full Release Validation` або явний operator. Звичайні pull requests, `main` pushes і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три зважені shards, малі core unit lanes поєднані в пари, auto-reply запускається як чотири збалансовані workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість shared plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує shared Vitest file-parallel scheduler, бо вона обмежена import/scheduling, а не належить одному повільному test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів хвостом. Include-pattern shards записують timing entries із CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи їхні старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи дублювального debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже був superseded.
Ключ automatic CI concurrency версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
