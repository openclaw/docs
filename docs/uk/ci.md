---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, які не проходять
summary: Граф завдань CI, перевірки за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T09:13:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe934a27ac3ad314869c9a3995fb83d0fa1bda61f6e31508ce518ce601b0e3d2
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації, причому Android-лінії вмикаються через `include_android` для окремих ручних запусків. Передрелізні лінії Plugin, призначені лише для релізу, розміщені в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, production-прохід Knip лише для залежностей, закріплений за найновішою версією Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він блокує нові невикористані, неоголошені, нерозв’язані, бінарні або каталогові залежності, не вмикаючи повний режим Knip для невикористаних файлів, який залишається ручним аудитом, оскільки OpenClaw навмисно завантажує багато Plugin і runtime-поверхонь через маніфести та рядкові специфікатори.

`Full Release Validation` — це ручний umbrella workflow для «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, dispatch-ить
ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для
релізних доказів Plugin/пакетів/статичних артефактів/Docker, а також dispatch-ить
`OpenClaw Release Checks` для install smoke, package acceptance, Docker
release-path наборів, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
ліній. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли
надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує широтою live/provider,
яку передають у release checks: `minimum` залишає найшвидші OpenAI/core
релізно-критичні лінії, `stable` додає стабільний набір provider/backend, а
`full` запускає широку advisory provider/media матрицю. Umbrella записує
ідентифікатори запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього
run. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат umbrella і підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного дочірнього release або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує перезапуск невдалої
release box у межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені audio/video шарди media, а також
відфільтровані за provider music шарди) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск
і діагностику повільних live-збоїв provider. Агреговані назви шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються дійсними для ручних
одноразових перезапусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори з підтримкою Docker
на звичайних Blacksmith runners, тому що container jobs не підходять
для запуску вкладених Docker-тестів.

Live model/backend шарди з підтримкою Docker використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
release workflow один раз збирає та публікує цей образ, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness шарди запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker
ціль, release run налаштовано неправильно, і він марнуватиме час на дубльовані збірки образів.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране
посилання в tarball `release-package-under-test`, а потім передає цей артефакт
і в live/E2E release-path Docker workflow, і в шард package acceptance.
Це підтримує однаковість байтів пакета між release boxes і уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації артефакта пакета
без блокування release workflow. Він розв’язує одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного вибраним
`workflow_ref` harness, HTTPS URL tarball із SHA-256 або tarball-артефакта
з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
workflow checkout. Профілі охоплюють smoke, package, product, full і custom
вибір Docker-ліній. Профіль `package` використовує офлайн-покриття Plugin, щоб
валідація опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова
Telegram-лінія повторно використовує артефакт
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
опублікованої npm-специфікації зберігається для окремих dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw
як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє
дерево вихідного коду, тоді як package acceptance перевіряє один tarball через
той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

Робочий процес має чотири завдання:

1. `resolve_package` отримує `workflow_ref`, визначає одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить джерело, workflow ref, package
   ref, версію, SHA-256 та профіль у зведенні кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Перевикористовуваний робочий процес завантажує
   цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи
   package-digest і запускає вибрані Docker-напрями для цього
   пакета замість пакування checkout робочого процесу. Коли профіль вибирає
   кілька цільових `docker_lanes`, перевикористовуваний робочий процес готує пакет
   і спільні образи один раз, а потім розгортає ці напрями як паралельні цільові Docker
   завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`,
   коли Приймання пакета визначило один; автономний Telegram dispatch
   усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує робочий процес помилкою, якщо визначення пакета, Docker-приймання або
   необов’язковий Telegram-напрям зазнали невдачі.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable.
- `source=ref`: пакує довірені гілку, тег або повний SHA коміту `package_ref`.
  Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у
  від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  артефактів, якими діляться зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код робочого процесу/оснастки, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточній тестовій оснастці перевіряти
старіші довірені вихідні коміти без запуску старої логіки робочого процесу.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні фрагменти Docker release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Приймання пакета з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker-фрагменти release-path
покривають перетин напрямів package/update/plugin, тоді як Приймання пакета
зберігає artifact-native доказ сумісності bundled-channel, офлайн-Plugin і
Telegram для того самого визначеного tarball пакета.
Перевірки релізу Cross-OS і далі покривають специфічні для ОС onboarding, інсталятор і
поведінку платформи; перевірку продукту package/update слід починати з Приймання
пакета. Напрями Windows packaged та installer fresh також перевіряють, що
встановлений пакет може імпортувати перевизначення browser-control із сирого абсолютного
шляху Windows.

Приймання пакета має обмежені вікна зворотної сумісності для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати шлях сумісності для відомих приватних QA-записів у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені з tarball;
`doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`,
коли пакет не надає цей прапор, `update-channel-switch` може вилучити
відсутні `pnpm.patchedDependencies` з фальшивої git-фікстури, похідної від tarball, і
може логувати відсутній збережений `update.channel`, plugin smoke-тести можуть читати
застарілі розташування install-record або приймати відсутність збереження marketplace
install-record, а `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас
і далі вимагаючи, щоб запис встановлення та поведінка без перевстановлення залишалися
незмінними. Опублікований пакет `2026.4.26` також може попереджати про локальні
файли міток метаданих збірки, які вже були доставлені. Пізніші пакети мають
відповідати сучасним контрактам; ті самі умови спричиняють помилку замість попередження
або пропуску.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lanes, таймінги фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної валідації релізу.

