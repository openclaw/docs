---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалі перевірки GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T10:40:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e4b9dae0e16e5ae701c4dbe5966ac9c4b3d8a3292f1804eef8f595616170e43
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Вона використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для реліз-кандидатів або широкої перевірки, з Android-напрямками, що вмикаються через `include_android` для окремих ручних запусків. Релізні напрямки попереднього релізу Plugin живуть в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений на останній версії Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення через `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей захист падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис у allowlist після очищення, зберігаючи при цьому навмисні поверхні динамічних plugin, згенеровані, build, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для «запустити все
перед релізом». Він приймає branch, tag або повний commit SHA, запускає ручний
workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних доказів
plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install
smoke, package acceptance, Docker-наборів релізного шляху, live/E2E, OpenWebUI,
QA Lab parity, Matrix і Telegram напрямків. Він також може запустити післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано
специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує широтою live/provider,
яку передають у release checks: `minimum` залишає найшвидші релізно-критичні
напрямки OpenAI/core, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory-матрицю provider/media. Umbrella записує id
запущених дочірніх run, а фінальне завдання `Verify full validation` повторно
перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань
для кожного дочірнього run. Якщо дочірній workflow перезапустили і він став
зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат
umbrella і підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного дочірнього full CI, `release-checks` для кожного релізного дочірнього
workflow або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` на umbrella. Це тримає перезапуск
невдалого релізного box обмеженим після сфокусованого виправлення.

Дочірній live/E2E для релізу зберігає широке native-покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені audio/video-шарди media та
відфільтровані за provider шарди music) через `scripts/test-live-shard.mjs`
замість одного послідовного завдання. Це зберігає те саме файлове покриття, але
полегшує перезапуск і діагностику повільних збоїв live provider. Агреговані
назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Native live media-шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють binaries перед setup. Тримайте live-набори з Docker-підтримкою на звичайних Blacksmith runners, бо container jobs — неправильне місце для запуску вкладених Docker tests.

