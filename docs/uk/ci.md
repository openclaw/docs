---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються помилкою
summary: Граф завдань CI, шлюзи області дії та еквіваленти локальних команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-28T18:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a9bbdb7ac3d21f28c4b071bcb2979762b69ff99f308e0477cbf87e4d8812f2f
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для реліз-кандидатів або широкої валідації.

`Full Release Validation` — це ручний парасольковий workflow для «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks` для install smoke,
package acceptance, наборів Docker для релізного шляху, live/E2E, OpenWebUI,
QA Lab parity, Matrix і Telegram lanes. Він також може запускати
післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета. `release_profile=minimum|stable|full` керує шириною
live/provider, що передається в release checks: `minimum` залишає найшвидші
OpenAI/core реліз-критичні lanes, `stable` додає стабільний набір provider/backend,
а `full` запускає широку рекомендаційну матрицю provider/media. Парасольковий
workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання
`Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і
додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній
workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання
верифікації, щоб оновити результат парасолькового workflow і підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного дочірнього релізного
запуску або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольковому
workflow. Це утримує перезапуск невдалої релізної машини в обмежених межах після
цілеспрямованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
`native-live-src-gateway-profiles` jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs`
замість одного послідовного завдання. Це зберігає те саме покриття файлів, водночас
спрощуючи повторний запуск і діагностику повільних live-збоїв provider. Сукупні
назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних одноразових
перезапусків.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз
розв’язати вибране посилання в tarball `release-package-under-test`, а потім
передає цей artifact і в Docker workflow live/E2E релізного шляху, і в shard
package acceptance. Це зберігає байти пакета узгодженими між релізними машинами та
уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації package artifact без
блокування релізного workflow. Він розв’язує одного кандидата з опублікованої npm
специфікації, довіреного `package_ref`, зібраного вибраним harness `workflow_ref`,
HTTPS URL tarball із SHA-256 або tarball artifact з іншого запуску GitHub Actions,
завантажує його як `package-under-test`, а потім повторно використовує Docker
release/E2E scheduler з цим tarball замість повторного пакування checkout workflow.
Профілі покривають smoke, package, product, full і custom вибори Docker lane.
Профіль `package` використовує офлайн-покриття plugin, щоб валідація
опублікованого пакета не залежала від live-доступності ClawHub. Необов’язковий
Telegram lane повторно використовує artifact `package-under-test` у workflow
`NPM Telegram Beta E2E`, а шлях опублікованої npm специфікації зберігається для
самостійних dispatch.

## Приймальне тестування пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей
інстальований пакет OpenClaw як продукт?». Це відрізняється від звичайного CI:
звичайний CI перевіряє дерево джерел, тоді як package acceptance перевіряє один
tarball через той самий Docker E2E harness, який користувачі задіюють після
інсталяції або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата
   пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує джерело, workflow ref, package ref,
   версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow
   завантажує цей artifact, перевіряє інвентар tarball, готує Docker images
   package-digest за потреби та запускає вибрані Docker lanes проти цього пакета
   замість пакування checkout workflow. Коли профіль вибирає кілька цільових
   `docker_lanes`, повторно використовуваний workflow готує пакет і спільні images
   один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з
   унікальними artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він
   запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий
   artifact `package-under-test`, коли Package Acceptance розв’язав його;
   самостійний Telegram dispatch усе ще може встановити опубліковану npm
   специфікацію.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або
   необов’язковий Telegram lane завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  релізну версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте
  це для приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Resolver fetch-ить гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний
  з історії гілок репозиторію або релізного тегу, встановлює залежності у
  від’єднаному worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  artifacts, поширених назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код
workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який
пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти
старіші довірені вихідні коміти без запуску старої workflow-логіки.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні chunks Docker release-path з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker chunks релізного шляху покривають
перекривні package/update/plugin lanes, тоді як Package Acceptance зберігає
artifact-native proof для bundled-channel compat, offline plugin і Telegram
проти того самого розв’язаного tarball пакета.
Cross-OS release checks усе ще покривають OS-специфічні onboarding, installer і
поведінку platform; product-валідацію package/update слід починати з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений пакет може імпортувати browser-control override із сирого абсолютного
шляху Windows.

Package Acceptance має обмежені вікна сумісності зі спадщиною для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема
`2026.4.25-beta.*`, можуть використовувати шлях сумісності для відомих приватних
QA entries у `dist/postinstall-inventory.json`, які вказують на файли, пропущені
tarball; `doctor-switch` може пропустити підвипадок збереження
`gateway install --wrapper`, коли пакет не експонує цей flag; `update-channel-switch`
може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, отриманої з
tarball, і може логувати відсутній збережений `update.channel`; plugin smokes
можуть читати спадкові locations install-record або приймати відсутню
персистентність marketplace install-record; а `plugin-update` може дозволити
міграцію config metadata, усе ще вимагаючи, щоб install record і поведінка
no-reinstall залишалися незмінними. Опублікований пакет `2026.4.26` також може
попереджати про файли локальних build metadata stamp, які вже були поставлені.
Пізніші пакети мають відповідати сучасним контрактам; ті самі умови призводять до
failure замість warning або skip.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім
перегляньте дочірній запуск `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Надавайте перевагу перезапуску невдалого package profile
або точних Docker lanes замість перезапуску повної release validation.

