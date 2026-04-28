---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірки GitHub Actions, які завершуються помилкою
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-28T20:11:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2d0e70d04530bd524e5556b3e2e3349be5f109a61ec5044e907d4ed19379eb
    source_path: ci.md
    workflow: 16
---

CI запускається для кожного push у `main` і кожного pull request. Вона використовує розумне звуження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне звуження області й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний парасольковий робочий процес для «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає
ручний робочий процес `CI` з цією ціллю та запускає `OpenClaw Release Checks`
для перевірки встановлення, приймання пакета, наборів Docker для релізного шляху, live/E2E,
OpenWebUI, паритету QA Lab, Matrix і напрямів Telegram. Він також може запускати
післяпублікаційний робочий процес `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета. `release_profile=minimum|stable|full` керує шириною live/provider,
яка передається до перевірок релізу: `minimum` залишає найшвидші критичні для релізу
напрями OpenAI/core, `stable` додає стабільний набір provider/backend, а
`full` запускає широку консультативну матрицю provider/media. Парасольковий процес записує
ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє
поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього
запуску. Якщо дочірній робочий процес перезапущено і він став зеленим, перезапустіть лише батьківське
завдання перевірки, щоб оновити результат парасолькового процесу та підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для
звичайної повної дочірньої CI, `release-checks` для кожного дочірнього релізного процесу або вужчу
групу релізу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` або `npm-telegram` у парасольковому процесі. Це утримує перезапуск
невдалого релізного середовища в межах після сфокусованого виправлення.

Дочірній live/E2E релізу зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені шарди audio/video для media та
відфільтровані за provider шарди music) через `scripts/test-live-shard.mjs` замість
одного послідовного завдання. Це зберігає те саме файлове покриття, водночас полегшуючи перезапуск
і діагностику повільних збоїв live provider. Агреговані назви шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних
одноразових перезапусків.

`OpenClaw Release Checks` використовує довірене посилання робочого процесу, щоб один раз розв’язати вибране
посилання в tarball `release-package-under-test`, а потім передає цей артефакт
і до Docker-робочого процесу live/E2E релізного шляху, і до шарда приймання пакета.
Це зберігає байти пакета узгодженими між релізними середовищами й уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це побічний робочий процес для валідації артефакта пакета
без блокування релізного робочого процесу. Він розв’язує одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного вибраним
каркасом `workflow_ref`, HTTPS URL tarball із SHA-256 або артефакта tarball
з іншого запуску GitHub Actions, завантажує його як `package-under-test`, а потім повторно використовує
планувальник Docker release/E2E з цим tarball замість повторного пакування
checkout робочого процесу. Профілі покривають smoke, package, product, full і custom
вибори напрямів Docker. Профіль `package` використовує офлайн-покриття Plugin, щоб
валідація опублікованого пакета не залежала від доступності live ClawHub. Опційний
напрям Telegram повторно використовує артефакт
`package-under-test` у робочому процесі `NPM Telegram Beta E2E`, а шлях
опублікованої npm-специфікації збережено для окремих запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей встановлюваний пакет OpenClaw
як продукт?» Це відрізняється від звичайної CI: звичайна CI валідує
дерево вихідного коду, тоді як приймання пакета валідує один tarball через той самий
каркас Docker E2E, який користувачі запускають після встановлення або оновлення.

Робочий процес має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт
   `package-under-test` і виводить джерело, посилання робочого процесу, посилання пакета,
   версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний робочий процес завантажує
   цей артефакт, валідує інвентар tarball, готує Docker-образи package-digest
   за потреби та запускає вибрані напрями Docker проти цього
   пакета замість пакування checkout робочого процесу. Коли профіль вибирає
   кілька цільових `docker_lanes`, повторно використовуваний робочий процес готує пакет
   і спільні образи один раз, а потім розгортає ці напрями як паралельні цільові Docker
   завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли
   `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`,
   коли Package Acceptance розв’язав його; окремий запуск Telegram усе ще
   може встановити опубліковану npm-специфікацію.
