---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, контрольні етапи за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T03:30:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6ec4095aa24350e7dcbb894b06dc5c0eef1441dca882d1c9941c22aedbe2e4
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Вона використовує розумне визначення області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області та розгортають повний звичайний граф CI для реліз-кандидатів або широкої перевірки.

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks` для перевірки встановлення, приймання пакета, наборів Docker для релізного шляху, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram-ланів. Він також може запускати післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета. `release_profile=minimum|stable|full` керує широтою live/провайдерів, що передається до release checks: `minimum` залишає найшвидші критичні для релізу лани OpenAI/core, `stable` додає стабільний набір провайдерів/backend, а `full` запускає широку консультативну матрицю провайдерів/медіа. Парасольковий workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат парасолькового workflow і підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього workflow або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольковому workflow. Це обмежує перезапуск невдалої релізної машини після точкового виправлення.

Дочірній live/E2E релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди (`native-live-src-agents`, `native-live-src-gateway-core`, відфільтровані за провайдером завдання `native-live-src-gateway-profiles`, `native-live-src-gateway-backends`, `native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`, `native-live-extensions-openai`, `native-live-extensions-o-z-other`, `native-live-extensions-xai`, розділені шарди аудіо/відео медіа та відфільтровані за провайдером музичні шарди) через `scripts/test-live-shard.mjs` замість одного послідовного завдання. Це зберігає те саме файлове покриття, водночас полегшуючи перезапуск і діагностику повільних live-збоїв провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live-шарди медіа запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирає workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіа-завдання лише перевіряють бінарні файли перед налаштуванням. Залишайте live-набори з Docker на звичайних runner Blacksmith, бо container jobs — неправильне місце для запуску вкладених Docker-тестів.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до Docker workflow релізного шляху live/E2E, і до шарда приймання пакета. Це зберігає байти пакета узгодженими між релізними машинами та уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для перевірки артефакта пакета без блокування релізного workflow. Він розв’язує одного кандидата з опублікованої npm-специфікації, довіреного `package_ref`, зібраного з вибраним harness `workflow_ref`, HTTPS URL tarball із SHA-256 або tarball-артефакта з іншого запуску GitHub Actions, завантажує його як `package-under-test`, а потім повторно використовує планувальник Docker release/E2E з цим tarball замість повторного пакування checkout workflow. Профілі покривають smoke, package, product, full і custom вибори Docker-ланів. Профіль `package` використовує офлайн-покриття плагінів, тож перевірка опублікованого пакета не залежить від live-доступності ClawHub. Необов’язковий Telegram-лан повторно використовує артефакт `package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей встановлюваний пакет OpenClaw як продукт?» Він відрізняється від звичайної CI: звичайна CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` робить checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, ref workflow, ref пакета, версію, SHA-256 та профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-лани проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгортає ці лани як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав пакет; автономний запуск Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або необов’язковий Telegram-лан завершилися з помилкою.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`. Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тега, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full`: повні фрагменти Docker релізного шляху з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти релізного шляху покривають лани package/update/plugin, що перетинаються, тоді як Package Acceptance зберігає artifact-native proof для bundled-channel compat, офлайн-плагіна й Telegram проти того самого розв’язаного tarball пакета.
Cross-OS release checks усе ще покривають OS-специфічне onboarding, installer і поведінку платформи; продуктову перевірку package/update слід починати з Package Acceptance. Лани Windows packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows.

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path для відомих приватних QA-записів у `dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball, `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець, `update-channel-switch` може видаляти відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній збережений `update.channel`, plugin smokes можуть читати legacy install-record locations або приймати відсутнє збереження marketplace install-record, а `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними. Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампа build metadata, які вже були shipped. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ланів, timings фаз і команди перезапуску. Надавайте перевагу перезапуску невдалого профілю пакета або точних Docker-ланів замість повторного запуску full release validation.