Live model/backend-шарди з Docker-підтримкою використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live
release workflow збирає і публікує цей image один раз, потім Docker live model,
gateway, CLI backend, ACP bind і Codex harness-шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну
source Docker target, release run налаштовано неправильно, і він витратить wall
clock на дубльовані image builds.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз
розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає
цей artifact і в live/E2E workflow релізного шляху для Docker, і в шард package acceptance. Це зберігає байти пакета узгодженими між release boxes і
уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для перевірки artifact пакета
без блокування release workflow. Він розв’язує одного кандидата з
опублікованої npm spec, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler з цим tarball замість повторного пакування
workflow checkout. Профілі покривають smoke, package, product, full і custom
вибори Docker lanes. Профіль `package` використовує offline-покриття plugin, тому
перевірка опублікованого пакета не залежить від доступності live ClawHub. Опційний
напрямок Telegram повторно використовує artifact `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
опублікованої npm spec зберігається для standalone dispatch.

## Приймальне тестування пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей встановлюваний пакет OpenClaw
як продукт?» Це відрізняється від звичайної CI: звичайна CI перевіряє
дерево source, тоді як package acceptance перевіряє один tarball через той самий
Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного package-кандидата,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як artifact
   `package-under-test` і друкує source, workflow ref, package
   ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей artifact, перевіряє інвентар tarball, готує package-digest
   Docker images за потреби та запускає вибрані Docker lanes проти цього
   package замість пакування workflow checkout. Коли профіль вибирає
   кілька цільових `docker_lanes`, reusable workflow готує package
   і спільні images один раз, а потім розгортає ці lanes як паралельні цільові Docker
   jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не є `none`, і встановлює той самий artifact `package-under-test`,
   якщо Package Acceptance розв’язав його; standalone Telegram dispatch
   все ще може встановити опубліковану npm spec.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або
   опційний Telegram lane завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  release-версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  acceptance опублікованих beta/stable.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA.
  Resolver fetch-ить branches/tags OpenClaw, перевіряє, що вибраний commit
  досяжний з repository branch history або release tag, встановлює deps у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надати для
  artifact, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
код workflow/harness, який запускає test. `package_ref` — це source commit,
який пакують, коли `source=ref`. Це дозволяє поточному test harness перевіряти
старіші trusted source commits без запуску старої workflow logic.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні chunks релізного Docker-шляху з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker
chunks релізного шляху покривають перетин package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native доказ bundled-channel compat, offline plugin і
Telegram проти того самого розв’язаного package tarball.
Cross-OS release checks і далі покривають OS-специфічне onboarding, installer і
platform behavior; product-перевірку package/update слід починати з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений package може імпортувати browser-control override з сирого absolute
Windows path.

Package Acceptance має обмежені вікна legacy-сумісності для вже
опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, omitted from tarball,
`doctor-switch` може пропустити підвипадок persistence `gateway install --wrapper`,
коли package не expose-ить цей flag, `update-channel-switch` може prune-ити
відсутні `pnpm.patchedDependencies` з fake git fixture, отриманої з tarball, і
може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволити config metadata migration, усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
package `2026.4.26` також може попереджати про local build metadata stamp files,
які вже було shipped. Пізніші packages мають відповідати сучасним contracts; ті
самі умови дають failure замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали смуг, часові
показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або
точних Docker-смуг замість повторного запуску повної перевірки релізу.

QA Lab має окремі смуги CI поза основним workflow із розумним визначенням області. Workflow
`Parity gate` запускається для відповідних змін у PR і вручну; він
збирає приватне середовище виконання QA та порівнює мокові агентні набори GPT-5.5 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і
вручну; він розгортає моковий parity gate, живу смугу Matrix, а також живі
смуги Telegram і Discord як паралельні завдання. Живі завдання використовують середовище
`qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу запускають
живі транспортні смуги Matrix і Telegram з детермінованим моковим
провайдером і моделями з мок-кваліфікацією (`mock-openai/gpt-5.5` і
`mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки живої моделі
та звичайного запуску Plugin провайдера. Живий транспортний Gateway також
вимикає пошук у пам’яті, оскільки parity QA окремо покриває поведінку пам’яті;
підключення провайдера покривають окремі набори для живої моделі, нативного провайдера
та Docker-провайдера. Matrix використовує `--profile fast` для запланованих і релізних gates,
додаючи `--fail-fast` лише тоді, коли CLI з checkout це підтримує. Типове значення CLI
і ручний ввід workflow залишаються `all`; ручний dispatch `matrix_profile=all`
завжди шардить повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критично важливі для релізу смуги QA Lab перед схваленням релізу; його QA parity
gate запускає кандидатний і базовий набори як паралельні завдання смуг, потім завантажує
обидва артефакти в невелике завдання звіту для фінального порівняння parity.
Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не
торкається середовища виконання QA, parity наборів моделей або поверхні, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або юніт-тестів сприймайте це як необов’язковий
сигнал і дотримуйтеся доказів scoped CI/check.

Workflow `Duplicate PRs After Merge` — це ручний workflow мейнтейнера для
очищення дублікатів після landing. Типово він працює в dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що
landed PR змерджено і що кожен дублікат має або спільне згадане issue,
або перекривні змінені hunks.

Workflow `CodeQL` навмисно є вузьким сканером безпеки першого проходу,
а не повним скануванням репозиторію. Щоденні й ручні запуски сканують код workflow Actions
плюс найризикованіші поверхні JavaScript/TypeScript для auth, secrets, sandbox, cron і
gateway за допомогою високоточних security queries. Завдання
channel-runtime-boundary окремо сканує контракти реалізації core channel
плюс середовище виконання Plugin каналу, gateway, Plugin SDK, secrets і
audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб сигнал безпеки каналів міг масштабуватися без розширення базової
категорії JS/TS.

Workflow `CodeQL Android Critical Security` — це запланований Android
security shard. Він вручну збирає Android-застосунок для CodeQL на найменшому
лейблі Blacksmith Linux runner, прийнятому workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS
security shard. Він вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS,
відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
типовим workflow, бо збірка macOS домінує за часом виконання навіть коли вона чиста.

Workflow `CodeQL Critical Quality` — це відповідний shard не для безпеки. Він
запускає лише JavaScript/TypeScript quality queries із severity error та без security
на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його
завдання core-auth-secrets сканує код меж auth, secrets, sandbox, cron і gateway security
в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary
сканує схему конфігурації, міграцію, нормалізацію та контракти IO в
окремій категорії `/codeql-critical-quality/config-boundary`. Завдання
gateway-runtime-boundary сканує схеми протоколу gateway і контракти server method
в окремій категорії
`/codeql-critical-quality/gateway-runtime-boundary`. Завдання
channel-runtime-boundary сканує контракти реалізації core channel в
окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання
agent-runtime-boundary сканує виконання команд, dispatch моделей/провайдерів,
dispatch і черги auto-reply, а також контракти runtime control-plane ACP в
окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання
mcp-process-runtime-boundary сканує MCP servers і tool bridges, helpers supervision процесів
та контракти outbound delivery в окремій категорії
`/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання
memory-runtime-boundary сканує memory host SDK, memory runtime facades,
аліаси memory Plugin SDK, зв’язувальний код активації memory runtime і команди memory doctor
в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`.
Завдання ui-control-plane сканує bootstrap Control UI, локальне збереження, control flows gateway
і runtime-контракти task control-plane в окремій категорії
`/codeql-critical-quality/ui-control-plane`. Завдання
web-media-runtime-boundary сканує core web fetch/search, media IO, media
understanding, image-generation і media-generation runtime contracts в
окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання
plugin-boundary сканує контракти loader, registry, public-surface і entrypoint Plugin SDK
в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте workflow окремо від security, щоб quality findings можна було
планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки.
Розширення CodeQL для Swift, Python і bundled-Plugin слід додавати назад як
scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний
час виконання та сигнал.

Workflow `Docs Agent` — це подієво-керована смуга обслуговування Codex для підтримання
наявної документації в узгодженому стані з нещодавно landing-змінами. Він не має чистого розкладу:
успішний non-bot push CI run на `main` може його запустити, а manual dispatch може
запустити його напряму. Workflow-run invocations пропускаються, коли `main` просунувся далі або коли
інший non-skipped запуск Docs Agent було створено за останню годину. Коли він запускається, він
переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до
поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з
останнього проходу документації.

Workflow `Test Performance Agent` — це подієво-керована смуга обслуговування Codex
для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на
`main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже
запускався або виконується того UTC дня. Manual dispatch обходить цей щоденний gate активності.
Смуга будує full-suite grouped Vitest performance report, дозволяє Codex
робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують
базову кількість успішних тестів. Якщо baseline має failing tests, Codex може виправляти
лише очевидні failures, і after-agent full-suite report має пройти, перш ніж
щось буде закомічено. Коли `main` просувається до landing bot push, смуга
rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex
міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, змінені області, змінені Plugins і будує маніфест CI                | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і audit workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Production lockfile audit без залежностей за npm advisories                                  | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs  |
| `build-artifacts`                | Збірка `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Node-relevant changes              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes              | Node-relevant changes              |
| `check`                          | Sharded еквівалент основного local gate: prod types, lint, guards, test types і strict smoke | Node-relevant changes              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-relevant changes              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch for releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests плюс regressions shared runtime import specifier         | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane з використанням спільних built artifacts                          | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-relevant changes             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-relevant changes           |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success or manual dispatch |

Manual CI-диспетчеризації виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
не-Android scoped lane: шарди Linux Node, шарди bundled-plugin, channel
contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки docs,
Python Skills, Windows, macOS і Control UI i18n. Окремі manual CI
dispatches запускають лише Android із `include_android=true`; повна release
umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для Plugin,
release-only шард `agentic-plugins`, повний batch sweep для extension
і Docker lanes для prerelease Plugin виключені з CI. Docker
prerelease suite запускається лише тоді, коли `Full Release Validation` диспетчеризує
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Manual runs використовують
унікальну concurrency group, щоб повний suite release-candidate не скасовувався
іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає
довіреному викликачеві змогу запускати цей граф для branch, tag або повного commit SHA, водночас
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Jobs упорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps всередині цього job, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно спільна build буде готова.
4. Важчі platform і runtime lanes розгалужуються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Manual dispatch пропускає changed-scope detection і змушує preflight manifest
діяти так, ніби кожна scoped area змінилася.
Редагування CI workflow перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують запускати нативні builds Windows, Android або macOS; ці platform lanes залишаються scoped до змін platform source.
CI routing-only edits, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits використовують швидкий Node-only manifest path: preflight, security і одне завдання `checks-fast-core`. Цей path уникає build artifacts, сумісності Node 22, channel contracts, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені routing або helper surfaces, які швидке завдання перевіряє безпосередньо.
Windows Node checks scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для coverage, який уже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для Docker/package surfaces, змін bundled plugin package/manifest, а також core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only зміни bundled plugin, test-only edits і docs-only edits не резервують Docker workers. Fast path один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений bundled-plugin Docker profile під сукупним command timeout 240 секунд, причому Docker run кожного scenario обмежений окремо. Full path залишає QR package install і installer Docker/update coverage для nightly scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. Pushes у `main`, зокрема merge commits, не примушують full path; коли changed-scope logic запросила б full coverage на push, workflow залишає fast Docker smoke і передає full install smoke nightly або release validation. Повільний Bun global install image-provider smoke окремо gate-иться через `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть увімкнути його, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, пакує OpenClaw один раз як npm tarball і збирає два спільні images `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну main-pool slot count 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і provider-sensitive tail-pool slot count 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps за замовчуванням мають значення `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перенавантажували Docker, тоді як легші lanes усе ще заповнюють доступні slots. Одна lane, важча за effective caps, усе одно може стартувати з порожнього pool, а потім виконується самостійно, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникати локальних Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate preflights Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. Він за замовчуванням припиняє планувати нові pooled lanes після першої failure, і кожна lane має fallback timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, зокрема release-only lanes, як-от `install-e2e`, і split bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, які package, image kind, live image, lane і credential coverage потрібні, потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість rebuild. Docker image pulls повторюються з обмеженим 180-секундним timeout на attempt, щоб завислий registry/cache stream швидко повторився, а не спожив більшість CI critical path. Workflow `Package Acceptance` є high-level package gate: він resolve-ить candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або artifact попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA для resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли full release-path coverage запитує це, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували над critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість серійної all-in-one lane `bundled-channel-deps`. Кожен chunk uploads `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes на підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job збирає live-test image локально для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділена за update target, щоб repeated npm update і doctor repair passes могли shard-итися з іншими bundled checks.

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` лишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` лишаються агрегованими псевдонімами плагінів/середовища виконання, але workflow релізу використовує розділені фрагменти, щоб smoke-перевірки каналів, цілі оновлення, перевірки середовища виконання плагінів і проходи встановлення/видалення вбудованих плагінів могли виконуватися паралельно. Цільові dispatch-запуски `docker_lanes` також розділяють кілька вибраних ланів на паралельні jobs після одного спільного кроку підготовки пакета/образу, а лани оновлення вбудованих каналів повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Локальна логіка змінених ланів міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи: зміни production-коду ядра запускають typecheck production-коду ядра й тестів ядра плюс lint/guards ядра, зміни лише тестів ядра запускають лише typecheck тестів ядра плюс lint ядра, зміни production-коду розширень запускають typecheck production-коду розширень і тестів розширень плюс lint розширень, а зміни лише тестів розширень запускають typecheck тестів розширень плюс lint розширень. Зміни Public Plugin SDK або контрактів плагінів розширюються до typecheck розширень, оскільки розширення залежать від цих контрактів ядра, але Vitest-проходи розширень є явною тестовою роботою. Версійні bump-и лише release-метаданих запускають цільові перевірки версії/config/root-dependency. Невідомі зміни root/config fail safe до всіх check-ланів.
Локальна маршрутизація змінених тестів міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним mappings, потім sibling-тестам та import-graph
dependents. Спільна delivery-конфігурація group-room є одним з явних mappings:
зміни до конфігурації видимих відповідей групи, режиму доставки source-відповідей або
system prompt message-tool проходять через core reply tests плюс регресії доставки Discord і
Slack, щоб зміна спільного default падала ще до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для Testbox-валидації запускайте з кореня репозиторію й віддавайте перевагу свіжому прогрітому box для
широкого proof. Перш ніж витрачати повільний gate на box, який було повторно використано, термін якого сплив або
який щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity-перевірка швидко падає, коли зникли потрібні root-файли, як-от
`pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість налагодження
збою product test. Для навмисних PR з великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається у
sync phase понад п’ять хвилин без post-sync output. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diffs.

Ручні CI dispatch-запуски виконують `checks-node-compat-node22` як широке coverage сумісності. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push-и в `main` і standalone manual CI dispatch-запуски тримають цей suite вимкненим.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожен job лишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes спарені, auto-reply запускається як чотири збалансовані workers з reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широкий agents lane використовує спільний Vitest file-parallel scheduler, бо він домінований імпортом/плануванням, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries із використанням CI shard name, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards конкурентно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers і другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе ще компілює цей flavor з BuildConfig flags для SMS/call-log, уникаючи дубльованого debug APK packaging job під час кожного Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded.
Автоматичний CI concurrency key версійований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs та aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, нижчі за вагою extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж зекономили; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж зекономив                                                                                                                                                                                                                                                                                                     |
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