4. `summary` завершує робочий процес помилкою, якщо розв’язання пакета, Docker acceptance або
   опційний напрям Telegram зазнали збою.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності у
  відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` опційний, але його слід надавати для
  зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код робочого процесу/каркаса, який виконує тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дозволяє поточному тестовому каркасу валідувати
старіші довірені коміти вихідного коду без запуску старої логіки робочого процесу.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні фрагменти Docker релізного шляху з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker-фрагменти релізного шляху
покривають перетин напрямів package/update/plugin, тоді як Package
Acceptance зберігає нативне для артефакта підтвердження bundled-channel compat, офлайн Plugin і
Telegram проти того самого розв’язаного package tarball.
Cross-OS перевірки релізу все ще покривають специфічну для ОС поведінку onboarding, installer і
platform; продуктову валідацію package/update слід починати з Package Acceptance. Windows-напрями
packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного
шляху Windows.

Package Acceptance має обмежені вікна сумісності зі спадковими версіями для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`,
можуть використовувати шлях сумісності для відомих приватних QA-записів у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball,
`doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`,
коли пакет не надає цей прапорець, `update-channel-switch` може обрізати
відсутні `pnpm.patchedDependencies` з похідної від tarball фальшивої git-фікстури та
може логувати відсутній збережений `update.channel`, smoke-перевірки Plugin можуть читати спадкові
розташування install-record або приймати відсутність збереження marketplace install-record,
а `plugin-update` може дозволити міграцію метаданих конфігурації, водночас усе ще
вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними. Опублікований
пакет `2026.4.26` також може попереджати про файли stamp метаданих локальної збірки,
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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`,
щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте
дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, логи напрямів, часові показники
фаз і команди перезапуску. Надавайте перевагу перезапуску невдалого профілю пакета або
точних Docker-напрямів замість перезапуску повної валідації релізу.

QA Lab має окремі CI-напрями поза основним робочим процесом із розумним звуженням області. Робочий процес
`Parity gate` запускається для відповідних змін PR і ручного запуску; він
збирає приватний QA runtime і порівнює агентні пакети mock GPT-5.5 та Opus 4.6.
Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і під час
ручного запуску; він розгортає mock parity gate, live-напрям Matrix, а також live
напрями Telegram і Discord як паралельні завдання. Live-завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують lease Convex. Matrix
використовує `--profile fast` для запланованих і релізних перевірок, додаючи `--fail-fast` лише
коли checked-out CLI це підтримує. Типове значення CLI і ручний ввід робочого процесу
залишаються `all`; ручний запуск `matrix_profile=all`
завжди ділить повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу QA Lab напрями перед схваленням релізу; його QA parity
gate запускає кандидатні та baseline пакети як паралельні завдання напрямів, потім завантажує
обидва артефакти в невелике завдання звіту для фінального порівняння паритету.
Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не
торкається QA runtime, паритету model-pack або поверхні, якою володіє робочий процес паритету.
Для звичайних виправлень channel, config, docs або unit-test розглядайте це як опційний
сигнал і дотримуйтеся scoped CI/check доказів.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для супровідників для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що злитий PR справді об’єднано, а кожен дублікат має або спільну згадану issue, або перетин змінених hunks.

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним обходом репозиторію. Щоденні та ручні запуски сканують код workflow Actions, а також найризикованіші поверхні JavaScript/TypeScript для auth, secrets, sandbox, cron і gateway за допомогою високоточних security-запитів. Завдання channel-runtime-boundary окремо сканує контракти реалізації основних каналів разом із runtime channel plugin, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії JS/TS.

Робочий процес `CodeQL Android Critical Security` — це запланований Android-шард безпеки. Він вручну збирає Android-застосунок для CodeQL на найменшій мітці Blacksmith Linux runner, яку приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` — це щотижневий/ручний macOS-шард безпеки. Він вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантажуваного SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним стандартним workflow, бо збірка macOS домінує за часом виконання навіть у чистому стані.

Робочий процес `CodeQL Critical Quality` — це відповідний небезпековий шард. Він запускає лише JavaScript/TypeScript quality-запити severity error, не пов’язані з безпекою, на вузьких цінних поверхнях. Його базове завдання сканує ту саму поверхню auth, secrets, sandbox, cron і gateway, що й security workflow. Завдання config-boundary сканує схему конфігурації, міграцію, нормалізацію та IO-контракти в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує схеми gateway protocol і контракти server methods в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує контракти реалізації основних каналів в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання plugin-boundary сканує контракти loader, registry, public-surface і entrypoint Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від security, щоб quality-знахідки можна було планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу. Розширення CodeQL для Swift, Python, UI і bundled-plugin слід додавати назад лише як scoped або sharded подальшу роботу після того, як вузькі профілі матимуть стабільний runtime і сигнал.

Робочий процес `Docs Agent` — це подієво керований Codex maintenance lane для підтримання наявної документації в узгодженому стані з нещодавно злитими змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший non-skipped запуск Docs Agent було створено протягом останньої години. Під час запуску він переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

