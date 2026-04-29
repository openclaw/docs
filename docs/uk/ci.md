---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються помилкою
summary: Граф завдань CI, перевірки за областю охоплення та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-29T05:57:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d20b149b2b294646652ff412a8e1c611af812a33cc4b95acef6073370f7388
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Вона використовує розумне визначення області, щоб пропускати дорогі завдання, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення області та розгортають повний звичайний граф CI для реліз-кандидатів або широкої перевірки. Доріжки попередніх випусків плагінів лише для релізу залишаються вимкненими, якщо `Full Release Validation` не запускає CI з `full_release_validation=true`.

`Full Release Validation` — це ручний парасольковий workflow для «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks` для install smoke,
package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity,
Matrix і доріжок Telegram. Він також може запускати post-publish workflow
`NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.
`release_profile=minimum|stable|full` керує широтою live/provider, переданою до
перевірок релізу: `minimum` залишає найшвидші критичні для релізу доріжки
OpenAI/core, `stable` додає стабільний набір provider/backend, а `full` запускає
широку advisory-матрицю provider/media. Парасолька записує ідентифікатори
запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно
перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань
для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він став
зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат
парасольки й підсумок часу.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для
звичайного повного дочірнього CI, `release-checks` для кожного дочірнього релізного
workflow або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`,
`qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це утримує перезапуск
невдалого релізного блока в межах після цілеспрямованого виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані шарди (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider завдання
`native-live-src-gateway-profiles`, `native-live-src-gateway-backends`,
`native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video шарди та відфільтровані
за provider music шарди) через `scripts/test-live-shard.mjs` замість одного
послідовного завдання. Це зберігає те саме файлове покриття, водночас полегшуючи
перезапуск і діагностику повільних збоїв live provider. Агреговані назви шардів
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних одноразових
перезапусків.

Нативні live media шарди запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`;
media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте
Docker-backed live набори на звичайних раннерах Blacksmith, бо container jobs —
неправильне місце для запуску вкладених Docker-тестів.

Docker-backed шарди live model/backend використовують окремий спільний образ
`ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow
live release збирає й публікує цей образ один раз, після чого шарди Docker live
model, gateway, CLI backend, ACP bind і Codex harness запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source
Docker target, релізний запуск налаштовано неправильно, і він марнуватиме wall clock
на дублікати збірок образів.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей
артефакт і до Docker workflow live/E2E release-path, і до шарда package acceptance.
Це зберігає байти пакета узгодженими між релізними блоками та уникає повторного
пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для перевірки артефакту пакета без
блокування релізного workflow. Він розв’язує одного кандидата з опублікованої npm
специфікації, довіреного `package_ref`, зібраного з вибраним harness `workflow_ref`,
HTTPS URL tarball із SHA-256 або tarball-артефакту з іншого запуску GitHub Actions,
завантажує його як `package-under-test`, а потім повторно використовує Docker
release/E2E scheduler із цим tarball замість повторного пакування checkout workflow.
Профілі покривають smoke, package, product, full і custom вибори Docker-доріжок.
Профіль `package` використовує офлайн-покриття плагінів, щоб перевірка
опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова
доріжка Telegram повторно використовує артефакт `package-under-test` у workflow
`NPM Telegram Beta E2E`, а шлях опублікованої npm специфікації зберігається для
самостійних запусків.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей
встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайної CI:
звичайна CI перевіряє дерево джерел, тоді як package acceptance перевіряє один
tarball через той самий Docker E2E harness, який користувачі проходять після
встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить source, workflow ref, package ref,
   версію, SHA-256 і профіль у підсумок кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow
   завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи
   package-digest і запускає вибрані Docker-доріжки проти цього пакета замість
   пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`,
   повторно використовуваний workflow готує пакет і спільні образи один раз, а потім
   розгортає ці доріжки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається,
   коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт
   `package-under-test`, коли Package Acceptance розв’язав його; самостійний запуск
   Telegram все ще може встановити опубліковану npm специфікацію.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або
   необов’язкова доріжка Telegram завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію
  релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  acceptance опублікованих beta/stable.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з
  історії гілок репозиторію або релізного тегу, встановлює залежності в detached
  worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`;
  `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених
  артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код
workflow/harness, який запускає тест. `package_ref` — це source-коміт, який пакується,
коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші довірені
source-коміти без запуску старої логіки workflow.

Профілі зіставляються з Docker-покриттям:

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
`telegram_mode=mock-openai`. Docker chunks release-path покривають перетин
доріжок package/update/plugin, тоді як Package Acceptance зберігає artifact-native
доказ bundled-channel compat, offline plugin і Telegram проти того самого розв’язаного
tarball пакета.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; перевірку product для package/update слід починати з Package
Acceptance. Windows packaged і installer fresh доріжки також перевіряють, що
встановлений пакет може імпортувати browser-control override із raw absolute
Windows path.

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих
пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть
використовувати compatibility path для відомих приватних QA записів у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball;
`doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`,
коли пакет не надає цей прапорець; `update-channel-switch` може обрізати відсутні
`pnpm.patchedDependencies` із tarball-derived fake git fixture і може логувати
відсутній збережений `update.channel`; plugin smokes можуть читати legacy locations
install-record або приймати відсутність persistence marketplace install-record; а
`plugin-update` може дозволяти міграцію metadata config, водночас усе ще вимагаючи,
щоб install record і поведінка no-reinstall залишалися незмінними. Опублікований
пакет `2026.4.26` також може попереджати про файли local build metadata stamp, які
вже були відвантажені. Пізніші пакети мають задовольняти сучасні контракти; ті самі
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

Під час налагодження невдалого запуску package acceptance починайте з підсумку
`resolve_package`, щоб підтвердити source пакета, версію та SHA-256. Потім перевірте
дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Віддавайте перевагу перезапуску невдалого package profile
або точних Docker lanes замість повторного запуску full release validation.

QA Lab має окремі CI-лінії поза основним smart-scoped workflow. Workflow
`Parity gate` запускається для відповідних змін у PR і ручного dispatch; він
збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6
агентні пакети. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за
ручним dispatch; він розгалужує mock parity gate, live-лінію Matrix, а також live
лінії Telegram і Discord як паралельні завдання. Live-завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Release
checks запускають live-лінії транспорту Matrix і Telegram з детермінованим mock
провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і
`mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі
та звичайного запуску provider-plugin. Live transport gateway також
вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті;
підключення провайдерів покривається окремими наборами live model, native provider
і Docker provider. Matrix використовує `--profile fast` для запланованих і release gates,
додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Значення CLI за замовчуванням
і ручний workflow input залишаються `all`; ручний dispatch `matrix_profile=all`
завжди шардить повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу лінії QA Lab перед затвердженням релізу; його QA parity
gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує
обидва артефакти в невелике report job для фінального parity comparison.
Не ставте шлях landing для PR за `Parity gate`, якщо зміна фактично не
зачіпає QA runtime, model-pack parity або поверхню, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або unit-тестів вважайте це optional
signal і дотримуйтеся scoped CI/check evidence.

Workflow `Duplicate PRs After Merge` — це ручний workflow для maintainer
для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що
landed PR змерджено і що кожен дублікат має або спільну referenced issue,
або перетин змінених hunk.

Workflow `CodeQL` навмисно є вузьким сканером безпеки першого проходу,
а не повним sweep репозиторію. Щоденні та ручні запуски сканують код Actions workflow
плюс найризикованіші JavaScript/TypeScript поверхні auth, secrets, sandbox, cron і
gateway з high-precision security queries. Завдання
channel-runtime-boundary окремо сканує core channel implementation
contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets і
audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб сигнал безпеки каналів міг масштабуватися без розширення базової
категорії JS/TS.

Workflow `CodeQL Android Critical Security` — це запланований Android
security shard. Він вручну збирає Android app для CodeQL на найменшому
Blacksmith Linux runner label, прийнятому workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS
security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS,
відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
default workflow, оскільки macOS build домінує за runtime навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний non-security shard. Він
запускає лише error-severity, non-security JavaScript/TypeScript quality queries
на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його
завдання core-auth-secrets сканує код auth, secrets, sandbox, cron і gateway security
boundary в окремій категорії `/codeql-critical-quality/core-auth-secrets`.
Завдання config-boundary
сканує config schema, migration, normalization і IO contracts в окремій
категорії `/codeql-critical-quality/config-boundary`. Завдання
gateway-runtime-boundary сканує gateway protocol schemas і server method
contracts в окремій категорії
`/codeql-critical-quality/gateway-runtime-boundary`. Завдання
channel-runtime-boundary сканує core channel implementation contracts в
окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання
agent-runtime-boundary сканує command execution, model/provider dispatch,
auto-reply dispatch і queues, а також ACP control-plane runtime contracts в
окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання
ui-control-plane сканує Control UI bootstrap, local persistence, gateway
control flows і task control-plane runtime contracts в окремій
категорії `/codeql-critical-quality/ui-control-plane`. Завдання
web-media-runtime-boundary сканує core web fetch/search, media IO, media
understanding, image-generation і media-generation runtime contracts в
окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання
plugin-boundary сканує loader, registry, public-surface і Plugin SDK
entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте workflow окремо від security, щоб quality findings можна було
планувати, вимірювати, вимикати або розширювати без затінення security signal.
Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як
scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні
runtime і signal.

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання
наявної документації узгодженою з нещодавно залендованими змінами. Він не має pure schedule:
успішний non-bot push CI run на `main` може його запустити, а manual dispatch може
запустити його напряму. Workflow-run invocations пропускаються, коли `main` зсунувся вперед або коли
інший non-skipped Docs Agent run був створений протягом останньої години. Коли він запускається, він
переглядає commit range від попереднього non-skipped Docs Agent source SHA до
поточного `main`, тож один погодинний run може покрити всі main changes, накопичені з
останнього docs pass.

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane
для повільних тестів. Він не має pure schedule: успішний non-bot push CI run на
`main` може його запустити, але він пропускається, якщо інший workflow-run invocation вже
запускався або виконується цього UTC дня. Manual dispatch обходить цей daily activity
gate. Лінія будує full-suite grouped Vitest performance report, дозволяє Codex
вносити лише невеликі coverage-preserving test performance fixes замість broad
refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують
passing baseline test count. Якщо baseline має failing tests, Codex може виправити
лише очевидні failures, а after-agent full-suite report має пройти перед
будь-яким commit. Коли `main` просувається до того, як bot push буде залендовано, лінія
ребейзить validated patch, повторно запускає `pnpm check:changed` і повторює push;
conflicting stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex
action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only changes, changed scopes, changed extensions і будує CI manifest            | Завжди на non-draft pushes і PRs   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди на non-draft pushes і PRs   |
| `security-dependency-audit`      | Dependency-free production lockfile audit against npm advisories                             | Завжди на non-draft pushes і PRs   |
| `security-fast`                  | Required aggregate для fast security jobs                                                    | Завжди на non-draft pushes і PRs   |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts             | Node-relevant changes              |
| `checks-fast-core`               | Fast Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                  | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі stable aggregate check result                             | Node-relevant changes              |
| `checks-node-extensions`         | Full bundled-plugin test shards across the extension suite                                   | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes              | Node-relevant changes              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke      | Node-relevant changes              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-relevant changes              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch для releases    |
| `plugin-prerelease-suite`        | Aggregate для plugin prerelease static checks і Docker product lanes                         | Full Release Validation CI child   |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests plus shared runtime import specifier regressions         | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-relevant changes             |
| `android`                        | Android unit tests для обох flavors plus one debug APK build                                 | Android-relevant changes           |
| `test-performance-agent`         | Daily Codex slow-test optimization after trusted activity                                    | Main CI success або manual dispatch |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну
обмежену за областю доріжку: шарди Linux Node, шарди вбудованих Plugin, контракти каналів,
сумісність із Node 22, `check`, `check-additional`, димову перевірку збірки, перевірки документації,
Python Skills, Windows, macOS, Android і Control UI i18n. Набір попереднього випуску Plugin
виключено з автономного ручного CI й увімкнено лише тоді, коли
повна парасолька випуску проходить із `full_release_validation=true`. Ручні запуски використовують
унікальну групу конкурентності, тому повний набір перевірок кандидата на випуск не скасовується
іншим запуском push або PR на тому самому ref. Необов’язковий вхідний параметр `target_ref` дає
довіреному виклику змогу запустити цей граф для гілки, тегу або повного SHA коміту, водночас
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок швидкого припинення

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання артефактів і матриці платформ.
3. `build-artifacts` перекривається зі швидкими доріжками Linux, щоб нижчі споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає виявлення changed-scope і змушує маніфест preflight
поводитися так, ніби змінилася кожна обмежена за областю ділянка.
Редагування workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують Windows, Android або macOS native builds; ці платформні доріжки залишаються прив’язаними до змін платформного вихідного коду.
Редагування лише маршрутизації CI, вибрані дешеві редагування fixtures core-test і вузькі редагування helper/test-routing для контрактів Plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core shards, шардів вбудованих Plugin і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання перевіряє напряму.
Перевірки Windows Node обмежені специфічними для Windows process/path wrappers, helpers npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цю доріжку; непов’язані зміни джерел, Plugin, install-smoke і лише тестові зміни залишаються на доріжках Linux Node, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/package, змін package/manifest вбудованих Plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише джерел вбудованих Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого extension і запускає обмежений Docker profile вбудованих Plugin із сукупним таймаутом команди 240 секунд, причому Docker run кожного сценарію обмежено окремо. Повний шлях зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних dispatches, workflow-call release checks і pull requests, які справді торкаються поверхонь installer/package/Docker. Pushes у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope просила б повне покриття на push, workflow зберігає fast Docker smoke і залишає full install smoke нічним або release validation. Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatches `install-smoke` можуть увімкнути його, але pull requests і pushes у `main` його не запускають. QR і installer Docker tests зберігають власні install-focused Dockerfiles. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: bare Node/Git runner для доріжок installer/update/plugin-dependency і functional image, який встановлює той самий tarball у `/app` для звичайних functional lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а чутливу до provider кількість слотів tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Caps для важких lanes за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service lanes не перевантажували Docker, поки легші lanes усе ще заповнюють доступні слоти. Одна lane, важча за ефективні caps, усе одно може стартувати з порожнього pool, а потім працює сама, доки не звільнить місткість. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникнути локальних create storms Docker daemon; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний aggregate виконує preflight для Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає lane timings для longest-first ordering і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні scheduler lanes, включно з release-only lanes, як-от `install-e2e`, і розділеними bundled update lanes, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу lane. Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Workflow `Package Acceptance` є високорівневим package gate: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або попереднього workflow artifact, а потім передає цей єдиний artifact `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance logic могла перевіряти старіші довірені commits без checkout старого workflow code. Release checks запускають спеціальну delta Package Acceptance для target ref: bundled-channel compat, offline plugin fixtures і Telegram package QA для визначеного tarball. Docker suite release-path запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage цього вимагає, і зберігає окремий chunk `openwebui` лише для dispatches тільки OpenWebUI. Застарілі aggregate chunk names `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` усе ще працюють для ручних повторних запусків, але release workflow використовує split chunks, щоб installer E2E і bundled plugin install/uninstall sweeps не домінували на критичному шляху. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes. Chunk `bundled-channels` запускає split lanes `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one lane `bundled-channel-deps`. Кожен chunk вивантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Вхідний параметр workflow `docker_lanes` запускає вибрані lanes для підготовлених images замість chunk jobs, що утримує debugging failed-lane в межах одного targeted Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли такі значення існують, щоб failed lane могла повторно використати точні package і images з failed run. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts з GitHub run і вивести combined/per-lane targeted rerun commands; використовуйте `pnpm test:docker:timings <summary.json>` для slow-lane і phase critical-path summaries. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матрицю bundled update розділено за update target, щоб повторні проходи npm update і doctor repair могли шардитися з іншими bundled checks.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Aggregate chunk `bundled-channels` лишається доступним для ручних one-shot reruns, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` лишаються aggregate plugin/runtime aliases, але release workflow використовує split chunks, щоб channel smokes, update targets, plugin runtime checks і bundled plugin install/uninstall sweeps могли виконуватися паралельно. Targeted dispatches `docker_lanes` також розділяють кілька вибраних lanes на parallel jobs після одного спільного кроку package/image preparation, а bundled-channel update lanes повторюють спробу один раз у разі transient npm network failures.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний шлюз суворіший щодо архітектурних меж, ніж широкий обсяг платформи CI: зміни у продукційному коді ядра запускають typecheck для core prod і core test, а також lint/guards ядра; зміни лише в тестах ядра запускають тільки typecheck для core test і lint ядра; зміни у продукційному коді розширень запускають typecheck для extension prod і extension test, а також lint розширень; зміни лише в тестах розширень запускають typecheck для extension test і lint розширень. Зміни в публічному Plugin SDK або контрактах плагінів розширюються до typecheck розширень, бо розширення залежать від цих контрактів ядра, але Vitest-перевірки розширень є явною тестовою роботою. Зміни версій лише в релізних метаданих запускають цільові перевірки версій, конфігурації та кореневих залежностей. Невідомі зміни кореня/конфігурації безпечно переходять до всіх check-ланів.
Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни джерел віддають перевагу явним мапінгам, потім sibling-тестам і залежним
елементам графа імпортів. Спільна конфігурація доставки групових кімнат є одним із явних мапінгів:
зміни у конфігурації видимої групової відповіді, режимі доставки відповіді з джерела або
маршруті системного prompt для message-tool проходять через тести відповідей ядра, а також регресії доставки Discord і
Slack, щоб зміна спільного значення за замовчуванням падала до першого push PR.
Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий зіставлений набір не є надійним proxy.

Для валідації Testbox запускайте з кореня репозиторію і для
широкого доказу віддавайте перевагу свіжо прогрітому box. Перед тим як витрачати повільний gate на box, який було повторно використано, термін дії якого минув або
який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity-перевірка швидко падає, коли обов’язкові кореневі файли, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість налагодження
збою продуктового тесту. Для навмисних PR із великим обсягом видалень задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

Ручні CI-dispatches запускають `checks-node-compat-node22` як широке покриття сумісності. `plugin-prerelease-suite` є дорожчим продуктовим/пакетним покриттям, тому він запускається лише коли `Full Release Validation` dispatch-ить CI з `full_release_validation=true`. Звичайні pull requests, push до `main` і окремі ручні CI-dispatches залишають цей suite вимкненим.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне job залишалося малим без надмірного резервування runner-ів: контракти каналів запускаються як три зважені shards, тести bundled plugin балансуються між шістьма workers розширень, малі лани core unit поєднуються в пари, auto-reply запускається як чотири збалансовані workers із піддеревом reply, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. Широкі browser, QA, media та різні plugin-тести використовують свої dedicated Vitest configs замість спільного plugin catch-all. Extension shard jobs запускають до двох груп plugin config одночасно з одним Vitest worker на групу і більшим heap Node, щоб import-heavy plugin batches не створювали додаткові CI jobs. Широкий agents lane використовує спільний Vitest file-parallel scheduler, бо він домінується імпортами/плануванням, а не належить одному повільному тестовому файлу. `runtime-config` запускається з infra core-runtime shard, щоб спільний runtime shard не володів хвостом. Include-pattern shards записують timing entries з використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards конкурентно в одному job. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи свої старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої черги artifact-consumer.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із прапорцями SMS/call-log BuildConfig, уникаючи дублювання job пакування debug APK на кожному push, релевантному для Android.
GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє на той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було витіснено.
Автоматичний concurrency key CI версіоновано (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час черги 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
