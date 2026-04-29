---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, перевірки за областю охоплення та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-29T23:00:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58c4ae78bee582314c1ee66917da9870b28a56be7a95944a262e764cf2ccaba5
    source_path: ci.md
    workflow: 16
---

CI запускається на кожен push до `main` і кожен pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінювалися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації, а Android-напрями вмикаються через `include_android` для окремих ручних запусків. Релізні напрями prerelease для Plugin містяться в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, зафіксований на найновішій версії Knip, яку використовує цей сценарій, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, згенерованих артефактів, збірки, live-тестів і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
релізних proof для plugin/package/static/Docker і dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
напрямів. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли
надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує live/provider
шириною, переданою в release checks: `minimum` залишає найшвидші OpenAI/core
release-critical напрями, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media matrix. Umbrella записує
ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат umbrella і зведення часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього workflow або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує повторний запуск невдалого
релізного box обмеженим після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені шарди media audio/video і
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск
і діагностику повільних live-збоїв provider. Агреговані назви шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових повторних запусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють ці бінарні файли перед налаштуванням. Тримайте live suites на базі Docker на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску вкладених Docker-тестів.

Docker-backed шарди live model/backend використовують окремий спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
release workflow збирає і надсилає цей image один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
ціль, release run налаштований неправильно і змарнує wall clock на дубльовані збірки image.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей артефакт
і до live/E2E release-path Docker workflow, і до шарда package acceptance.
Це зберігає package bytes узгодженими між release boxes і уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації package artifact
без блокування release workflow. Він розв’язує одного кандидата з
опублікованої npm-специфікації, trusted `package_ref`, зібраного з вибраним
`workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact
з іншого запуску GitHub Actions, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі покривають smoke, package, product, full і custom
вибори Docker-напрямів. Профіль `package` використовує offline plugin coverage, щоб
валідація опублікованого пакета не залежала від live доступності ClawHub. Опційний
Telegram-напрям повторно використовує артефакт
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
опублікованої npm-специфікації зберігається для окремих dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи цей встановлюваний пакет OpenClaw
працює як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує
дерево source, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і друкує source, workflow ref, package
   ref, версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей артефакт, валідує inventory tarball, готує package-digest
   Docker images за потреби і запускає вибрані Docker-напрями проти цього
   пакета замість пакування workflow checkout. Коли профіль вибирає
   кілька цільових `docker_lanes`, reusable workflow готує пакет
   і спільні images один раз, а потім розгортає ці напрями як паралельні цільові Docker
   завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий артефакт `package-under-test`,
   коли Package Acceptance розв’язав його; окремий Telegram dispatch
   все ще може встановити опубліковану npm-специфікацію.
4. `summary` валить workflow, якщо package resolution, Docker acceptance або
   опційний Telegram-напрям завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  release-версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  опублікованого beta/stable acceptance.
- `source=ref`: пакує trusted `package_ref` branch, tag або повний commit SHA.
  Resolver fetch-ить гілки/теги OpenClaw, перевіряє, що вибраний коміт
  доступний з історії гілок репозиторію або release tag, встановлює залежності у
  detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надати для
  зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
код workflow/harness, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати
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

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають перекривні package/update/plugin напрями, тоді як Package
Acceptance зберігає artifact-native proof для bundled-channel compat, offline plugin і
Telegram проти того самого розв’язаного package tarball.
Cross-OS release checks досі покривають OS-specific onboarding, installer і
platform behavior; package/update product validation слід починати з Package
Acceptance. Windows packaged і installer fresh напрями також перевіряють, що
встановлений пакет може імпортувати browser-control override з raw absolute
Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли він заданий, інакше `openai/gpt-5.4-mini`, щоб
install і Gateway proof залишалися швидкими й детермінованими. Окремі live
provider/model напрями досі покривають ширше model routing, включно з повільнішими
frontier defaults.

Package Acceptance має обмежені вікна legacy-compatibility для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих приватних QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені з tarball;
`doctor-switch` може пропускати subcase persistence для `gateway install --wrapper`,
коли пакет не expose-ить цей flag; `update-channel-switch` може prune missing
`pnpm.patchedDependencies` з fake git fixture, похідного від tarball, і
може логувати missing persisted `update.channel`; plugin smokes можуть читати legacy
install-record locations або приймати missing marketplace install-record
persistence, а `plugin-update` може дозволяти config metadata migration, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований
пакет `2026.4.26` також може попереджати про local build metadata stamp files,
які вже були shipped. Пізніші пакети мають задовольняти сучасні contracts; ті самі
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

Під час налагодження невдалого запуску приймання пакета почніть зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали напрямків, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-напрямків замість повторного запуску повної перевірки релізу.

QA Lab має окремі CI-напрямки поза основним workflow із розумним обмеженням області. Workflow `Parity gate` запускається для відповідних змін PR і ручного запуску; він збирає приватне середовище виконання QA та порівнює імітаційні агентні пакети GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгортає імітаційний parity gate, живий напрямок Matrix, а також живі напрямки Telegram і Discord як паралельні завдання. Живі завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Релізні перевірки запускають живі транспортні напрямки Matrix і Telegram із детермінованим імітаційним провайдером та моделями з кваліфікатором mock (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки живої моделі та звичайного запуску provider-plugin. Живий транспортний Gateway також вимикає пошук пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривають окремі набори живої моделі, нативного провайдера та Docker-провайдера. Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише коли витягнутий CLI це підтримує. Типове значення CLI і ручне введення workflow залишаються `all`; ручний запуск `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критично важливі для релізу напрямки QA Lab перед затвердженням релізу; його QA parity gate запускає кандидатний і базовий пакети як паралельні завдання напрямків, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння parity. Не ставте шлях приземлення PR за `Parity gate`, якщо зміна фактично не торкається середовища виконання QA, parity модельного пакета або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або модульних тестів розглядайте це як необов’язковий сигнал і покладайтеся на evidence з відповідних за областю CI/перевірок.