QA Lab має dedicated CI lanes поза основним smart-scoped workflow. Workflow
`Parity gate` запускається за відповідних змін у PR і ручного dispatch; він
збирає приватний QA runtime і порівнює agentic packs mock GPT-5.5 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch;
він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord
lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`,
а Telegram/Discord використовують Convex leases. Matrix використовує `--profile fast`
для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out
CLI це підтримує. Стандартне значення CLI і ручний workflow input залишаються
`all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage
на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.
`OpenClaw Release Checks` також запускає реліз-критичні QA Lab lanes перед
схваленням релізу; його QA parity gate запускає candidate і baseline packs як
паралельні lane jobs, а потім завантажує обидва artifacts у невелике report job
для фінального parity comparison.
Не ставте шлях landing для PR за `Parity gate`, якщо зміна насправді не торкається
QA runtime, model-pack parity або surface, яким володіє parity workflow.
Для звичайних виправлень channel, config, docs або unit-test розглядайте це як
необов’язковий сигнал і дотримуйтеся evidence зі scoped CI/check.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для супроводжувачів для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що злитий PR справді об’єднано, а кожен дублікат має або спільне посилання на issue, або перетин змінених hunks.

Робочий процес `CodeQL` навмисно є вузьким первинним сканером безпеки, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код робочих процесів Actions, а також найризикованіші поверхні JavaScript/TypeScript для автентифікації, секретів, пісочниці, cron і gateway за допомогою високоточних security-запитів.

Робочий процес `CodeQL Android Critical Security` — це запланований Android-шард безпеки. Він вручну збирає Android-застосунок для CodeQL на найменшому label раннера Blacksmith Linux, який приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це щотижневий/ручний macOS-шард безпеки. Він вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантажуваного SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним стандартним workflow, бо збірка macOS домінує за часом виконання навіть коли проходить чисто.

Робочий процес `CodeQL Critical Quality` — це відповідний небезпековий шард. Він запускає лише JavaScript/TypeScript quality-запити з severity error, не пов’язані з безпекою, на вузьких цінних поверхнях. Його baseline job сканує ті самі поверхні автентифікації, секретів, пісочниці, cron і gateway, що й workflow безпеки. Job межі конфігурації сканує схему конфігурації, міграцію, нормалізацію та IO-контракти в окремій категорії `/codeql-critical-quality/config-boundary`. Job межі виконання gateway сканує схеми протоколу gateway і контракти серверних методів в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Job межі plugin сканує контракти loader, registry, public-surface і точок входу Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від безпеки, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python, UI і вбудованих plugin слід додавати назад лише як окремо scoped або sharded подальшу роботу після того, як вузькі профілі матимуть стабільний runtime і signal.

Робочий процес `Docs Agent` — це подієво керована лінія обслуговування Codex для підтримання наявної документації у відповідності з нещодавно злитими змінами. Він не має чистого розкладу: успішний CI run після non-bot push у `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже змістився або коли інший непропущений запуск Docs Agent було створено за останню годину. Під час роботи він переглядає діапазон комітів від попереднього source SHA непропущеного Docs Agent до поточного `main`, тому один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI run після non-bot push у `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується в цей UTC-день. Ручний dispatch обходить цей щоденний activity gate. Лінія будує grouped Vitest performance report для повного набору, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких refactor, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline кількість passing tests. Якщо baseline має failing tests, Codex може виправляти лише очевидні збої, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push потрапляє в репозиторій, лінія rebases validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд job

| Job                              | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені scopes, змінені extensions і будує CI manifest    | Завжди для non-draft pushes і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft pushes і PR   |
| `security-dependency-audit`      | Production lockfile audit без залежностей проти npm advisories                               | Завжди для non-draft pushes і PR   |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts          | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Зміни, релевантні Node             |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin по extension suite                                      | Зміни, релевантні Node             |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                     | Зміни, релевантні Node             |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node        |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні Node             |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні Node             |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для releases    |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                      | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для skills на основі Python                                                    | Зміни, релевантні Python-skill     |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Зміни, релевантні Windows          |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні macOS            |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                            | Main CI success або manual dispatch |