Робочий процес `Test Performance Agent` — це подієво керований Codex maintenance lane для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC-дня. Manual dispatch обходить цей daily activity gate. Lane формує grouped Vitest performance report для повного набору, дозволяє Codex робити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline passing test count. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде злитий, lane перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, changed scopes, changed extensions і формує CI manifest             | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення private key і workflow audit через `zizmor`                                        | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Dependency-free audit production lockfile за npm advisories                                  | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft pushes і PRs  |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Node-relevant зміни                |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-relevant зміни                |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-relevant зміни                |
| `checks-node-extensions`         | Повні bundled-plugin test shards для extension suite                                         | Node-relevant зміни                |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                     | Node-relevant зміни                |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Node-relevant зміни           |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-relevant зміни                |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-relevant зміни                |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant зміни                |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Python-skill-relevant зміни        |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-relevant зміни             |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | macOS-relevant зміни               |
| `macos-swift`                    | Swift lint, build і tests для macOS-застосунку                                               | macOS-relevant зміни               |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Android-relevant зміни             |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success або manual dispatch |

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожен scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android і Control UI i18n. Manual runs використовують унікальну concurrency group, щоб повний набір release-candidate не скасовувався іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу запускати цей graph проти branch, tag або full commit SHA, використовуючи workflow file із вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест
діяти так, ніби кожна scoped-область змінилася.
Редагування CI-робочих процесів перевіряють граф Node CI та лінтинг робочих процесів, але самі по собі не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні lane залишаються scoped до змін у платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-тестів і вузькі редагування допоміжних засобів/маршрутизації тестів контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів bundled-plugin і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або допоміжними поверхнями, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node scoped до специфічних для Windows обгорток процесів/шляхів, допоміжних засобів npm/pnpm/UI runner, конфігурації менеджера пакетів і поверхонь CI-робочих процесів, які виконують цей lane; непов’язані зміни вихідного коду, plugin, install-smoke і лише тестові зміни залишаються на Linux Node lane, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий робочий процес `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін пакетів/маніфестів bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду bundled plugin, лише тестові редагування й редагування лише документації не резервують Docker worker. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним timeout команди 240 секунд, причому кожен Docker run сценарію обмежений окремо. Повний шлях зберігає встановлення QR package і Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call перевірок релізу та pull request, які справді торкаються поверхонь installer/package/Docker. Push у `main`, включно з merge commit, не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття під час push, робочий процес зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з робочого процесу перевірок релізу, а ручні dispatch `install-smoke` можуть увімкнути його, але pull request і push у `main` його не запускають. QR і Docker-тести інсталятора зберігають власні install-focused Dockerfile. Локальний `test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для lane інсталятора/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для lane нормальної функціональності. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожного lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lane з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool, що дорівнює 10, за допомогою `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool, що дорівнює 10, за допомогою `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких lane за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб lane npm install і multi-service не перевантажували Docker, тоді як легші lane все ще заповнюють доступні слоти. Один lane, важчий за ефективні обмеження, все одно може стартувати з порожнього pool, а потім виконується сам, доки не звільнить місткість. Запуски lane за замовчуванням рознесені на 2 секунди, щоб уникнути локальних штормів створення Docker daemon; перевизначте це за допомогою `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або іншого значення в мілісекундах. Локальний aggregate виконує preflight Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних lane, зберігає таймінги lane для впорядкування longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планувати нові pooled lane після першої помилки, і кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane використовують жорсткіші per-lane обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні lane планувальника, включно з release-only lane, такими як `install-e2e`, і розділеними lane bundled update, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити один невдалий lane. Повторно використовуваний робочий процес live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, kind образу, live image, lane і облікових даних потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт package з поточного run, або завантажує артефакт package з `package_artifact_run_id`; перевіряє inventory tarball; збирає і push bare/functional GHCR Docker E2E образи з тегом package digest через Docker layer cache Blacksmith, коли план потребує lane зі встановленим package; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість повторної збірки. Робочий процес `Package Acceptance` є високорівневим package gate: він визначає candidate з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього робочого процесу, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E робочий процес. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла перевіряти старіші довірені commit без checkout старого коду робочого процесу. Перевірки релізу запускають спеціальну дельту Package Acceptance для цільового ref: bundled-channel compat, offline plugin fixtures і Telegram package QA проти визначеного tarball. Docker-набір release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому kind образу та виконував кілька lane через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено до `plugins-runtime-services`, коли повне release-path покриття цього вимагає, і він зберігає окремий chunk `openwebui` лише для dispatch, що стосуються лише OpenWebUI. Застарілі назви aggregate chunk `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` все ще працюють для ручних повторних запусків, але релізний робочий процес використовує розділені chunk, щоб installer E2E і sweep встановлення/видалення bundled plugin не домінували в критичному шляху. Псевдонім lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lane. Chunk `bundled-channels` запускає розділені lane `bundled-channel-*` і `bundled-channel-update-*`, а не серійний all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з журналами lane, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями slow-lane і командами per-lane rerun. Input робочого процесу `docker_lanes` запускає вибрані lane проти підготовлених образів замість chunk jobs, що утримує налагодження failed-lane в межах одного targeted Docker job і готує, завантажує або повторно використовує артефакт package для цього run; якщо вибраний lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane команди GitHub rerun містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб failed lane міг повторно використати точні package і образи з невдалого run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для summary slow-lane і phase critical-path. Запланований робочий процес live/E2E щодня запускає повний release-path Docker suite. Bundled update matrix розділена за update target, щоб повторні npm update і doctor repair passes могли shard разом з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для ручних one-shot rerun, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але релізний робочий процес використовує розділені chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted dispatch `docker_lanes` також розділяє кілька вибраних lane на паралельні jobs після одного спільного етапу підготовки package/image, а bundled-channel update lane повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка platform scope CI: production-зміни core запускають core prod і core test typecheck плюс core lint/guards, зміни лише core test запускають лише core test typecheck плюс core lint, production-зміни extension запускають extension prod і extension test typecheck плюс extension lint, а зміни лише extension test запускають extension test typecheck плюс extension lint. Зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, тому що extensions залежать від цих core-контрактів, але Vitest extension sweeps є явною тестовою роботою. Version bump лише release metadata запускають targeted version/config/root-dependency checks. Невідомі root/config changes fail safe до всіх check lanes.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе,
редагування вихідного коду надають перевагу явним mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config є одним із явних mappings:
зміни у group visible-reply config, source reply delivery mode або
message-tool system prompt route через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна shared default завершувалася помилкою до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки harness-wide, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію й надавайте перевагу свіжому прогрітому боксу для
широкого підтвердження. Перш ніж витрачати повільний gate на бокс, який було повторно використано, строк дії якого минув або
який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині
бокса. Sanity-перевірка швидко завершується з помилкою, коли потрібні кореневі файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною
копією PR. Зупиніть цей бокс і прогрійте свіжий, замість того щоб налагоджувати
помилку продуктового тесту. Для PR з навмисними великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

Ручні CI-запуски виконують `checks-node-compat-node22` як покриття сумісності release candidate. Звичайні pull request-и та пуші в `main` пропускають цю lane й тримають матрицю зосередженою на тестових/channel lane для Node 24.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожна job залишалася невеликою без надмірного резервування runner-ів: channel-контракти запускаються як три зважені shard-и, тести bundled plugin балансуються між шістьма extension worker-ами, малі core unit lane поєднуються попарно, auto-reply запускається як чотири збалансовані worker-и з розділенням піддерева reply на shard-и agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin config-и розподіляються між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. Широкі browser-, QA-, media- та miscellaneous plugin-тести використовують свої виділені Vitest config-и замість спільного plugin catch-all. Extension shard jobs запускають до двох груп plugin config одночасно з одним Vitest worker на групу й більшим Node heap, щоб import-heavy plugin-пакети не створювали додаткових CI jobs. Широка agents lane використовує спільний файлово-паралельний планувальник Vitest, бо вона обмежена import/scheduling, а не одним повільним тестовим файлом. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів хвостом. Include-pattern shard-и записують timing entries з використанням імені CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від фільтрованого shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; shard boundary guard запускає свої малі незалежні guard-и паралельно всередині однієї job. Gateway watch, channel-тести та core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як легкі verifier jobs, водночас уникаючи двох додаткових Blacksmith worker-ів і другої artifact-consumer черги.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із BuildConfig-прапорцями SMS/call-log, уникаючи дубльованої job пакування debug APK на кожному Android-релевантному push.
GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Агрегатні shard-перевірки використовують `!cancelled() && always()`, тож вони все ще повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже був замінений.
Автоматичний CI concurrency key версійовано (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують runs, що вже виконуються.

## Runner-и

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled перевірки, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і агрегати, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-чутливим, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
- [Канали випусків](/uk/install/development-channels)