Workflow `Duplicate PRs After Merge` — це ручний workflow для maintainers для очищення дублікатів після приземлення. Типово він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що приземлений PR об’єднано, і що кожен дублікат має або спільну згадану issue, або перекривні змінені hunks.

Workflow `CodeQL` навмисно є вузьким першим проходом сканера безпеки, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код Actions workflow плюс найризикованіші поверхні JavaScript/TypeScript для автентифікації, секретів, sandbox, cron і gateway за допомогою високоточних запитів безпеки в категорії `/codeql-critical-security/core-auth-secrets`. Завдання channel-runtime-boundary окремо сканує контракти реалізації основних каналів плюс середовище виконання channel plugin, gateway, Plugin SDK, секрети та точки аудиту в категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії auth/secrets. Завдання network-ssrf-boundary сканує поверхні основного SSRF, розбору IP, network guard, web-fetch і політики SSRF у Plugin SDK в категорії `/codeql-critical-security/network-ssrf-boundary`, щоб сигнал межі довіри мережі залишався окремим від базової лінії безпеки auth/secrets. Завдання mcp-process-tool-boundary сканує MCP-сервери, helpers виконання процесів, вихідну доставку та gates виконання agent tools в категорії `/codeql-critical-security/mcp-process-tool-boundary`, щоб сигнал меж команд і tools залишався окремим як від базової лінії auth/secrets, так і від якісного shard MCP/process безпеки. Завдання plugin-trust-boundary сканує поверхні довіри встановлення plugins, loader, manifest, registry, підготовки runtime-dependency, source-loading, public-surface і контракту пакета Plugin SDK в категорії `/codeql-critical-security/plugin-trust-boundary`, щоб сигнал ланцюга постачання plugins і runtime-loading залишався окремим як від коду реалізації bundled plugins, так і від якісного shard plugins безпеки.

