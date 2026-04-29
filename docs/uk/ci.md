---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, перевірки за областю дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-29T04:29:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80e4eb0d3713a353a9b5e3d75a7c94435587d66ac45aad5d906bf6700ddd57fc
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне визначення області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області та розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом". Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks`
для smoke-перевірки встановлення, приймання пакета, наборів release-path для Docker,
live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram-напрямів. Він також може запускати
післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета. `release_profile=minimum|stable|full` керує шириною
live/provider, що передається до release checks: `minimum` залишає найшвидші
критичні для релізу напрями OpenAI/core, `stable` додає стабільний набір provider/backend,
а `full` запускає широку консультативну матрицю provider/media. Парасольковий workflow записує
ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське
завдання verifier, щоб оновити результат парасолькового workflow і підсумок таймінгів.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього запуску або вужчу
релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольковому workflow. Це утримує перезапуск
невдалого релізного блока в межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені audio/video shards для media та
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме покриття файлів, водночас спрощуючи перезапуск
і діагностику повільних збоїв live provider. Агреговані назви shards
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Нативні live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють наявність бінарників перед налаштуванням. Тримайте Docker-backed
live-набори на звичайних Blacksmith runners, бо container jobs — неправильне
місце для запуску вкладених Docker-тестів.

Docker-backed shards для live model/backend використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
release workflow збирає та публікує цей образ один раз, після чого shards Docker live model,
gateway, CLI backend, ACP bind і Codex harness запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards самостійно перебирають повну source Docker
ціль, релізний запуск неправильно налаштований і марнуватиме wall clock на дубльовані збірки образів.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей артефакт
і до live/E2E release-path Docker workflow, і до package acceptance
shard. Це зберігає байти пакета узгодженими між релізними блоками та уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це побічний workflow для валідації артефакта пакета
без блокування релізного workflow. Він розв’язує одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного за допомогою вибраного
`workflow_ref` harness, HTTPS URL tarball із SHA-256 або tarball-артефакта
з іншого запуску GitHub Actions, завантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування
checkout workflow. Профілі покривають smoke, package, product, full і custom
вибори Docker lanes. Профіль `package` використовує офлайн-покриття plugin, щоб
валідація опублікованого пакета не залежала від live-доступності ClawHub. Опційний
Telegram-напрям повторно використовує артефакт
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях
опублікованої npm-специфікації збережено для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей встановлюваний пакет OpenClaw
як продукт?" Це відрізняється від звичайного CI: звичайний CI валідує
дерево вихідного коду, тоді як package acceptance валідує один tarball через той самий
Docker E2E harness, який користувачі виконують після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить джерело, workflow ref, package
   ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує
   цей артефакт, валідує інвентар tarball, готує package-digest
   Docker-образи за потреби та запускає вибрані Docker lanes проти цього
   пакета замість пакування checkout workflow. Коли профіль вибирає
   кілька цільових `docker_lanes`, reusable workflow готує пакет
   і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker
   завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`,
   якщо Package Acceptance розв’язав його; standalone Telegram dispatch
   все ще може встановити опубліковану npm-специфікацію.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або
   опційний Telegram-напрям завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  релізну версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у
  від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його варто надати для
  зовнішньо поширюваних артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати
старіші довірені коміти вихідного коду без запуску старої workflow-логіки.

Профілі відповідають Docker-покриттю:

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
`telegram_mode=mock-openai`. Docker
chunks release-path покривають перетин package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native bundled-channel compat, offline plugin і
Telegram-доказ проти того самого розв’язаного package tarball.
Cross-OS release checks і далі покривають OS-specific onboarding, installer і
platform behavior; валідацію package/update product слід починати з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений пакет може імпортувати browser-control override із сирого абсолютного
Windows-шляху.

Package Acceptance має обмежені вікна legacy-сумісності для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати шлях сумісності для відомих приватних QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені tarball,
`doctor-switch` може пропустити підвипадок персистентності `gateway install --wrapper`,
коли пакет не надає цей прапорець, `update-channel-switch` може обрізати
відсутні `pnpm.patchedDependencies` із fake git fixture, похідного від tarball, і
може логувати відсутній збережений `update.channel`, plugin smokes можуть читати legacy
розташування install-record або приймати відсутню персистентність marketplace install-record,
а `plugin-update` може дозволити міграцію metadata конфігурації, водночас усе ще
вимагаючи, щоб install record і поведінка no-reinstall залишалися незмінними. Опублікований
пакет `2026.4.26` також може попереджати про stamp-файли локальних build metadata,
які вже були поставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі
умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`,
щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте
дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і команди перезапуску. Надавайте перевагу перезапуску невдалого профілю пакета або
точних Docker lanes замість перезапуску full release validation.