QA Lab має окремі лінії CI поза основним робочим процесом зі смарт-обмеженням за областю змін. Робочий процес
`Parity gate` запускається для відповідних змін у PR і вручну через dispatch; він
збирає приватне середовище виконання QA і порівнює mock-агентні пакети GPT-5.5 та Opus 4.6.
Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і вручну
через dispatch; він розподіляє mock parity gate, live-лінію Matrix, а також live-лінії
Telegram і Discord у паралельні завдання. Live-завдання використовують середовище
`qa-live-shared`, а Telegram/Discord використовують оренди Convex. Перевірки релізу
запускають live-лінії транспорту Matrix і Telegram із детермінованим mock-провайдером,
щоб контракт каналу був ізольований від затримки live-моделі; підключення провайдерів
покривається окремими наборами live-моделі, нативного провайдера та Docker-провайдера.
Matrix використовує `--profile fast` для запланованих і релізних gate-перевірок,
додаючи `--fail-fast` лише тоді, коли це підтримує checkout-нутий CLI. Значення CLI за замовчуванням
і ручне введення робочого процесу залишаються `all`; ручний dispatch `matrix_profile=all`
завжди розбиває повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу лінії QA Lab перед схваленням релізу; його QA parity
gate запускає пакети кандидата й базової лінії як паралельні завдання ліній, потім завантажує
обидва артефакти в невелике завдання звіту для фінального parity-порівняння.
Не ставте шлях приземлення PR за `Parity gate`, якщо зміна фактично не
торкається середовища виконання QA, parity модельних пакетів або поверхні, якою володіє parity-робочий процес.
Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий
сигнал і натомість спирайтеся на scoped CI/check-докази.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для
прибирання дублікатів після приземлення. За замовчуванням він працює в dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед зміною стану GitHub він перевіряє, що
приземлений PR змерджено і що кожен дублікат має або спільну пов’язану issue,
або перекривні змінені hunks.

Робочий процес `CodeQL` навмисно є вузьким першим проходом сканера безпеки,
а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код робочих процесів Actions
плюс найбільш ризикові JavaScript/TypeScript-поверхні auth, secrets, sandbox, cron і
gateway із високоточними security-запитами. Завдання
channel-runtime-boundary окремо сканує контракти реалізації core-каналів
плюс середовище виконання Plugin-каналів, Gateway, Plugin SDK, secrets і
audit-точки дотику в категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб сигнал безпеки каналів міг масштабуватися без розширення базової
категорії JS/TS.

Робочий процес `CodeQL Android Critical Security` — це запланований Android-шард
безпеки. Він збирає Android-застосунок вручну для CodeQL на найменшому
лейблі Blacksmith Linux runner, прийнятому workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це щотижневий/ручний macOS-шард
безпеки. Він збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS,
фільтрує результати збірки залежностей з завантаженого SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
робочим процесом за замовчуванням, бо macOS-збірка домінує за часом виконання навіть коли вона чиста.

Робочий процес `CodeQL Critical Quality` — це відповідний non-security-шард. Він
запускає лише JavaScript/TypeScript quality-запити з error-рівнем severity і без security
за вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Його
baseline-завдання сканує ту саму поверхню auth, secrets, sandbox, cron і gateway,
що й security-робочий процес. Завдання config-boundary
сканує схеми конфігурації, міграцію, нормалізацію та IO-контракти в окремій
категорії `/codeql-critical-quality/config-boundary`. Завдання
gateway-runtime-boundary сканує схеми Gateway protocol і контракти серверних методів
в окремій категорії
`/codeql-critical-quality/gateway-runtime-boundary`. Завдання
channel-runtime-boundary сканує контракти реалізації core-каналів
в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання
agent-runtime-boundary сканує виконання команд, диспетчеризацію model/provider,
диспетчеризацію auto-reply і черги, а також runtime-контракти ACP control-plane
в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання
ui-control-plane сканує bootstrap Control UI, локальне збереження, control-потоки Gateway
і runtime-контракти task control-plane в окремій категорії
`/codeql-critical-quality/ui-control-plane`. Завдання
plugin-boundary сканує контракти loader, registry, public-surface і entrypoint Plugin SDK
в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте цей робочий процес окремо від security, щоб quality-знахідки можна було
планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу.
Розширення CodeQL на Swift, Python і bundled-plugin слід додавати назад як
scoped або sharded follow-up роботу лише після того, як вузькі профілі матимуть стабільні
час виконання й сигнал.