Workflow `CodeQL Android Critical Security` — це запланований shard безпеки Android. Він вручну збирає Android-застосунок для CodeQL на найменшій мітці Blacksmith Linux runner, яку приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний shard безпеки macOS. Він вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним типовим workflow, тому що збірка macOS домінує за часом виконання навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний shard не пов’язаний із безпекою. Він запускає лише запити якості JavaScript/TypeScript із серйозністю error, не пов’язані з безпекою, по вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його ручний запуск приймає `profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|session-diagnostics-boundary`; вузькі профілі є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано без запуску решти workflow. Його завдання core-auth-secrets сканує код меж безпеки auth, secrets, sandbox, cron і gateway в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує схему конфігурації, міграцію, нормалізацію та IO-контракти в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує схеми протоколу gateway і контракти серверних методів в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує контракти реалізації основних каналів в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує виконання команд, диспетчеризацію model/provider, диспетчеризацію та черги auto-reply, а також runtime-контракти control-plane ACP в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP-сервери та tool bridges, helpers нагляду за процесами і контракти вихідної доставки в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, aliases memory Plugin SDK, activation glue memory runtime і команди memory doctor в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання session-diagnostics-boundary сканує внутрішні механізми reply queue, черги доставки сесій, helpers прив’язування/доставки вихідних сесій, поверхні diagnostic event/log bundle і CLI-контракти session doctor в окремій категорії `/codeql-critical-quality/session-diagnostics-boundary`. Завдання plugin-sdk-reply-runtime сканує inbound reply dispatch у Plugin SDK, helpers reply payload/chunking/runtime, параметри channel reply, черги доставки та helpers прив’язування session/thread в окремій категорії `/codeql-critical-quality/plugin-sdk-reply-runtime`. Завдання ui-control-plane сканує bootstrap Control UI, local persistence, gateway control flows і runtime-контракти task control-plane в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує основні web fetch/search, media IO, media understanding, image-generation і runtime-контракти media-generation в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і контракти entrypoint Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Завдання plugin-sdk-package-contract сканує опублікований package-side source Plugin SDK і helpers контракту plugin package в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від безпеки, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

Workflow `Docs Agent` — це подієвий напрямок обслуговування Codex для підтримання наявної документації узгодженою з нещодавно приземленими змінами. Він не має чистого розкладу: успішний не-bot push CI run на `main` може його запустити, а ручний запуск може виконати його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли за останню годину було створено інший непропущений запуск Docs Agent. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тому один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу документації.

