---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, які не проходять
summary: Граф завдань CI, контрольні перевірки за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-28T23:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a8e17713281b2cf14e7c91663f8f57c0370e5355aa21804f5b78525726bfa7
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для реліз-кандидатів або широкої перевірки.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний commit SHA, запускає
ручний workflow `CI` з цією ціллю та запускає `OpenClaw Release Checks`
для install smoke, package acceptance, Docker release-path suites, live/E2E,
OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запускати
після публікації workflow `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета. `release_profile=minimum|stable|full` керує широтою
live/provider, яку передають у release checks: `minimum` залишає найшвидші
критичні для релізу lanes OpenAI/core, `stable` додає стабільний набір
provider/backend, а `full` запускає широку рекомендаційну матрицю
provider/media. Парасольковий workflow записує id запущених дочірніх запусків,
а фінальне завдання `Verify full validation` повторно перевіряє поточні
висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного
дочірнього запуску. Якщо дочірній workflow перезапущено і він став зеленим,
перезапустіть лише батьківське завдання перевірки, щоб оновити результат
парасолькового workflow і підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише
для звичайного повного дочірнього CI, `release-checks` для кожного дочірнього
release, або вужчу release group: `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольковому
workflow. Це утримує перезапуск невдалої release box у межах після точкового
виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`,
але запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs`
замість одного послідовного завдання. Це зберігає те саме файлове покриття,
водночас спрощуючи перезапуск і діагностику повільних збоїв live provider.
Агреговані назви shard `native-live-extensions-o-z`,
`native-live-extensions-media` і `native-live-extensions-media-music`
залишаються чинними для ручних одноразових перезапусків.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
перетворити вибраний ref на tarball `release-package-under-test`, а потім
передає цей артефакт і в Docker workflow release-path live/E2E, і в shard
package acceptance. Це зберігає однакові байти пакета між release boxes і
уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це побічний workflow для перевірки артефакта пакета без
блокування release workflow. Він визначає одного кандидата з опублікованої npm
spec, довіреного `package_ref`, зібраного з вибраним harness `workflow_ref`,
HTTPS tarball URL із SHA-256 або tarball artifact з іншого запуску GitHub Actions,
завантажує його як `package-under-test`, а потім повторно використовує
планувальник Docker release/E2E з цим tarball замість повторного пакування
checkout workflow. Профілі охоплюють smoke, package, product, full і custom
вибори Docker lane. Профіль `package` використовує offline plugin coverage, щоб
перевірка опублікованого пакета не залежала від доступності live ClawHub.
Необов’язковий Telegram lane повторно використовує артефакт
`package-under-test` у workflow `NPM Telegram Beta E2E`, зберігаючи шлях
опублікованої npm spec для автономних запусків.

## Приймальне тестування пакета

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей
інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI:
звичайний CI перевіряє дерево джерел, тоді як package acceptance перевіряє один
tarball через той самий Docker E2E harness, який користувачі проходять після
встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата
   пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`,
   записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує
   обидва як артефакт `package-under-test` і виводить джерело, workflow ref,
   package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний
   workflow завантажує цей артефакт, перевіряє інвентар tarball, готує Docker
   images package-digest за потреби та запускає вибрані Docker lanes проти
   цього пакета замість пакування checkout workflow. Коли профіль вибирає
   кілька цільових `docker_lanes`, повторно використовуваний workflow готує
   пакет і спільні images один раз, а потім розгортає ці lanes як паралельні
   цільові Docker jobs з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він
   запускається, коли `telegram_mode` не є `none`, і встановлює той самий
   артефакт `package-under-test`, коли Package Acceptance визначив його;
   автономний Telegram dispatch усе ще може встановити опубліковану npm spec.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker
   acceptance або необов’язковий Telegram lane завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте
  це для acceptance опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний commit SHA `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний
  з історії гілок репозиторію або release tag, встановлює залежності у
  detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` є необов’язковим, але його варто надати для
  зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/harness, який запускає тест. `package_ref` — це source commit,
який пакують, коли `source=ref`. Це дає поточному test harness змогу
перевіряти старіші довірені source commits без запуску старої логіки workflow.

Профілі відповідають Docker coverage:

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
`telegram_mode=mock-openai`. Docker chunks release-path покривають lanes
package/update/plugin, що перетинаються, тоді як Package Acceptance зберігає
artifact-native доказ bundled-channel compat, offline plugin і Telegram проти
того самого визначеного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; перевірку продукту package/update слід починати з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений пакет може імпортувати browser-control override з необробленого
абсолютного Windows path.

Package Acceptance має обмежені вікна legacy-compatibility для вже
опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема
`2026.4.25-beta.*`, можуть використовувати compatibility path для відомих
приватних записів QA у `dist/postinstall-inventory.json`, які вказують на
файли, пропущені в tarball, `doctor-switch` може пропустити підвипадок
постійного збереження `gateway install --wrapper`, коли пакет не відкриває цей
flag, `update-channel-switch` може вилучити відсутні `pnpm.patchedDependencies`
з tarball-derived fake git fixture і може логувати відсутній збережений
`update.channel`, plugin smokes можуть читати застарілі розташування install-record
або приймати відсутнє постійне збереження marketplace install-record, а
`plugin-update` може дозволяти міграцію config metadata, водночас усе ще
вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.
Опублікований пакет `2026.4.26` також може попереджати про локальні файли stamp
build metadata, які вже були випущені. Пізніші пакети повинні відповідати
сучасним контрактам; ті самі умови завершуються помилкою замість попередження
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

Під час налагодження невдалого запуску package acceptance починайте з підсумку
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім
перегляньте дочірній запуск `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Надавайте перевагу перезапуску невдалого package
profile або точних Docker lanes замість повторного запуску full release validation.

