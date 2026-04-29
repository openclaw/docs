---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, перевірки області дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T05:38:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07839136693d9bfa72da1bb24a2839e0b249882795fa939dbc79a35436572b01
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Вона використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження області й розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації. Лінії prerelease для Plugin, призначені лише для релізу, залишаються вимкненими, якщо `Full Release Validation` не запускає CI з `full_release_validation=true`.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний commit SHA, запускає
ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks`
для перевірки встановлення, приймання пакета, наборів Docker для релізного шляху, live/E2E,
OpenWebUI, паритету QA Lab, Matrix і ліній Telegram. Він також може запускати
workflow після публікації `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета. `release_profile=minimum|stable|full` керує шириною
live/provider, переданою в release checks: `minimum` залишає найшвидші
критично важливі для релізу лінії OpenAI/core, `stable` додає стабільний набір
provider/backend, а `full` запускає широку рекомендаційну матрицю provider/media.
Парасольковий workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання
`Verify full validation` повторно перевіряє поточні результати дочірніх запусків і додає
таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено
і він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат
парасолькового workflow і підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного релізного дочірнього workflow
або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольковому workflow. Це утримує перезапуск
невдалого релізного бокса в межах після сфокусованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані shard (`native-live-src-agents`,
`native-live-src-gateway-core`, завдання з фільтрацією за provider
`native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media shard для audio/video та
music shard з фільтрацією за provider) через `scripts/test-live-shard.mjs`
замість одного послідовного завдання. Це зберігає те саме покриття файлів, водночас роблячи повільні
збої live provider простішими для перезапуску й діагностики. Агреговані назви shard
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

Нативні live media shard запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live набори
з підтримкою Docker на звичайних Blacksmith runner, бо контейнерні завдання — неправильне
місце для запуску вкладених Docker тестів.

Live model/backend shard з підтримкою Docker використовують окремий спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
релізний workflow збирає й публікує цей образ один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness shard запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shard перебудовують повну source Docker
ціль незалежно, релізний запуск неправильно налаштований і марнуватиме загальний час
на дубльовані збірки образів.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати вибраний
ref у tarball `release-package-under-test`, а потім передає цей artifact
і в live/E2E Docker workflow релізного шляху, і в shard приймання пакета.
Це підтримує узгодженість байтів пакета між релізними боксами й уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації artifact пакета
без блокування релізного workflow. Він розв’язує одного кандидата з
опублікованої npm специфікації, довіреного `package_ref`, зібраного з вибраним
harness `workflow_ref`, HTTPS URL tarball із SHA-256 або artifact tarball
з іншого запуску GitHub Actions, завантажує його як `package-under-test`, а потім повторно використовує
планувальник Docker release/E2E із цим tarball замість повторного пакування
checkout workflow. Профілі охоплюють smoke, package, product, full і custom
вибори Docker ліній. Профіль `package` використовує offline покриття Plugin, щоб
валідація опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова
лінія Telegram повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, зберігаючи шлях
опублікованої npm специфікації для самостійних запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей installable пакет OpenClaw
як продукт?" Це відрізняється від звичайної CI: звичайна CI перевіряє
дерево source, тоді як package acceptance перевіряє один tarball через той самий
Docker E2E harness, який користувачі виконують після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` робить checkout `workflow_ref`, розв’язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як artifact
   `package-under-test` і виводить source, workflow ref, package
   ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує
   цей artifact, перевіряє inventory tarball, готує Docker образи package-digest
   за потреби й запускає вибрані Docker лінії проти цього
   пакета замість пакування checkout workflow. Коли профіль вибирає
   кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет
   і спільні образи один раз, а потім розгортає ці лінії як паралельні цільові Docker
   завдання з унікальними artifact.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`,
   коли Package Acceptance розв’язав його; самостійний запуск Telegram
   усе ще може встановити опубліковану npm специфікацію.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або
   необов’язкова лінія Telegram завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  релізну версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  acceptance опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний commit SHA `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності в
  від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  зовнішньо поширених artifact.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/harness, який запускає тест. `package_ref` — це source commit,
який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти
старіші довірені source commits без запуску старої логіки workflow.

Профілі відповідають Docker покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker chunks релізного шляху з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker chunks релізного шляху
покривають перетин ліній package/update/plugin, тоді як Package
Acceptance зберігає artifact-native доказ bundled-channel compat, offline Plugin і
Telegram проти того самого розв’язаного package tarball.
Cross-OS release checks усе ще покривають специфічні для ОС onboarding, installer і
platform behavior; валідацію продукту package/update слід починати з Package
Acceptance. Windows packaged і installer fresh лінії також перевіряють, що
встановлений пакет може імпортувати browser-control override з необробленого абсолютного
Windows path.

Package Acceptance має обмежені вікна сумісності зі спадщиною для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball,
`doctor-switch` може пропустити підвипадок persistence `gateway install --wrapper`,
коли пакет не expose цей flag, `update-channel-switch` може prune
відсутні `pnpm.patchedDependencies` з fake git fixture, похідної від tarball, і
може log відсутній persisted `update.channel`, plugin smokes можуть читати legacy
locations install-record або приймати відсутність marketplace install-record
persistence, а `plugin-update` може дозволити міграцію config metadata, водночас усе ще
вимагаючи, щоб install record і поведінка no-reinstall залишалися незмінними. Опублікований
пакет `2026.4.26` також може попереджати про локальні файли штампа build metadata,
які вже були shipped. Пізніші пакети мають задовольняти сучасні contracts; ті самі
умови завершуються помилкою замість warning або skip.

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
щоб підтвердити source пакета, версію та SHA-256. Потім перевірте
дочірній запуск `docker_acceptance` і його Docker artifact:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Надавайте перевагу перезапуску невдалого package profile або
точних Docker lanes замість перезапуску повної release validation.

QA Lab має окремі CI-лінії поза основним workflow зі smart-scoped областю. Workflow
`Parity gate` запускається для відповідних змін у PR і вручну; він
збирає приватне QA-середовище виконання та порівнює агентні пакети mock GPT-5.5 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він
розгалужує mock parity gate, live-лінію Matrix, а також live-лінії
Telegram і Discord як паралельні jobs. Live jobs використовують середовище
`qa-live-shared`, а Telegram/Discord використовують оренди Convex. Release
checks запускають live-лінії транспорту Matrix і Telegram з детермінованим mock
provider і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і
`mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі
та звичайного запуску provider plugin. Live transport Gateway також
вимикає пошук памʼяті, оскільки QA parity окремо покриває поведінку памʼяті;
підключення провайдерів покривається окремими наборами live model, native provider
і Docker provider. Matrix використовує `--profile fast` для запланованих і release gates,
додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI
і ручне введення workflow залишаються `all`; ручний dispatch `matrix_profile=all`
завжди розбиває повне покриття Matrix на jobs `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає release-критичні лінії QA Lab перед схваленням релізу; його QA parity
gate запускає кандидатний і базовий пакети як паралельні lane jobs, потім завантажує
обидва артефакти в невеликий report job для фінального порівняння parity.
Не ставте шлях landing для PR за `Parity gate`, якщо зміна насправді не
торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або unit tests вважайте це необовʼязковим
сигналом і натомість дотримуйтеся scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` — це ручний workflow для maintainer після
land для очищення дублікатів. Типово він працює як dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що
landed PR змерджено і що кожен дублікат має або спільне referenced issue,
або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу,
а не повним скануванням репозиторію. Щоденні та ручні запуски сканують Actions workflow code
плюс найризикованіші поверхні JavaScript/TypeScript auth, secrets, sandbox, Cron і
Gateway за допомогою high-precision security queries. Job
channel-runtime-boundary окремо сканує контракти core channel implementation
плюс channel Plugin runtime, Gateway, Plugin SDK, secrets і
audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб security signal каналів міг масштабуватися без розширення базової
категорії JS/TS.

Workflow `CodeQL Android Critical Security` — це запланований Android
security shard. Він вручну збирає Android app для CodeQL на найменшому
Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS
security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS,
відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
типовим workflow, оскільки збірка macOS домінує за часом виконання навіть коли вона чиста.

Робочий процес `CodeQL Critical Quality` є відповідним несек’юріті-шардом. Він
запускає лише запити якості JavaScript/TypeScript із рівнем серйозності error,
не пов’язані з безпекою, для вузьких цінних поверхонь на меншому Blacksmith Linux runner. Його
базове завдання сканує ті самі поверхні auth, secrets, sandbox, cron і gateway,
що й робочий процес безпеки. Завдання config-boundary
сканує схему конфігурації, міграцію, нормалізацію та контракти IO в межах
окремої категорії `/codeql-critical-quality/config-boundary`. Завдання
gateway-runtime-boundary сканує схеми протоколу gateway і контракти серверних методів
у межах окремої
категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання
channel-runtime-boundary сканує контракти реалізації основних каналів у межах
окремої категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання
agent-runtime-boundary сканує виконання команд, диспетчеризацію моделей/провайдерів,
диспетчеризацію та черги автовідповідей, а також runtime-контракти control-plane ACP у межах
окремої категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання
ui-control-plane сканує початкове завантаження Control UI, локальне збереження, потоки керування gateway
і runtime-контракти control-plane завдань у межах окремої
категорії `/codeql-critical-quality/ui-control-plane`. Завдання
web-media-runtime-boundary сканує основні runtime-контракти веботримання/пошуку, media IO,
розуміння медіа, генерації зображень і генерації медіа в межах
окремої категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання
plugin-boundary сканує контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK
у межах окремої категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте цей робочий процес окремо від безпеки, щоб знахідки якості можна було
планувати, вимірювати, вимикати або розширювати без розмивання сигналу безпеки.
Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як
обмежену або шардовану подальшу роботу лише після того, як вузькі профілі матимуть стабільний
runtime і сигнал.

Робочий процес `Docs Agent` — це подієво-керована смуга обслуговування Codex для підтримання
наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого розкладу: успішний
CI-запуск після push не від бота на `main` може його запустити, а ручний dispatch може
запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже змістився далі або коли
інший не пропущений запуск Docs Agent було створено за останню годину. Коли він працює, він
переглядає діапазон комітів від попереднього не пропущеного source SHA Docs Agent до
поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені від
останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво-керована смуга обслуговування Codex
для повільних тестів. Він не має чистого розкладу: успішний CI-запуск після push не від бота на
`main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже
виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний
обмежувач активності. Смуга створює згрупований звіт продуктивності Vitest для повного набору,
дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують
базову кількість успішних тестів. Якщо в базовому стані є тести з помилками, Codex може виправляти
лише очевидні збої, а звіт повного набору після агента має пройти перед тим,
як щось буде закомічено. Коли `main` просувається до того, як push бота потрапить у репозиторій, смуга
робить rebase перевіреного патча, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберігати ту саму safety posture drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені plugins і будує CI-маніфест      | Завжди для push і PR не в draft    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в draft    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за advisories npm                                  | Завжди для push і PR не в draft    |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR не в draft    |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream-артефакти | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні Node             |
| `checks-node-extensions`         | Повні шарди тестів вбудованих Plugin у всьому наборі extension                               | Зміни, релевантні Node             |
| `checks-node-core-test`          | Шарди основних тестів Node, без смуг каналів, bundled, contract і extension                  | Зміни, релевантні Node             |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node             |
| `check-additional`               | Шарди архітектури, boundary, guards extension-surface, package-boundary і gateway-watch      | Зміни, релевантні Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні Node             |
| `checks`                         | Перевіряльник для тестів каналів built-artifact                                              | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Смуга збірки й smoke для сумісності Node 22                                                  | Ручний CI dispatch для релізів     |
| `plugin-prerelease-suite`        | Агрегат для prerelease статичних перевірок plugin і Docker product lanes                     | Дочірній Full Release Validation CI |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                      | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні Python-skill     |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії runtime import specifier | Зміни, релевантні Windows          |
| `macos-node`                     | Смуга тестів TypeScript для macOS із використанням спільних built artifacts                  | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні macOS            |
| `android`                        | Unit-тести Android для обох flavor плюс одна debug APK збірка                                | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний dispatch  |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n. Набір plugin prerelease виключено з окремого ручного CI й увімкнено лише тоді, коли повна release umbrella проходить із `full_release_validation=true`. Ручні запуски використовують унікальну concurrency group, тож повний набір release-candidate не скасовується іншим push або PR-запуском на тому самому ref. Необов'язковий вхідний параметр `target_ref` дає змогу довіреному виклику виконати цей граф для branch, tag або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці artifacts і platform.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгалужуються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає changed-scope detection і змушує preflight manifest
поводитися так, ніби кожна scoped area змінилася.
Редагування CI workflow перевіряють Node CI graph плюс workflow linting, але самі по собі не змушують запускати native builds для Windows, Android або macOS; ці platform lanes залишаються scoped до змін platform source.
Редагування лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits використовують швидкий Node-only manifest path: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, channel contracts, повних core shards, bundled-plugin shards і додаткових guard matrices, коли змінені файли обмежені routing або helper surfaces, які fast task перевіряє напряму.
Windows Node checks scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, що виконують цю lane; непов'язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають fast path для Docker/package surfaces, bundled plugin package/manifest changes і core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only bundled plugin changes, test-only edits і docs-only edits не резервують Docker workers. Fast path один раз збирає root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає bounded bundled-plugin Docker profile із 240-секундним aggregate command timeout, причому Docker run кожного scenario обмежено окремо. Full path зберігає QR package install і installer Docker/update coverage для nightly scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. `main` pushes, включно з merge commits, не змушують запускати full path; коли changed-scope logic запитує full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть увімкнути його, але pull requests і `main` pushes його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один shared live-test image, один раз пакує OpenClaw як npm tarball і збирає два shared images `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який установлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте default main-pool slot count 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і provider-sensitive tail-pool slot count 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps типово мають значення `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні slots. Одна lane, важча за effective caps, усе одно може стартувати з порожнього pool, а потім виконується сама, доки не звільнить capacity. Старт lanes типово staggered на 2 секунди, щоб уникнути local Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Local aggregate виконує preflights Docker, видаляє stale OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для scheduler inspection. Він типово припиняє планування new pooled lanes після першої failure, і кожна lane має 120-minute fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують tighter per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає exact scheduler lanes, включно з release-only lanes, такими як `install-e2e`, і split bundled update lanes, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Reusable live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, а потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує current-run package artifact, або завантажує package artifact із `package_artifact_run_id`; перевіряє tarball inventory; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Blacksmith's Docker layer cache, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або existing package-digest images замість rebuild. Workflow `Package Acceptance` є high-level package gate: він resolves candidate з npm, довіреного `package_ref`, HTTPS tarball plus SHA-256 або prior workflow artifact, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб current acceptance logic могла перевіряти older trusted commits без checkout old workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає smaller chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено до `plugins-runtime-services`, коли full release-path coverage запитує його, і він зберігає standalone chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували critical path. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*`, а не serial all-in-one lane `bundled-channel-deps`. Кожен chunk вивантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Вхід workflow `docker_lanes` запускає selected lanes проти prepared images замість chunk jobs, що обмежує failed-lane debugging одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо selected lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, тож failed lane може повторно використати exact package та images із failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає full release-path Docker suite. Bundled update matrix розділено за update target, щоб repeated npm update і doctor repair passes могли shard with other bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька selected lanes на parallel jobs після одного shared package/image preparation step, а bundled-channel update lanes повторюють спробу один раз для transient npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіше перевіряє архітектурні межі, ніж широкий обсяг платформи CI: зміни в production-коді ядра запускають typecheck для core prod і core test плюс core lint/guards, зміни лише в тестах ядра запускають тільки core test typecheck плюс core lint, зміни в production-коді розширень запускають extension prod і extension test typecheck плюс extension lint, а зміни лише в тестах розширень запускають extension test typecheck плюс extension lint. Зміни в публічному Plugin SDK або plugin-contract розширюються до typecheck розширень, бо розширення залежать від цих контрактів ядра, але Vitest-перевірки розширень є явною тестовою роботою. Зміни лише в метаданих релізної версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно провалюються до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни джерел віддають перевагу явним мапінгам, потім sibling tests та import-graph
dependents. Shared group-room delivery config є одним із явних мапінгів:
зміни до group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і
Slack, тож зміна shared default падає до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
достатньо широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію і віддавайте перевагу свіжому прогрітому box для
широкого proof. Перш ніж витрачати повільний gate на box, який було повторно використано, строк дії якого минув або
який щойно повідомив про неочікувано великий sync, запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли обов’язкові root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість налагодження
product test failure. Для навмисних PR із великим видаленням установіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

Ручні dispatch CI запускають `checks-node-compat-node22` як широке compatibility coverage. `plugin-prerelease-suite` є дорожчим product/package coverage, тому він запускається лише коли `Full Release Validation` запускає CI з `full_release_validation=true`. Звичайні pull requests, push до `main` і окремі ручні dispatch CI тримають цей suite вимкненим.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожна job залишалася малою без надмірного резервування runners: channel contracts запускаються як три weighted shards, bundled plugin tests балансуються між шістьма extension workers, малі core unit lanes спарені, auto-reply запускається як чотири збалансовані workers із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Широка agents lane використовує shared Vitest file-parallel scheduler, бо вона домінована import/scheduling, а не належить одному повільному test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries, використовуючи назву CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards конкурентно в одній job. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі check names як lightweight verifier jobs, уникаючи двох додаткових Blacksmith workers і другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor з SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або `main` ref. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded.
Автоматичний concurrency key CI версійований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де час у 32-vCPU queue коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                    |
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

- [Огляд установлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