Manual CI dispatches запускають той самий граф job, що й звичайний CI, але примусово вмикають кожну scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і Control UI i18n. Ручні запуски використовують унікальну concurrency group, щоб full suite для release-candidate не скасовувався іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу запустити цей граф проти branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Jobs упорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не очікуючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build готовий.
4. Після цього розгалужуються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення зміненої області дії та змушує попередній маніфест
діяти так, ніби кожна область з визначеною областю дії змінилася.
Редагування CI workflow перевіряють граф Node CI і linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються прив’язаними до змін у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-тестів і вузькі редагування допоміжних засобів/маршрутизації тестів контракту Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності Node 22, контрактів каналів, повних шардів core, шардів вбудованих Plugin і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або допоміжних засобів, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами runner для npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни вихідного коду, Plugin, install-smoke і зміни лише тестів залишаються на Linux-лініях Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих Plugin, а також поверхонь core Plugin/канал/Gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованих Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого extension і запускає обмежений Docker-профіль вбудованих Plugin із сукупним тайм-аутом команди 240 секунд, причому Docker run кожного сценарію обмежений окремо. Повний шлях зберігає QR package install і installer Docker/update-покриття для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull request-ів, які справді зачіпають поверхні installer/package/Docker. Push-и в `main`, включно з merge commit-ами, не примушують запускати повний шлях; коли логіка changed-scope запитувала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release validation. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть увімкнути його, але pull request-и та push-и в `main` його не запускають. QR і installer Docker tests зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool, що дорівнює 10, за допомогою `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-pool, чутливого до provider, що дорівнює 10, за допомогою `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Ліміти важких ліній за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service лінії не перевантажували Docker, тоді як легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні ліміти, усе ще може стартувати з порожнього pool, а потім виконується самостійно, доки не звільнить ємність. Старт ліній за замовчуванням рознесено на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначте це за допомогою `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або іншого значення в мілісекундах. Локальний aggregate виконує preflight для Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ліній, зберігає timings ліній для впорядкування longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, і кожна лінія має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail лінії використовують жорсткіші per-lane ліміти. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only лініями, такими як `install-e2e`, і розділеними лініями оновлення вбудованих компонентів, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу лінію. Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне, потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає та публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у багаторазовий Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance-логіка могла перевіряти старіші довірені commits без checkout старого workflow-коду. Release checks запускають custom Package Acceptance delta для цільового ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA проти resolved tarball. Release-path Docker suite запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька ліній через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage цього вимагає, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для ручних повторних запусків, але release workflow використовує split chunks, щоб installer E2E і sweeps встановлення/видалення вбудованих Plugin не домінували на critical path. Alias лінії `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість серійної all-in-one лінії `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених images замість chunk jobs, що обмежує debugging невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана лінія є live Docker lane, targeted job локально збирає live-test image для цього повторного запуску. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб невдала лінія могла повторно використати точний package і images з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матриця bundled update розділена за update target, щоб повторювані npm update і doctor repair passes могли shard-итися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і sweeps встановлення/видалення вбудованих Plugin могли виконуватися паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних ліній на паралельні jobs після одного спільного кроку підготовки package/image, а лінії bundled-channel update повторюють спробу один раз у разі тимчасових npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область дії платформ CI: core production changes запускають core prod і core test typecheck плюс core lint/guards, core test-only changes запускають лише core test typecheck плюс core lint, extension production changes запускають extension prod і extension test typecheck плюс extension lint, а extension test-only changes запускають extension test typecheck плюс extension lint. Зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, оскільки extensions залежать від цих core contracts, але Vitest extension sweeps є явною тестовою роботою. Release metadata-only version bumps запускають цільові version/config/root-dependency checks. Невідомі root/config changes fail safe до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування вихідного коду віддають перевагу явним mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із explicit mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt маршрутизуються через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна shared default впала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки harness-wide, що cheap mapped set не є надійним proxy.

Для валідації Testbox запускайте команди з кореня репозиторію та віддавайте перевагу свіжому прогрітому боксу для широкого підтвердження. Перш ніж витрачати повільний gate на бокс, який повторно використали, строк дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині бокса. Перевірка працездатності швидко завершується з помилкою, коли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR. Зупиніть цей бокс і прогрійте свіжий замість налагодження збою продуктового тесту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity.

Ручні CI-диспетчеризації запускають `checks-node-compat-node22` як покриття сумісності реліз-кандидата. Звичайні pull requests і push до `main` пропускають цю лінію та тримають матрицю зосередженою на тестових/канальних лініях Node 24.

Найповільніші сімейства тестів Node розділено або збалансовано, щоб кожна job лишалася невеликою без надмірного резервування runner-ів: контракти каналів виконуються як три зважені shards, тести bundled plugin балансуються між шістьма extension workers, малі core unit lanes поєднуються в пари, auto-reply запускається як чотири збалансовані workers із розділенням піддерева reply на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування зібраних artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують власні dedicated Vitest configs замість спільного plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Широка agents lane використовує спільний Vitest file-parallel scheduler, бо вона обмежена імпортом/плануванням, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів хвостом. Include-pattern shards записують timing entries з використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині однієї job. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі check names як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із SMS/call-log BuildConfig flags, водночас уникаючи дублювання debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було superseded.
Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де queue time для 32-vCPU коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