Workflow `Test Performance Agent` — це подієвий напрямок обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний не-bot push CI run на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується в той UTC-день. Ручний запуск обходить цей денний gate активності. Напрямок будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких refactors, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо базова лінія має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається вперед до приземлення bot push, напрямок rebase validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму safety posture drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені plugins і будує CI-маніфест      | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                 | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для нечернеткових push і PR |
| `build-artifacts`                | Збирає `dist/`, інтерфейс керування, перевірки зібраних артефактів і багаторазові downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії перевірки коректності, як-от перевірки bundled/plugin-contract/protocol    | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів ядра Node, крім ліній каналів, bundled, контрактів і extensions                  | Зміни, релевантні для Node         |
| `check`                          | Шардований еквівалент головного локального gate: production-типи, lint, guards, типи тестів і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, меж, guards для поверхні extensions, меж пакетів і gateway-watch           | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                              | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                            | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-лінія                                                     | Ручний запуск CI для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів і спільні регресії specifier імпортів runtime   | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням спільних зібраних артефактів                   | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Android unit-тести для обох flavors плюс одна debug APK-збірка                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх CI на main або ручний запуск |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але
примусово вмикають кожну scoped-лінію, крім Android: Linux Node shards, bundled-plugin shards, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS та i18n інтерфейсу керування. Окремі ручні запуски CI
виконують лише Android з `include_android=true`; повна release
umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease Plugin,
release-only shard `agentic-plugins`, повний batch sweep extensions
і Docker-лінії prerelease Plugin виключено з CI. Набір Docker
prerelease запускається лише тоді, коли `Full Release Validation` запускає
окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.
Ручні запуски використовують
унікальну групу concurrency, щоб повний набір release-candidate не скасовувався
іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає
довіреному виклику змогу запускати цей граф для branch, tag або повного commit SHA,
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Важчі платформні та runtime-лінії розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест
поводитися так, ніби кожна scoped-область змінилася.
Редагування CI workflow перевіряють граф Node CI та workflow linting, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні lanes залишаються прив’язаними до змін у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування fixture для core-test, а також вузькі редагування helper/test-routing для контрактів плагінів використовують швидкий шлях маніфесту лише для Node: preflight, security і один task `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені поверхнями маршрутизації або helper, які fast task перевіряє напряму.
Перевірки Windows Node обмежені Windows-специфічними обгортками process/path, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цю lane; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для поверхонь Docker/package, змін пакетів/маніфестів bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, test-only редагування і docs-only редагування не резервують Docker workers. Fast path один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений bundled-plugin Docker profile із 240-секундним aggregate command timeout, при цьому Docker run кожного сценарію обмежений окремо. Full path зберігає QR package install і installer Docker/update покриття для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker поверхні. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer-робота не чекала після root image smokes. Pushes у `main`, зокрема merge commits, не примушують full path; коли changed-scope logic вимагала б full coverage під час push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть увімкнути його, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і функціональний образ, який встановлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а provider-sensitive кількість слотів tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за ефективні caps, усе ще може стартувати з порожнього pool, а потім виконуватиметься сама, доки не звільнить capacity. Запуски lane за замовчуванням рознесені на 2 секунди, щоб уникнути локальних Docker daemon create storms; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate preflight перевіряє Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першого failure, і кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, зокрема release-only lanes, як-от `install-e2e`, і розділені bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає і публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker images повторюються з обмеженим 180-секундним timeout на кожну спробу, щоб завислий registry/cache stream швидко повторився, а не споживав більшість критичного шляху CI. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або попереднього workflow artifact, а потім передає цей єдиний artifact `package-under-test` у багаторазовий Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають кастомну Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли full release-path coverage цього вимагає, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Застарілі aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на critical path. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти prepared images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package і images із failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і надрукувати combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділена за update target, щоб повторювані npm update і doctor repair passes могли shard-разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних lanes на parallel jobs після одного shared package/image preparation step, а bundled-channel update lanes повторюються один раз у разі transient npm network failures.

Локальна логіка змінених lanes живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI: зміни production-коду ядра запускають core prod і core test typecheck плюс core lint/guards, зміни лише core tests запускають тільки core test typecheck плюс core lint, production-зміни plugins запускають extension prod і extension test typecheck плюс extension lint, а зміни лише тестів plugins запускають extension test typecheck плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо plugins залежать від цих core contracts, але Vitest extension sweeps є явною тестовою роботою. Version bumps лише release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config для безпеки переходять до всіх check lanes.
Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним mappings, потім sibling tests та import-graph
dependents. Shared group-room delivery config є одним із явних mappings:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна shared default падала ще до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
достатньо harness-wide, що дешевий mapped set не є надійним proxy.

Для Testbox validation запускайте з repo root і віддавайте перевагу свіжому warmed box для
широкого proof. Перш ніж витрачати slow gate на box, який було повторно використано, строк дії якого минув або
який щойно повідомив про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли потрібні root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте новий замість налагодження
помилки product test. Для навмисних PR з великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається у
sync phase понад п’ять хвилин без post-sync output. Встановіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих local diffs.

Manual CI dispatches запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним operator. Звичайні pull requests, `main` pushes і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші сімейства Node tests розділено або збалансовано, щоб кожен job лишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes поєднано парами, auto-reply запускається як чотири balanced workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. `Plugin Prerelease` балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує shared Vitest file-parallel scheduler, бо вона dominated by import/scheduling, а не належить одному slow test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards concurrently в одному job. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи їхні старі check names як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або `main` ref. Вважайте це CI noise, якщо newest run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють нормальні shard failures, але не стають у queue після того, як увесь workflow уже був superseded.
Automatic CI concurrency key versioned (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати newer main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Виконавці

| Виконавець                       | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в queue раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
- [Канали релізів](/uk/install/development-channels)