Робочий процес `Docs Agent` — це подієво-керована лінія підтримки Codex для утримання
наявної документації узгодженою з нещодавно приземленими змінами. Він не має чистого розкладу:
успішний CI-запуск після non-bot push на `main` може його запустити, а ручний dispatch може
запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли
інший не пропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він
переглядає діапазон комітів від попереднього не пропущеного source SHA Docs Agent до
поточного `main`, тож один щогодинний запуск може покрити всі зміни main, накопичені після
останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво-керована лінія підтримки Codex
для повільних тестів. Він не має чистого розкладу: успішний CI-запуск після non-bot push на
`main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже
запускався або виконується того UTC-дня. Ручний dispatch обходить цей щоденний gate
активності. Лінія будує full-suite grouped Vitest performance report, дозволяє Codex
вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують
базову кількість успішних тестів. Якщо в baseline є failing tests, Codex може виправити
лише очевидні збої, а after-agent full-suite report має пройти перед
будь-яким комітом. Коли `main` просувається до того, як bot push приземлиться, лінія
rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі patch-і пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб action Codex
міг зберегти таку саму drop-sudo safety posture, як і docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, змінені scopes, змінені extensions і будує CI manifest              | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит робочих процесів через `zizmor`                           | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Production-аудит lockfile без залежностей за npm advisories                                  | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                          | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts          | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol checks                 | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-релевантні зміни              |
| `checks-node-extensions`         | Повні bundled-plugin test shards для всього extension suite                                  | Node-релевантні зміни              |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                     | Node-релевантні зміни              |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Node-релевантні зміни              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-релевантні зміни              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-релевантні зміни              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Збірка сумісності Node 22 і smoke-лінія                                                      | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Python-skill-релевантні зміни      |
| `checks-windows`                 | Windows-специфічні process/path tests плюс shared runtime import specifier regressions       | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane із використанням спільних built artifacts                         | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS-застосунку                                               | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна Codex-оптимізація повільних тестів після trusted activity                            | Успіх CI main або ручний dispatch  |

Ручні CI dispatch-и запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
scoped-лінію: Linux Node shards, bundled-plugin shards, channel contracts,
сумісність Node 22, `check`, `check-additional`, build smoke, docs checks,
Python skills, Windows, macOS, Android і Control UI i18n. Ручні запуски використовують
унікальну concurrency group, щоб full suite release-candidate не було скасовано
іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дозволяє
trusted caller запустити цей граф для branch, tag або full commit SHA, водночас
використовуючи файл робочого процесу з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими смугами Linux, щоб нижчі споживачі могли стартувати щойно спільна збірка буде готова.
4. Важчі смуги платформ і середовищ виконання розгалужуються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії розміщена в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує маніфест preflight
діяти так, ніби кожна область із власною областю дії змінилася.
Редагування CI workflow перевіряють граф CI для Node плюс linting workflow, але самі по собі не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні смуги залишаються прив’язаними до змін у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-test і вузькі редагування допоміжних засобів/маршрутизації тестів контракту плагіна використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів bundled-plugin і додаткових матриць захисту, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями CI workflow, що виконують цю смугу; непов’язані зміни у вихідному коді, плагінах, install-smoke і лише тестах залишаються на смугах Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request виконують швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker worker. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд, при цьому Docker-запуск кожного сценарію обмежується окремо. Повний шлях зберігає QR package install і installer Docker/update-покриття для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push до `main`, включно з merge commit, не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він виконується за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть увімкнути його, але pull request і push до `main` його не запускають. QR і installer Docker-тести зберігають власні Dockerfile, сфокусовані на встановленні. Локальний `test:docker:all` заздалегідь збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий Node/Git runner для смуг installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для смуг звичайної функціональності. Визначення Docker-смуг розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника розміщена в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної смуги за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає смуги з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до провайдерів, 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких смуг за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і багатосервісні смуги не перевантажували Docker, тоді як легші смуги все ще заповнюють доступні слоти. Одна смуга, важча за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Старти смуг за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальна сукупна перевірка preflight перевіряє Docker, видаляє застарілі OpenClaw E2E containers, виводить статус активних смуг, зберігає тривалість смуг для впорядкування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням вона припиняє планувати нові pooled lanes після першої помилки, і кожна смуга має резервний таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail смуги використовують жорсткіші обмеження для окремих смуг. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні смуги планувальника, включно зі смугами лише для релізу, як-от `install-e2e`, і розділеними bundled update-смугами, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити одну невдалу смугу. Reusable live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live image, смуги й облікових даних потрібне, потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує bare/functional GHCR Docker E2E images із тегами за digest пакета через Docker layer cache Blacksmith, коли план потребує смуг із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з package-digest замість повторної збірки. Workflow `Package Acceptance` є високорівневим пакувальним gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commit без checkout старого workflow-коду. Release checks запускають кастомну Package Acceptance delta для цільового ref: bundled-channel compat, offline plugin fixtures і Telegram package QA щодо визначеного tarball. Release-path Docker suite запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька смуг через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path-покриття цього вимагає, і зберігає окремий chunk `openwebui` лише для запусків OpenWebUI-only. Застарілі агреговані назви chunk `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних повторних запусків, але release workflow використовує розділені chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на критичному шляху. Псевдонім смуги `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох provider installer lanes. Chunk `bundled-channels` запускає розділені смуги `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one смуги `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` із логами смуг, тривалостями, `summary.json`, `failures.json`, тривалостями фаз, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Input workflow `docker_lanes` запускає вибрані смуги щодо підготовлених образів замість chunk jobs, що утримує налагодження невдалої смуги в межах одного цільового Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker lane, цільове завдання локально збирає live-test image для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної смуги включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала смуга могла повторно використати точний пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і надрукувати комбіновані/по-смугові цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних смуг і критичного шляху фаз. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матриця bundled update розділена за ціллю оновлення, щоб повторні npm update і doctor repair passes могли шардитися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований chunk `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime, але release workflow використовує розділені chunks, щоб channel smokes, цілі оновлення, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Цільові запуски `docker_lanes` також розділяють кілька вибраних смуг на паралельні завдання після одного спільного кроку підготовки пакета/образу, а bundled-channel update lanes повторюють спробу один раз для тимчасових npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI: зміни core production запускають core prod і core test typecheck плюс core lint/guards, зміни лише core test запускають тільки core test typecheck плюс core lint, зміни extension production запускають extension prod і extension test typecheck плюс extension lint, а зміни лише extension test запускають extension test typecheck плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts, але Vitest extension sweeps є явною тестовою роботою. Version bumps лише для release metadata запускають цільові version/config/root-dependency checks. Невідомі зміни root/config безпечно переходять до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source віддають перевагу явним mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із явних mappings:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна shared default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки harness-wide, що дешевий mapped set не є надійним proxy.

Для Testbox validation запускайте з repo root і віддавайте перевагу свіжому warmed box для
broad proof. Перш ніж витрачати повільний gate на box, який був повторно використаний, expired або
щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли обов’язкові root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і warmed свіжий замість налагодження
product test failure. Для навмисних PR із великими deletion встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

Manual CI dispatches запускають `checks-node-compat-node22` як release-candidate compatibility coverage. Звичайні pull requests і `main` pushes пропускають цю lane і тримають matrix зосередженою на Node 24 test/channel lanes.

Найповільніші сімейства Node test розділені або збалансовані, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, bundled plugin tests балансуються між шістьма extension workers, малі core unit lanes поєднуються, auto-reply запускається як чотири balanced workers із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Broad agents lane використовує shared Vitest file-parallel scheduler, бо вона dominated import/scheduling, а не належить одному повільному test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries із CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards concurrently всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded.
Automatic CI concurrency key версіонований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може безкінечно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж зекономили; install-smoke Docker builds, де queue time для 32-vCPU коштував більше, ніж зекономив                                                                                                                                                                                                                                                                                                     |
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

- [Огляд установлення](/uk/install)
- [Release channels](/uk/install/development-channels)