QA Lab має dedicated CI lanes поза основним smart-scoped workflow. Workflow
`Parity gate` запускається на відповідних PR changes і manual dispatch; він
збирає приватний QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час
manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live
Telegram і Discord lanes як parallel jobs. Live jobs використовують середовище
`qa-live-shared`, а Telegram/Discord використовують Convex leases. Matrix
використовує `--profile fast` для scheduled і release gates, додаючи
`--fail-fast` лише тоді, коли checked-out CLI це підтримує. CLI default і
manual workflow input залишаються `all`; manual `matrix_profile=all`
dispatch завжди ділить full Matrix coverage на shards `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу QA Lab lanes перед схваленням релізу; його QA
parity gate запускає candidate і baseline packs як parallel lane jobs, потім
завантажує обидва artifacts у невелике report job для фінального parity comparison.
Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається
QA runtime, model-pack parity або surface, яким володіє parity workflow.
Для звичайних виправлень channel, config, docs або unit-test розглядайте його
як необов’язковий сигнал і спирайтеся на scoped CI/check evidence.

Робочий процес `Duplicate PRs After Merge` є ручним робочим процесом супроводжувача для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злитий PR справді об’єднано, а кожен дублікат має або спільну пов’язану проблему, або перетин змінених фрагментів.

Робочий процес `CodeQL` навмисно є вузьким першим проходом сканера безпеки, а не повним скануванням репозиторію. Щоденні та ручні запуски сканують код робочих процесів Actions, а також найризикованіші поверхні JavaScript/TypeScript для автентифікації, секретів, sandbox, cron і gateway за допомогою високоточних запитів безпеки. Завдання channel-runtime-boundary окремо сканує контракти реалізації основних каналів, а також середовище виконання plugin каналу, gateway, Plugin SDK, секрети та точки аудиту в категорії `/codeql-critical-security/channel-runtime-boundary`, щоб сигнал безпеки каналів міг масштабуватися без розширення базової категорії JS/TS.

Робочий процес `CodeQL Android Critical Security` є запланованим Android-шардом безпеки. Він вручну збирає Android-застосунок для CodeQL на найменшій мітці раннера Blacksmith Linux, прийнятій workflow sanity, і завантажує результати в категорії `/codeql-critical-security/android`.

Робочий процес `CodeQL macOS Critical Security` є щотижневим/ручним macOS-шардом безпеки. Він вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати в категорії `/codeql-critical-security/macos`. Тримайте його поза щоденним робочим процесом за замовчуванням, тому що збірка macOS домінує в часі виконання навіть коли все чисто.

Робочий процес `CodeQL Critical Quality` є відповідним шардом не для безпеки. Він запускає лише запити якості JavaScript/TypeScript із серйозністю помилки та без безпекового фокуса для вузьких високовартісних поверхонь. Його базове завдання сканує ту саму поверхню автентифікації, секретів, sandbox, cron і gateway, що й робочий процес безпеки. Завдання config-boundary сканує схему конфігурації, міграцію, нормалізацію та IO-контракти в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує схеми протоколу gateway і контракти серверних методів в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує контракти реалізації основних каналів в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує виконання команд, диспетчеризацію моделей/провайдерів, диспетчеризацію й черги auto-reply, а також контракти середовища виконання ACP control-plane в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання plugin-boundary сканує контракти loader, registry, public-surface і точок входу Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте цей робочий процес окремо від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python, UI і вбудованих plugin слід додавати назад лише як обмежену або шардовану подальшу роботу після того, як вузькі профілі матимуть стабільний час виконання й сигнал.

Робочий процес `Docs Agent` є подієво-керованою смугою супроводу Codex для підтримання наявної документації у відповідності з нещодавно злитими змінами. Він не має чистого розкладу: успішний запуск CI для non-bot push на `main` може його ініціювати, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного вихідного SHA Docs Agent до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з часу останнього проходу документації.

Робочий процес `Test Performance Agent` є подієво-керованою смугою супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний запуск CI для non-bot push на `main` може його ініціювати, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний шлюз активності. Смуга створює згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору та відхиляє зміни, що зменшують базову кількість успішних тестів. Якщо базова лінія має тести з помилками, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед тим, як будь-що буде закомічено. Коли `main` просувається до того, як bot push потрапить у репозиторій, смуга перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати таку саму safety posture drop-sudo, як і docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extension і будує маніфест CI     | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                 | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні до Node          |
| `checks-fast-core`               | Швидкі смуги коректності Linux, як-от перевірки bundled/plugin-contract/protocol              | Зміни, релевантні до Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні до Node          |
| `checks-node-extensions`         | Повні шарди тестів вбудованих plugin в усьому наборі extension                                | Зміни, релевантні до Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, за винятком смуг каналів, bundled, contract і extension           | Зміни, релевантні до Node          |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні до Node          |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch      | Зміни, релевантні до Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні до Node          |
| `checks`                         | Верифікатор для built-artifact тестів каналів                                                 | Зміни, релевантні до Node          |
| `checks-node-compat-node22`      | Смуга збірки та smoke для сумісності з Node 22                                                | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні до Python-skill  |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів і спільні регресії runtime import specifier      | Зміни, релевантні до Windows       |
| `macos-node`                     | Смуга тестів TypeScript для macOS із використанням спільних built artifacts                   | Зміни, релевантні до macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для macOS-застосунку                                               | Зміни, релевантні до macOS         |
| `android`                        | Android unit tests для обох flavor плюс одна debug APK build                                  | Зміни, релевантні до Android       |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх Main CI або ручний dispatch  |

Ручні CI dispatch запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну обмежену смугу: шарди Linux Node, шарди вбудованих plugin, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n. Ручні запуски використовують унікальну групу concurrency, щоб повний набір release-candidate не скасовувався іншим push або PR run на тому самому ref. Необов’язковий ввід `target_ref` дозволяє довіреному виклику запускати цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих завдань artifacts і platform matrix.
3. `build-artifacts` перекривається зі швидкими Linux-смугами, щоб downstream consumers могли стартувати одразу після готовності спільної збірки.
4. Після цього розгалужуються важчі platform і runtime смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест
діяти так, ніби кожна scoped-область змінилася.
Зміни робочих процесів CI перевіряють граф Node CI та linting робочих процесів, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються прив'язаними до змін платформного вихідного коду.
Зміни лише маршрутизації CI, вибрані дешеві зміни core-test fixture, а також вузькі зміни helper/test-routing для Plugin contract використовують швидкий Node-only шлях маніфесту: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core shards, bundled-plugin shards і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє напряму.
Windows Node checks обмежені специфічними для Windows обгортками процесів/шляхів, helper-ами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями робочих процесів CI, які виконують цю лінію; непов'язані зміни вихідного коду, Plugin, install-smoke і test-only залишаються на Linux Node lanes, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий робочий процес `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/package, змін пакетів/маніфестів вбудованих Plugin, а також core Plugin/channel/gateway/Plugin SDK поверхонь, які перевіряють Docker smoke jobs. Зміни тільки вихідного коду вбудованих Plugin, test-only edits і docs-only edits не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення і запускає обмежений bundled-plugin Docker profile під 240-секундним агрегованим timeout команди, при цьому Docker run кожного сценарію окремо обмежений. Повний шлях зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull request-ів, які справді зачіпають installer/package/Docker surfaces. Push-и в `main`, включно з merge commit-ами, не примушують повний шлях; коли changed-scope logic запросила б повне покриття під час push, робочий процес зберігає fast Docker smoke і залишає full install smoke для nightly або release validation. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за nightly schedule і з release checks workflow, а manual `install-smoke` dispatches можуть увімкнути його, але pull request-и та push-и в `main` його не запускають. QR і installer Docker tests зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний live-test image, пакує OpenClaw один раз як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для installer/update/plugin-dependency lanes і functional image, який встановлює той самий tarball у `/app` для normal functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy lane caps за замовчуванням мають значення `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, тоді як легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за effective caps, усе одно може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникати локальних Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate preflights Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає timings lanes для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перегляду scheduler. За замовчуванням він припиняє планування нових pooled lanes після першої помилки, і кожна lane має fallback timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, як-от `install-e2e`, і split bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну failed lane. Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне, потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає і push-ить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Робочий процес `Package Acceptance` — це високорівневий package gate: він визначає candidate з npm, trusted `package_ref`, HTTPS tarball плюс SHA-256 або попередній workflow artifact, а потім передає цей єдиний artifact `package-under-test` у reusable Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші trusted commits без checkout старого workflow code. Release checks запускають custom Package Acceptance delta для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA щодо resolved tarball. Release-path Docker suite запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk витягував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI вбудовується в `plugins-runtime-services`, коли full release-path coverage цього вимагає, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Legacy aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для manual reruns, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували в critical path. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*`, а не serial all-in-one lane `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package та images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Scheduled live/E2E workflow щодня запускає full release-path Docker suite. Bundled update matrix розділена за update target, щоб повторні npm update і doctor repair passes могли shard-итися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` залишається доступним для manual one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли працювати паралельно. Targeted `docker_lanes` dispatches також розділяють кілька вибраних lanes на parallel jobs після одного спільного package/image preparation step, а bundled-channel update lanes повторюють спробу один раз для transient npm network failures.