Лабораторія QA має окремі CI-лінії поза основним workflow із розумною областю дії. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне середовище виконання QA та порівнює agentic-пакети mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгортає mock parity gate, live-лінію Matrix, а також live-лінії Telegram і Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу запускають live-лінії транспорту Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway також вимикає пошук у пам’яті, оскільки parity QA окремо покриває поведінку пам’яті; підключення провайдерів покривають окремі набори live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і релізних gate-перевірок, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Стандартне значення CLI і ручний вхід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критично важливі для релізу лінії QA Lab перед схваленням релізу; його gate parity QA запускає candidate і baseline пакети як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння parity.
Не ставте шлях приземлення PR за `Parity gate`, якщо зміна насправді не торкається середовища виконання QA, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і натомість спирайтеся на докази зі scoped CI/check.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після приземлення. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що приземлений PR змерджено і що кожен дублікат має або спільну referenced issue, або перекривані змінені hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код Actions workflow плюс поверхні найвищого ризику JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway за допомогою високоточних security queries. Завдання channel-runtime-boundary окремо сканує контракти core channel implementation разом із channel plugin runtime, Gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії JS/TS.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшій мітці Blacksmith Linux runner, яку приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним стандартним workflow, бо збірка macOS домінує за часом виконання навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його baseline job сканує ту саму поверхню auth, secrets, sandbox, cron і gateway, що й security workflow. Завдання config-boundary сканує config schema, migration, normalization і IO contracts в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує gateway protocol schemas і server method contracts в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch and queues, а також ACP control-plane runtime contracts в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання plugin-boundary сканує loader, registry, public-surface і Plugin SDK entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі profiles матимуть стабільні runtime і signal.

Workflow `Docs Agent` — це подієво-керована лінія підтримки Codex для збереження наявної документації узгодженою з нещодавно приземленими змінами. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запускати його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені від останнього проходу документації.