QA Lab має окремі CI lanes поза основним smart-scoped workflow. Workflow `Parity gate` запускається для відповідних змін у PR і manual dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 агентні пакети. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases. Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску плагіна провайдера. Live transport gateway також вимикає пошук у пам’яті, оскільки QA parity покриває поведінку пам’яті окремо; підключення провайдерів покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли це підтримує поточний checked-out CLI. Значення CLI за замовчуванням і manual workflow input лишаються `all`; manual `matrix_profile=all` dispatch завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane-завдання, а потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння. Не ставте шлях landing PR за `Parity gate`, якщо зміна насправді не зачіпає QA runtime, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` — це manual maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR об’єднано, і що кожен дублікат має або спільну referenced issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні й ручні запуски сканують код Actions workflow плюс найбільш ризиковані JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і gateway за допомогою high-precision security queries. Завдання channel-runtime-boundary окремо сканує контракти реалізації core channel плюс channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security-сигнал каналу міг масштабуватися без розширення базової JS/TS категорії.

Workflow `CodeQL Android Critical Security` — це scheduled Android security shard. Він вручну збирає Android app для CodeQL на найменшій Blacksmith Linux runner label, яку приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/manual macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, бо macOS build домінує в runtime навіть коли він clean.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value поверхнях на меншому Blacksmith Linux runner. Його завдання core-auth-secrets сканує auth, secrets, sandbox, cron і gateway security boundary code в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання mcp-process-runtime-boundary сканує MCP servers і tool bridges, process supervision helpers та outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні runtime і signal.

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації узгодженою з нещодавно landing-змінами. Він не має pure schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запускати його напряму. Workflow-run invocations пропускаються, коли `main` уже зрушив далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з останнього docs pass.

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних тестів. Він не має pure schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC дня. Manual dispatch обходить цей daily activity gate. Lane збирає full-suite grouped Vitest performance report, дозволяє Codex вносити лише невеликі coverage-preserving test performance fixes замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push landing, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only changes, changed scopes, changed extensions і будує CI manifest            | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і audit workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Dependency-free production lockfile audit щодо npm advisories                                | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для fast security jobs                                                | Завжди для non-draft pushes і PRs  |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Node-relevant changes              |
| `checks-fast-core`               | Fast Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                  | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                     | Node-relevant changes              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke      | Node-relevant changes              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-relevant changes              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch for releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-relevant changes             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-relevant changes           |
| `test-performance-agent`         | Daily Codex slow-test optimization після trusted activity                                    | Main CI success або manual dispatch |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane, крім Android: шарди Linux Node, шарди плагінів у комплекті, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android із `include_android=true`; повна парасолька релізу вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin, релізний шард `agentic-plugins`, повний batch sweep розширень і Docker lanes передрелізу плагінів виключені з CI. Набір передрелізних перевірок Docker запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate перевірки релізу. Ручні запуски використовують унікальну групу concurrency, щоб повний набір release candidate не скасовувався іншим push або запуском PR на тому самому ref. Необов’язковий input `target_ref` дає змогу довіреному виклику запустити цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі матричні завдання для артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream-споживачі могли стартувати щойно спільний build буде готовий.
4. Після цього розгалужуються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає виявлення changed-scope і змушує manifest preflight діяти так, ніби кожна scoped area змінилася.
Редагування CI workflow перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують запускати нативні builds Windows, Android або macOS; ці platform lanes залишаються scoped до змін у platform source.
Редагування лише маршрутизації CI, вибрані дешеві редагування core-test fixtures, а також вузькі редагування plugin contract helper/test-routing використовують швидкий шлях manifest лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях оминає build artifacts, сумісність із Node 22, контракти каналів, повні core shards, bundled-plugin shards і додаткові guard matrices, коли змінені файли обмежені routing або helper surfaces, які fast task перевіряє напряму.
Windows Node checks обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і поверхнями CI workflow, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для Docker/package surfaces, змін package/manifest плагінів у комплекті, а також core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only changes у плагінах у комплекті, test-only edits і docs-only edits не резервують Docker workers. Fast path один раз збирає image з root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений bundled-plugin Docker profile під 240-секундним aggregate command timeout, причому Docker run кожного scenario обмежений окремо. Full path зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. Pushes у `main`, включно з merge commits, не примушують full path; коли логіка changed-scope запитала б full coverage на push, workflow залишає fast Docker smoke, а full install smoke лишає для nightly або release validation. Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`; він запускається за nightly schedule і з workflow release checks, а manual `install-smoke` dispatches можуть opt in до нього, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні images `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте default main-pool slot count 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а provider-sensitive tail-pool slot count 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps за замовчуванням мають значення `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні slots. Одна lane, важча за effective caps, усе ще може стартувати з порожнього pool, а потім виконується сама, доки не звільнить capacity. Запуски lanes за замовчуванням staggered на 2 секунди, щоб уникнути local Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate preflights Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для inspection scheduler. Він за замовчуванням припиняє планувати нові pooled lanes після першої failure, і кожна lane має 120-minute fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає exact scheduler lanes, включно з release-only lanes, як-от `install-e2e`, і split bundled update lanes, як-от `bundled-channel-update-acpx`, водночас пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact із `package_artifact_run_id`; перевіряє tarball inventory; збирає й push-ить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або existing package-digest images замість rebuild. Workflow `Package Acceptance` є high-level package gate: він resolves candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або artifact попереднього workflow, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші trusted commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA against resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено до `plugins-runtime-services`, коли full release-path coverage цього вимагає, і він зберігає standalone chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` все ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*`, а не serial all-in-one lane `bundled-channel-deps`. Кожен chunk uploads `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає selected lanes against prepared images замість chunk jobs, що утримує debugging failed-lane в межах одного targeted Docker job і prepares, downloads або reuses package artifact для цього run; якщо selected lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Generated per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці values існують, тож failed lane може повторно використати exact package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає full release-path Docker suite. Bundled update matrix розділено за update target, щоб повторні npm update і doctor repair passes могли shard з іншими bundled checks.

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами плагінів/runtime, але релізний workflow використовує розділені фрагменти, щоб smoke-перевірки каналів, цілі оновлення, перевірки runtime плагінів і проходи встановлення/видалення вбудованих плагінів могли виконуватися паралельно. Цільові dispatch-запуски `docker_lanes` також розділяють кілька вибраних lanes на паралельні завдання після одного спільного кроку підготовки пакета/образу, а lanes оновлення вбудованих каналів повторюються один раз у разі тимчасових мережевих збоїв npm.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи: зміни у production-коді ядра запускають typecheck production-коду ядра і тестів ядра плюс lint/guards ядра, зміни лише в тестах ядра запускають тільки typecheck тестів ядра плюс lint ядра, зміни у production-коді extension запускають typecheck production-коду extension і тестів extension плюс lint extension, а зміни лише в тестах extension запускають typecheck тестів extension плюс lint extension. Зміни публічного Plugin SDK або контракту плагінів розширюються до typecheck extension, бо extensions залежать від цих контрактів ядра, але Vitest-проходи extension є явною тестовою роботою. Version bump-и лише релізних метаданих запускають цільові перевірки версії/конфігурації/root-залежностей. Невідомі зміни root/config безпечно переходять до всіх check lanes.
Локальний роутинг changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе,
зміни джерел віддають перевагу явним мапінгам, потім sibling-тестам і залежним
за import-graph. Спільна конфігурація доставки group-room є одним із явних мапінгів:
зміни конфігурації visible-reply для групи, режиму доставки source reply або
системного prompt-а message-tool проходять через тести core reply плюс регресії доставки Discord і
Slack, щоб зміна спільного default падала до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped-набір не є надійним proxy.

Для валідації Testbox запускайте з root репозиторію і віддавайте перевагу свіжому прогрітому box для
широкого proof. Перед тим як витрачати повільний gate на box, який було повторно використано, термін дії якого минув або
який щойно повідомив про несподівано великий sync, спочатку запустіть `pnpm testbox:sanity` всередині
box. Sanity-перевірка швидко падає, коли обов’язкові root-файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує принаймні 200
відстежуваних видалень. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість того, щоб налагоджувати
падіння product test. Для PR із навмисними великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску. `pnpm
testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у
sync-фазі понад п’ять хвилин без post-sync output. Установіть
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше
значення в мілісекундах для незвично великих локальних diff-ів.

Ручні CI-dispatches запускають `checks-node-compat-node22` як широке покриття сумісності. Android є opt-in для окремого ручного CI через `include_android=true` і завжди увімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push-и в `main` і окремі ручні CI-dispatches залишають цей suite вимкненим.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування runners: контракти каналів виконуються як три weighted shards, малі core unit lanes попарно об’єднані, auto-reply запускається як чотири збалансовані workers із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. `Plugin Prerelease` балансує тести вбудованих плагінів між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона dominated by import/scheduling, а не належить одному повільному тестовому файлу. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів tail. Include-pattern shards записують timing entries з використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards concurrently в одному job. Gateway watch, тести каналів і core support-boundary shard виконуються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers і другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють нормальні shard failures, але не стають у queue після того, як увесь workflow уже був superseded.
Автоматичний CI concurrency key versioned (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла ставати в queue раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                               |
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