Локальна changed-lane logic міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо architecture boundaries, ніж широка CI platform scope: core production changes запускають core prod і core test typecheck плюс core lint/guards, core test-only changes запускають лише core test typecheck плюс core lint, extension production changes запускають extension prod і extension test typecheck плюс extension lint, а extension test-only changes запускають extension test typecheck плюс extension lint. Зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, оскільки extensions залежать від цих core contracts, але Vitest extension sweeps є явною test work. Release metadata-only version bumps запускають targeted version/config/root-dependency checks. Unknown root/config changes fail safe до всіх check lanes.
Локальна changed-test routing міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: direct test edits запускають самі себе,
source edits віддають перевагу explicit mappings, потім sibling tests і import-graph
dependents. Shared group-room delivery config — один з explicit mappings:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб shared default change падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли change
настільки harness-wide, що cheap mapped set не є надійним proxy.

Для перевірки в Testbox запускайте з кореня репозиторію й віддавайте перевагу свіжому прогрітому боксу для широкого підтвердження. Перш ніж витрачати повільний gate на бокс, який повторно використовувався, прострочився або щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині боксу. Перевірка справності швидко завершується помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR. Зупиніть цей бокс і прогрійте свіжий замість налагодження збою тестів продукту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності.

Ручні запускі CI виконують `checks-node-compat-node22` як покриття сумісності реліз-кандидата. Звичайні pull request і пуші в `main` пропускають цю лінію та тримають матрицю зосередженою на тестових/канальних лініях Node 24.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання лишалося малим без надмірного резервування раннерів: контрактні перевірки каналів виконуються як три зважені шарди, тести вбудованих Plugin балансовані між шістьма робітниками розширень, малі лінії core unit поєднані парами, auto-reply виконується як чотири збалансовані робітники з піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing, а agentic-конфігурації Gateway/Plugin розподілені між наявними source-only agentic завданнями Node замість очікування на зібрані артефакти. Широкі browser, QA, media і різні тести Plugin використовують власні виділені конфіги Vitest замість спільного всеохопного Plugin-набору. Завдання шардів розширень запускають до двох груп конфігів Plugin одночасно з одним робітником Vitest на групу та більшим heap Node, щоб import-heavy пакети Plugin не створювали додаткових завдань CI. Широка лінія agents використовує спільний файлово-паралельний планувальник Vitest, бо вона домінується імпортом/плануванням, а не одним повільним тестовим файлом. `runtime-config` виконується з infra core-runtime shard, щоб спільний runtime shard не відповідав за хвіст. Include-pattern шарди записують записи таймінгів із назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий конфіг від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює архітектуру runtime topology від покриття gateway watch; boundary guard shard запускає свої малі незалежні guard паралельно всередині одного завдання. Gateway watch, тести каналів і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі verifier jobs, але уникаючи двох додаткових робітників Blacksmith і другої черги споживача артефактів.
Android CI виконує і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test лінія все одно компілює цей flavor з BuildConfig flags для SMS/call-log, уникаючи дублювання завдання пакування debug APK на кожному Android-релевантному пуші.
GitHub може позначати замінені завдання як `cancelled`, коли новіший пуш потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був замінений.
Автоматичний ключ concurrency CI версійований (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні запуски full-suite використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Раннери

| Раннер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled перевірки, шардовані channel contract перевірки, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо CPU-чутливим, щоб 8 vCPU коштували дорожче, ніж зекономили; install-smoke Docker builds, де час черги 32-vCPU коштував дорожче, ніж зекономив                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