Workflow `Test Performance Agent` — це подієво-керована лінія підтримки Codex для повільних тестів. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC-дня. Manual dispatch обходить цей daily activity gate. Лінія створює full-suite grouped Vitest performance report, дозволяє Codex вносити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline count пройдених тестів. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push приземлиться, лінія робить rebase перевіреного patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Виявляє зміни лише документації, змінені області, змінені extensions і збирає CI manifest    | Завжди для non-draft push і PR    |
| `security-scm-fast`              | Виявлення private key і audit workflow через `zizmor`                                        | Завжди для non-draft push і PR    |
| `security-dependency-audit`      | Audit production lockfile без залежностей щодо npm advisories                                | Завжди для non-draft push і PR    |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft push і PR    |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts          | Зміни, релевантні Node            |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні Node            |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Зміни, релевантні Node            |
| `checks-node-extensions`         | Повні bundled-plugin test shards для всього extension suite                                  | Зміни, релевантні Node            |
| `checks-node-core-test`          | Core Node test shards, без channel, bundled, contract і extension lanes                      | Зміни, релевантні Node            |
| `check`                          | Sharded equivalent main local gate: prod types, lint, guards, test types і strict smoke      | Зміни, релевантні Node            |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні Node            |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні Node            |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні Node            |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для релізів    |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                      | Змінено документацію              |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Зміни, релевантні Python-skill    |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Зміни, релевантні Windows         |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | Зміни, релевантні macOS           |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні macOS           |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні Android         |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success або manual dispatch |

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і Control UI i18n. Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не скасовувався іншим push або PR run на тому самому ref. Необов’язковий вхід `target_ref` дає trusted caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих завдань матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими лініями Linux, щоб низхідні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Важчі платформні та runtime-лінії розгалужуються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест
поводитися так, ніби змінилася кожна область з окремою областю дії.
Редагування CI workflow перевіряють граф Node CI плюс лінтинг workflow, але самі собою не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються прив’язаними до змін у платформному source.
Редагування лише маршрутизації CI, вибрані дешеві редагування core-test fixture, а також вузькі редагування helper/test-routing для контрактів плагінів використовують швидкий маніфестний шлях лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних core shards, shards вбудованих плагінів і додаткових guard matrices, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни source, плагінів, install-smoke і test-only залишаються на лініях Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/package, змін package/manifest вбудованих плагінів, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише source у вбудованих плагінах, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення і запускає обмежений Docker profile вбудованого плагіна під 240-секундним aggregate command timeout, причому Docker run кожного сценарію обмежений окремо. Повний шлях зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних dispatches, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker поверхні. Pushes у `main`, включно з merge commits, не примушують виконувати повний шлях; коли логіка changed-scope на push вимагала б повного покриття, workflow зберігає швидкий Docker smoke і залишає full install smoke для нічної або release validation. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він запускається за нічним розкладом і з release checks workflow, а ручні dispatches `install-smoke` можуть увімкнути його, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для ліній installer/update/plugin-dependency і functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а чутливу до провайдерів кількість слотів tail-pool, що дорівнює 10, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні обмеження, все одно може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Старти ліній за замовчуванням рознесені на 2 секунди, щоб уникнути штормів create у локальному Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate виконує preflight Docker, видаляє застарілі OpenClaw E2E containers, виводить статус активних ліній, зберігає timings ліній для впорядкування longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першого failure, і кожна лінія має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, такими як `install-e2e`, і split bundled update lanes, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або попереднього workflow artifact, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA проти resolved tarball. Docker suite release path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI входить до `plugins-runtime-services`, коли цього вимагає повне release-path coverage, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` все ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в critical path. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split `bundled-channel-*` і `bundled-channel-update-*` lanes замість serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що утримує debugging failed-lane в межах одного targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точний package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для summaries slow-lane і phase critical-path. Scheduled live/E2E workflow щодня запускає повний release-path Docker suite. Bundled update matrix розділена за update target, щоб повторні npm update і doctor repair passes могли shard разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted dispatches `docker_lanes` також розділяють кілька вибраних lanes на parallel jobs після одного спільного package/image preparation step, а bundled-channel update lanes повторюють спробу один раз у разі transient npm network failures.

Локальна логіка змінених lane зберігається в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI: зміни production-коду core запускають typecheck core prod і core test плюс core lint/guards, зміни лише core test запускають тільки typecheck core test плюс core lint, зміни production-коду extension запускають typecheck extension prod і extension test плюс extension lint, а зміни лише extension test запускають typecheck extension test плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів, але Vitest sweep для extensions є явною тестовою роботою. Version bump-и лише metadata release запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config fail safe до всіх check lanes.
Локальна маршрутизація змінених тестів зберігається в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним mapping-ам, потім sibling tests та
залежним import-graph. Shared group-room delivery config є одним із явних mapping-ів:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і
Slack, тож shared default change падає ще до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки harness-wide, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня repo й віддавайте перевагу свіжому прогрітому box для
широкого proof. Перед тим як витрачати повільний gate на box, який було reused, expired або
щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли required root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує принаймні 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий, замість того щоб debug-ити
product test failure. Для PR з intentional large deletion задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

Manual CI dispatches запускають `checks-node-compat-node22` як release-candidate compatibility coverage. Звичайні pull requests і push-и в `main` пропускають цей lane та тримають matrix сфокусованою на Node 24 test/channel lanes.

Найповільніші Node test families розділені або збалансовані, щоб кожен job лишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, bundled plugin tests балансуються між шістьма extension workers, small core unit lanes об’єднані в пари, auto-reply запускається як чотири balanced workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media та miscellaneous plugin tests використовують власні dedicated Vitest configs замість shared plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Broad agents lane використовує shared Vitest file-parallel scheduler, бо він домінований import/scheduling, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries із назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої невеликі independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі check names як lightweight verifier jobs, але уникаючи двох додаткових Blacksmith workers і другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють нормальні shard failures, але не стають у queue після того, як увесь workflow уже був superseded.
Automatic CI concurrency key versioned (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не cancel in-progress runs.

## Ранери

| Ранер                            | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в queue раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

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
