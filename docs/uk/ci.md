---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося.
    - Ви налагоджуєте перевірки GitHub Actions, які завершуються помилкою.
summary: Граф завдань CI, перевірки за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T20:12:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d0d75009f612338a2a45b0d4dc2c4e90d2dfeb86b020ed19a1a218d9a780aa9
    source_path: ci.md
    workflow: 16
---

CI запускається на кожен push до `main` і кожен pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів у реліз або широкої перевірки, з Android-ланами, що вмикаються через `include_android` для окремих ручних запусків. Релізні лани попереднього випуску Plugin містяться в окремому workflow `Plugin Prerelease` і запускаються лише з `Full Release Validation` або явного ручного dispatch.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies`, виробничий dependency-only прохід Knip, закріплений за останньою версією Knip, яку використовує цей скрипт, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`. Він також запускає `pnpm deadcode:unused-files`, який порівнює виробничі знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Цей запобіжник падає, коли PR додає новий неперевірений невикористаний файл або залишає застарілий запис allowlist після очищення, водночас зберігаючи навмисні поверхні динамічних plugin, згенеровані поверхні, build, live-test і package bridge, які Knip не може статично розв’язати.

`Full Release Validation` — це ручний umbrella workflow для “запустити все перед релізом”. Він приймає гілку, тег або повний SHA коміту, dispatch-ить ручний workflow `CI` із цією ціллю, dispatch-ить `Plugin Prerelease` для релізного доказу plugin/package/static/Docker і dispatch-ить `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram ланів. Він також може запустити post-publish workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує шириною live/provider, що передається до release checks: `minimum` залишає найшвидші критичні для релізу OpenAI/core лани, `stable` додає стабільний набір provider/backend, а `full` запускає широку advisory provider/media matrix. Umbrella записує ідентифікатори запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське verifier-завдання, щоб оновити результат umbrella та зведення таймінгів.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва приймають `rerun_group`. Використовуйте `all` для кандидата в реліз, `ci` лише для звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього workflow або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на umbrella. Це утримує перезапуск failed release box обмеженим після сфокусованого виправлення.

Дочірній live/E2E релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway-core`, provider-filtered завдання `native-live-src-gateway-profiles`, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z-other`, `native-live-extensions-xai`, розділені media audio/video шарди та provider-filtered music шарди) через `scripts/test-live-shard.mjs` замість одного послідовного завдання. Це зберігає те саме файлове покриття, водночас полегшуючи перезапуск і діагностику повільних live provider відмов. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед setup. Тримайте Docker-backed live набори на звичайних Blacksmith runners, бо container jobs — неправильне місце для запуску вкладених Docker-тестів.

Docker-backed live model/backend шарди використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й пушить цей образ один раз, після чого Docker live model, gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker target, release run налаштовано неправильно і він змарнує wall clock на дубльовані збірки образів.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до live/E2E release-path Docker workflow, і до package acceptance шарда. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для перевірки артефакту пакета без блокування release workflow. Він розв’язує одного кандидата з опублікованої npm-специфікації, trusted `package_ref`, зібраного за допомогою вибраного `workflow_ref` harness, HTTPS tarball URL із SHA-256 або tarball artifact з іншого GitHub Actions run, завантажує його як `package-under-test`, а потім повторно використовує Docker release/E2E scheduler із цим tarball замість повторного пакування workflow checkout. Профілі покривають smoke, package, product, full і custom вибори Docker lane. Профіль `package` використовує offline plugin покриття, тож перевірка опублікованого пакета не залежить від live доступності ClawHub. Необов’язковий Telegram lane повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих dispatch.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як “чи працює цей встановлюваний пакет OpenClaw як продукт?” Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє інвентар tarball, готує Docker-образи package-digest за потреби та запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли профіль вибирає кілька targeted `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні targeted Docker jobs з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав один; окремий Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` валить workflow, якщо package resolution, Docker acceptance або необов’язковий Telegram lane завершилися з помилкою.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref`: пакує trusted `package_ref` гілку, тег або повний SHA коміту. Resolver fetch-ить гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або release tag, встановлює залежності в detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted workflow/harness код, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші trusted source commits без запуску старої workflow logic.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Release-path Docker chunks покривають overlap package/update/plugin lanes, тоді як Package Acceptance зберігає artifact-native bundled-channel compat, offline plugin і Telegram доказ проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його встановлено, інакше `openai/gpt-5.4-mini`, тож install і gateway proof залишаються швидкими й детермінованими. Окремі live provider/model lanes усе ще покривають ширшу маршрутизацію моделей, включно з повільнішими frontier defaults.

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path для відомих private QA entries у `dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball, `doctor-switch` може пропустити підвипадок persistency `gateway install --wrapper`, коли пакет не expose-ить цей flag, `update-channel-switch` може prune-ити відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній persisted `update.channel`, plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence, а `plugin-update` може дозволити config metadata migration, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були відвантажені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови призводять до failure замість warning або skip.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних lane Docker замість повторного запуску повної release validation.

QA Lab має окремі CI lane поза основним smart-scoped workflow. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний dispatch; він збирає приватний QA runtime і порівнює агентні пакети mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгортає mock parity gate, live Matrix lane, а також live lane Telegram і Discord як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують leases Convex. Release checks запускають live transport lane Matrix і Telegram з детермінованим mock provider і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway також вимикає memory search, оскільки QA parity окремо покриває поведінку memory; підключення provider покривається окремими наборами live model, native provider і Docker provider. Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Значення CLI за замовчуванням і ручний workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає release-critical lane QA Lab перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невеликий report job для фінального parity comparison. Не ставте шлях landing для PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit tests розглядайте його як додатковий сигнал і спирайтеся на scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR об’єднано, і що кожен duplicate має або спільну referenced issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним sweep репозиторію. Щоденні й ручні запуски сканують код Actions workflow, а також найризикованіші поверхні JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway з high-precision security queries. Job channel-runtime-boundary окремо сканує контракти core channel implementation, а також channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security signal каналів міг масштабуватися без розширення базової категорії JS/TS. Job network-ssrf-boundary сканує core SSRF, IP parsing, network guard, web-fetch і поверхні Plugin SDK SSRF policy у категорії `/codeql-critical-security/network-ssrf-boundary`, щоб сигнал межі network trust залишався окремим від ширшої JS/TS security baseline.

Workflow `CodeQL Android Critical Security` — це scheduled Android security shard. Він вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це weekly/manual macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним default workflow, оскільки macOS build домінує runtime навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його manual dispatch приймає `profile=all|plugin-sdk-package-contract`; вузький profile є першим teaching/iteration hook для запуску одного quality shard ізольовано без dispatch решти workflow. Його job core-auth-secrets сканує код auth, secrets, sandbox, cron і gateway security boundary в окремій категорії `/codeql-critical-quality/core-auth-secrets`. Job config-boundary сканує config schema, migration, normalization та IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Job gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Job channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Job agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Job mcp-process-runtime-boundary сканує MCP servers і tool bridges, process supervision helpers та outbound delivery contracts в окремій категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Job memory-runtime-boundary сканує memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands в окремій категорії `/codeql-critical-quality/memory-runtime-boundary`. Job ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Job web-media-runtime-boundary сканує core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Job plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Job plugin-sdk-package-contract сканує опублікований package-side Plugin SDK source і plugin package contract helpers в окремій категорії `/codeql-critical-quality/plugin-sdk-package-contract`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі profiles матимуть стабільний runtime і signal.

Workflow `Docs Agent` — це event-driven lane обслуговування Codex для підтримання наявної документації у відповідності до нещодавно landed changes. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run був створений протягом останньої години. Коли він запускається, він переглядає діапазон commit від попереднього non-skipped Docs Agent source SHA до поточного `main`, тому один погодинний run може охопити всі main changes, накопичені з останнього docs pass.

Workflow `Test Performance Agent` — це event-driven lane обслуговування Codex для повільних tests. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC дня. Manual dispatch обходить цей daily activity gate. Lane створює full-suite grouped Vitest performance report, дозволяє Codex вносити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє changes, які зменшують baseline count tests, що проходять. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push landed, lane rebase валідований patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти той самий drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд jobs

| Завдання                         | Призначення                                                                                  | Коли запускається                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає CI-маніфест | Завжди для недрафтових пушів і PR          |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових пушів і PR          |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за рекомендаціями npm                              | Завжди для недрафтових пушів і PR          |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових пушів і PR          |
| `build-artifacts`                | Збирає `dist/`, інтерфейс керування, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node                 |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от bundled/Plugin-contract/protocol перевірки           | Зміни, релевантні для Node                 |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node                 |
| `checks-node-core-test`          | Шарди тестів ядра Node, за винятком напрямів каналів, bundled, контрактів і розширень        | Зміни, релевантні для Node                 |
| `check`                          | Шардований еквівалент головного локального гейта: production-типи, lint, guards, тестові типи та strict smoke | Зміни, релевантні для Node                 |
| `check-additional`               | Архітектура, межі, guards поверхні розширень, межі пакетів і шарди gateway-watch             | Зміни, релевантні для Node                 |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті запуску                                       | Зміни, релевантні для Node                 |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні для Node                 |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-напрям                                                  | Ручний CI-запуск для релізів               |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію                       |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills        |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів і спільні регресії специфікаторів імпорту runtime | Зміни, релевантні для Windows              |
| `macos-node`                     | Напрям тестів TypeScript для macOS зі спільними зібраними артефактами                        | Зміни, релевантні для macOS                |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні для macOS                |
| `android`                        | Модульні тести Android для обох варіантів плюс одна збірка debug APK                         | Зміни, релевантні для Android              |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх основного CI або ручний запуск       |

Ручні CI-запуски виконують той самий граф завдань, що й звичайний CI, але примусово
вмикають кожен не-Android scoped lane: Linux Node shards, bundled-Plugin shards, channel
contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки
документації, Python Skills, Windows, macOS та i18n інтерфейсу керування. Окремі ручні CI
запуски виконують лише Android з `include_android=true`; повна релізна
парасолька вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease
Plugin, релізний лише shard `agentic-plugins`, повний пакетний sweep розширень
і Docker-напрями prerelease Plugin виключено з CI. Docker prerelease suite запускається
лише тоді, коли `Full Release Validation` запускає окремий workflow
`Plugin Prerelease` з увімкненим release-validation gate. Ручні запуски використовують
унікальну групу concurrency, щоб повний suite release candidate не скасовувався
іншим пушем або PR-запуском на тому самому ref. Опціональний input `target_ref` дає змогу
довіреному виклику запустити цей граф для гілки, тегу або повного SHA коміту,
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок швидкого завершення

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-напрямами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгортаються важчі платформні та runtime-напрями: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка scope розташована в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає виявлення changed-scope і змушує preflight-маніфест
діяти так, ніби змінилася кожна scoped-область.
Редагування CI workflow перевіряють граф Node CI разом із workflow-лінтингом, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці platform lanes залишаються scoped до змін у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування core-test fixtures, а також вузькі редагування helper/test-routing для контрактів плагінів використовують швидкий Node-only шлях маніфесту: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені routing або helper surfaces, які fast task перевіряє напряму.
Перевірки Windows Node scoped до Windows-specific обгорток процесів/шляхів, npm/pnpm/UI runner helpers, конфігурації package manager і поверхонь CI workflow, які виконують цю lane; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для Docker/package surfaces, змін пакетів/маніфестів bundled plugin, а також core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only зміни bundled plugin, test-only редагування та docs-only редагування не резервують Docker workers. Fast path один раз збирає image з root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає bounded bundled-plugin Docker profile із 240-секундним aggregate command timeout, причому Docker run кожного scenario окремо обмежений. Full path зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. Pushes у `main`, включно з merge commits, не примушують full path; коли changed-scope logic запитувала б full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`; він запускається за нічним schedule і з release checks workflow, а ручні dispatches `install-smoke` можуть opt into нього, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні images `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic розташована в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте default main-pool slot count 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і provider-sensitive tail-pool slot count 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки lighter lanes усе ще заповнюють доступні slots. Одна lane, важча за effective caps, усе одно може стартувати з порожнього pool, а потім виконується сама, доки не звільнить capacity. Запуски lanes за замовчуванням staggered на 2 секунди, щоб уникнути local Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate preflight перевіряє Docker, видаляє stale OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для scheduler inspection. Він за замовчуванням припиняє scheduling нових pooled lanes після першої failure, і кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, такими як `install-e2e`, і split bundled update lanes, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує artifact пакета з current-run, або завантажує package artifact із `package_artifact_run_id`; перевіряє tarball inventory; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Blacksmith Docker layer cache, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість rebuild. Docker image pulls повторюються з bounded 180-second per-attempt timeout, щоб stuck registry/cache stream швидко повторився, а не споживав більшість CI critical path. Workflow `Package Acceptance` є high-level package gate: він resolves candidate з npm, trusted `package_ref`, HTTPS tarball plus SHA-256 або prior workflow artifact, потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб current acceptance logic могла перевіряти старіші trusted commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk pulls лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI folded into `plugins-runtime-services`, коли full release-path coverage цього вимагає, і зберігає standalone chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували critical path. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість serial all-in-one lane `bundled-channel-deps`. Кожен chunk uploads `.artifacts/docker-tests/` із lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти prepared images замість chunk jobs, що тримає debugging failed-lane bounded до одного targeted Docker job і prepares, downloads або reuses package artifact для цього run; якщо selected lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Generated per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці values існують, щоб failed lane могла повторно використати exact package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і надрукувати combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає full release-path Docker suite. Bundled update matrix розділено за update target, щоб repeated npm update і doctor repair passes могли shard разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted dispatches `docker_lanes` також розділяють кілька selected lanes на parallel jobs після одного shared package/image preparation step, а bundled-channel update lanes повторюються один раз у разі transient npm network failures.

Локальна changed-lane logic розташована в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж broad CI platform scope: core production changes запускають core prod і core test typecheck plus core lint/guards, core test-only changes запускають лише core test typecheck plus core lint, extension production changes запускають extension prod і extension test typecheck plus extension lint, а extension test-only changes запускають extension test typecheck plus extension lint. Зміни Public Plugin SDK або plugin-contract розширюються до extension typecheck, тому що extensions залежать від цих core contracts, але Vitest extension sweeps є explicit test work. Release metadata-only version bumps запускають targeted version/config/root-dependency checks. Unknown root/config changes fail safe до всіх check lanes.
Локальна changed-test routing розташована в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: direct test edits запускають самі себе,
source edits віддають перевагу explicit mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із explicit mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt route проходять через core reply tests plus Discord і
Slack delivery regressions, щоб зміна shared default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли change
настільки harness-wide, що cheap mapped set не є trustworthy proxy.

Для валідації Testbox запускайте з кореня репозиторію та віддавайте перевагу свіжому прогрітому боксу для широкого доказу. Перед тим як витрачати повільний gate на бокс, який повторно використали, термін дії якого сплив або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині бокса. Перевірка справності швидко завершується помилкою, коли потрібні кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR. Зупиніть цей бокс і прогрійте свіжий замість того, щоб налагоджувати збій продуктового тесту. Для PR із навмисними великими видаленнями задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності. `pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Ручні запуски CI виконують `checks-node-compat-node22` як широке покриття сумісності. Android є опційним для окремого ручного CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `Plugin Prerelease` є дорожчим продуктовим/пакетним покриттям, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і окремі ручні запуски CI тримають цей набір вимкненим.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося малим без надмірного резервування раннерів: контракти каналів запускаються як три зважені shard, малі основні unit-ланки поєднані в пари, auto-reply запускається як чотири збалансовані workers із поділом піддерева reply на shard agent-runner, dispatch і commands/state-routing, а agentic Gateway/Plugin конфігурації розподілені між наявними source-only agentic Node завданнями замість очікування на зібрані артефакти. Широкі browser, QA, media та різні Plugin тести використовують свої виділені конфігурації Vitest замість спільного catch-all для Plugin. `Plugin Prerelease` балансує тести bundled Plugin між вісьмома extension workers; ці extension shard завдання запускають до двох груп Plugin конфігурацій одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy Plugin batch не створювали додаткові завдання CI. Широка ланка agents використовує спільний file-parallel планувальник Vitest, бо вона обмежена імпортом/плануванням, а не одним повільним тестовим файлом. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів tail. Shard із include-pattern записують timing entries з назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілу конфігурацію від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, тести каналів і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи їхні старі назви перевірок як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test ланка все одно компілює цей flavor з BuildConfig flags для SMS/call-log, уникаючи дубльованого debug APK packaging job на кожному Android-релевантному push.
GitHub може позначати заміщені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані shard checks використовують `!cancelled() && always()`, тож вони все ще повідомляють звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було заміщено.
Автоматичний ключ concurrency CI версіонований (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні full-suite запуски використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, нижчі за вагомістю extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled Plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час у черзі 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
