---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте перевірки GitHub Actions, що не проходять
summary: Граф завдань CI, перевірки за областю та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T06:43:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b6d5c683789fde45995dbab11307cecc7d601d341ab0926ec42703fc0a912ed
    source_path: ci.md
    workflow: 16
---

CI запускається на кожен push до `main` і кожен pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації, з Android-гілками, що вмикаються через `include_android` для окремих ручних запусків. Prerelease-гілки плагінів лише для релізу залишаються вимкненими, якщо `Full Release Validation` не запускає CI з `full_release_validation=true`, що також вмикає Android.

`Full Release Validation` — це ручний парасольковий workflow для «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks` для install smoke,
package acceptance, Docker-наборів за релізним шляхом, live/E2E, OpenWebUI,
паритету QA Lab, Matrix і Telegram-гілок. Він також може запускати post-publish
workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.
`release_profile=minimum|stable|full` керує широтою live/provider, що передається
до release checks: `minimum` залишає найшвидші критичні для релізу гілки OpenAI/core,
`stable` додає стабільний набір provider/backend, а `full` запускає широку
рекомендаційну матрицю provider/media. Парасольковий workflow записує id
запущених дочірніх run, а фінальне завдання `Verify full validation` повторно
перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань
для кожного дочірнього run. Якщо дочірній workflow перезапущено й він став зеленим,
перезапустіть лише батьківське verifier-завдання, щоб оновити результат
парасолькового workflow і підсумок часу виконання.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише
для звичайного дочірнього full CI, `release-checks` для кожного релізного дочірнього
workflow або вужчу релізну групу: `install-smoke`, `cross-os`, `live-e2e`, `package`,
`qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольковому workflow. Це
утримує перезапуск невдалого релізного середовища в межах після цільового виправлення.

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider завдання
`native-live-src-gateway-profiles`, `native-live-src-gateway-backends`,
`native-live-test`, `native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media audio/video shards і відфільтровані
за provider music shards) через `scripts/test-live-shard.mjs` замість одного
послідовного завдання. Це зберігає те саме файлове покриття, водночас полегшуючи
перезапуск і діагностику повільних live-збоїв provider. Агреговані назви shards
`native-live-extensions-o-z`, `native-live-extensions-media` і
`native-live-extensions-media-music` залишаються чинними для ручних одноразових
перезапусків.

Нативні live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`;
media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте
Docker-backed live suites на звичайних Blacksmith runners, бо container jobs —
невідповідне місце для запуску вкладених Docker-тестів.

Docker-backed live model/backend shards використовують окремий спільний образ
`ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
release workflow збирає та публікує цей образ один раз, після чого Docker live model,
gateway, CLI backend, ACP bind і Codex harness shards запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards незалежно перебудовують повну
source Docker target, release run налаштовано неправильно, і він марнуватиме
час на дубльовані збірки образів.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз
розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає
цей артефакт і до live/E2E Docker workflow релізного шляху, і до package acceptance
shard. Це зберігає байти пакета узгодженими між релізними середовищами й уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це side-run workflow для валідації артефакта пакета без
блокування release workflow. Він розв’язує одного кандидата з опублікованої npm
специфікації, довіреного `package_ref`, зібраного з вибраним harness
`workflow_ref`, HTTPS URL tarball із SHA-256 або tarball artifact з іншого GitHub
Actions run, вивантажує його як `package-under-test`, а потім повторно використовує
Docker release/E2E scheduler із цим tarball замість повторного пакування workflow
checkout. Профілі покривають smoke, package, product, full і custom вибори Docker
lanes. Профіль `package` використовує offline-покриття плагінів, щоб валідація
опублікованого пакета не залежала від доступності live ClawHub. Додаткова
Telegram-гілка повторно використовує артефакт `package-under-test` у workflow
`NPM Telegram Beta E2E`, а шлях опублікованої npm специфікації зберігається для
окремих dispatch-запусків.

## Приймальне тестування пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей
інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI:
звичайний CI валідує дерево source, тоді як package acceptance валідує один
tarball через той самий Docker E2E harness, яким користувачі користуються після
інсталяції або оновлення.

Workflow має чотири завдання:

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, вивантажує обидва як
   артефакт `package-under-test` і друкує джерело, workflow ref, package ref,
   версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує цей
   артефакт, валідує інвентар tarball, готує package-digest Docker images, коли
   потрібно, і запускає вибрані Docker lanes проти цього пакета замість пакування
   workflow checkout. Коли профіль вибирає кілька цільових `docker_lanes`, reusable
   workflow готує пакет і спільні images один раз, а потім розгортає ці lanes як
   паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` додатково викликає `NPM Telegram Beta E2E`. Він запускається,
   коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт
   `package-under-test`, коли Package Acceptance розв’язав один; окремий Telegram
   dispatch усе ще може встановити опубліковану npm специфікацію.
4. `summary` завершує workflow з помилкою, якщо package resolution, Docker acceptance
   або додаткова Telegram-гілка завершилися невдало.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну версію
  релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймального тестування опублікованих beta/stable.
- `source=ref`: пакує довірений `package_ref` branch, tag або повний commit SHA.
  Resolver отримує branches/tags OpenClaw, перевіряє, що вибраний commit досяжний
  з історії гілок репозиторію або release tag, встановлює deps у detached worktree
  і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і `artifact_name`;
  `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених
  артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
workflow/harness code, який запускає тест. `package_ref` — це source commit, який
пакується, коли `source=ref`. Це дає поточному test harness змогу валідувати старіші
довірені source commits без запуску старої workflow logic.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker chunks релізного шляху з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Docker chunks релізного шляху покривають перетин
package/update/plugin lanes, тоді як Package Acceptance зберігає artifact-native
proof для bundled-channel compat, offline plugin і Telegram проти того самого
розв’язаного package tarball.
Cross-OS release checks усе ще покривають OS-specific onboarding, installer і
platform behavior; product validation для package/update слід починати з Package
Acceptance. Windows packaged і installer fresh lanes також перевіряють, що
встановлений пакет може імпортувати browser-control override із сирого абсолютного
Windows path.

Package Acceptance має обмежені legacy-compatibility windows для вже опублікованих
пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть
використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball,
`doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`,
коли пакет не exposes цей flag, `update-channel-switch` може prune відсутні
`pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати
відсутній persisted `update.channel`, plugin smokes можуть читати legacy
install-record locations або приймати відсутню marketplace install-record
persistence, а `plugin-update` може дозволяти config metadata migration, водночас
і далі вимагаючи, щоб install record і no-reinstall behavior лишалися незмінними.
Опублікований пакет `2026.4.26` також може попереджати про local build metadata
stamp files, які вже були shipped. Пізніші пакети мають відповідати сучасним
contracts; ті самі умови спричиняють failure замість warning або skip.

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

Під час налагодження невдалого package acceptance run починайте з summary
`resolve_package`, щоб підтвердити package source, version і SHA-256. Потім
перегляньте дочірній run `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Віддавайте перевагу перезапуску failed package profile
або точних Docker lanes замість повторного запуску full release validation.

QA Lab має окремі CI-доріжки поза основним workflow з розумним обмеженням за областю змін. Workflow
`Parity gate` запускається для відповідних змін у PR і вручну; він
збирає приватне QA runtime-середовище та порівнює mock GPT-5.5 і Opus 4.6
агентні пакети. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і
вручну; він розгалужує mock parity gate, live Matrix-доріжку, а також live
Telegram і Discord-доріжки як паралельні завдання. Live-завдання використовують
середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex. Release
checks запускають live transport-доріжки Matrix і Telegram із детермінованим mock
провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і
`mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримок live-моделі
та звичайного запуску Plugin провайдера. Live transport gateway також
вимикає пошук у пам’яті, бо QA parity окремо покриває поведінку пам’яті;
підключення провайдера покривається окремими наборами live model, native provider
і Docker provider. Matrix використовує `--profile fast` для запланованих і release gates,
додаючи `--fail-fast` лише тоді, коли перевірений CLI це підтримує. Типове значення CLI
і ручний ввід workflow залишаються `all`; ручний dispatch `matrix_profile=all`
завжди розбиває повне покриття Matrix на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також
запускає критичні для релізу QA Lab-доріжки перед затвердженням релізу; його QA parity
gate запускає candidate і baseline пакети як паралельні завдання доріжок, а потім завантажує
обидва артефакти в невелике звітне завдання для фінального порівняння parity.
Не ставте шлях приземлення PR за `Parity gate`, якщо зміна фактично не
торкається QA runtime, parity пакетів моделей або поверхні, якою володіє parity workflow.
Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий
сигнал і спирайтеся на scoped CI/check докази.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після приземлення. За замовчуванням він працює в dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що
приземлений PR змерджено і що кожен дублікат має або спільну згадану issue,
або перетин у змінених hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу,
а не повним проходом усього репозиторію. Щоденні та ручні запуски сканують код Actions workflow
плюс найризикованіші JavaScript/TypeScript-поверхні auth, secrets, sandbox, cron і
gateway за допомогою високоточних security queries. Завдання
channel-runtime-boundary окремо сканує контракти реалізації core channel
плюс runtime Plugin каналу, gateway, Plugin SDK, secrets і
audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`,
щоб сигнал безпеки каналу міг масштабуватися без розширення базової
JS/TS-категорії.

Workflow `CodeQL Android Critical Security` — це запланований Android
security shard. Він збирає Android app вручну для CodeQL на найменшій
мітці Blacksmith Linux runner, яку приймає workflow sanity, і завантажує результати
в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS
security shard. Він збирає macOS app вручну для CodeQL на Blacksmith macOS,
фільтрує результати збірки залежностей із завантажуваного SARIF і завантажує результати
в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним
типовим workflow, бо macOS-збірка домінує в часі виконання навіть коли все чисто.

Workflow `CodeQL Critical Quality` — це відповідний не-security shard. Він
запускає лише JavaScript/TypeScript quality queries із severity error і без security
на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його
завдання core-auth-secrets сканує auth, secrets, sandbox, cron і gateway security
boundary code в окремій категорії `/codeql-critical-quality/core-auth-secrets`.
Завдання config-boundary
сканує config schema, migration, normalization і IO contracts в окремій
категорії `/codeql-critical-quality/config-boundary`. Завдання
gateway-runtime-boundary сканує gateway protocol schemas і server method
contracts в окремій категорії
`/codeql-critical-quality/gateway-runtime-boundary`. Завдання
channel-runtime-boundary сканує core channel implementation contracts в
окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання
agent-runtime-boundary сканує command execution, model/provider dispatch,
auto-reply dispatch and queues, а також ACP control-plane runtime contracts в
окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання
mcp-process-runtime-boundary сканує MCP servers and tool bridges, process
supervision helpers і outbound delivery contracts в окремій
категорії `/codeql-critical-quality/mcp-process-runtime-boundary`. Завдання
ui-control-plane сканує Control UI bootstrap, local persistence, gateway
control flows і task control-plane runtime contracts в окремій
категорії `/codeql-critical-quality/ui-control-plane`. Завдання
web-media-runtime-boundary сканує core web fetch/search, media IO, media
understanding, image-generation і media-generation runtime contracts в окремій категорії `/codeql-critical-quality/web-media-runtime-boundary`. Завдання
plugin-boundary сканує loader, registry, public-surface і Plugin SDK
entrypoint contracts в окремій категорії `/codeql-critical-quality/plugin-boundary`.
Тримайте workflow окремо від security, щоб quality findings можна було
планувати, вимірювати, вимикати або розширювати без затемнення security signal.
Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як
scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільні
runtime і signal.

Workflow `Docs Agent` — це подієва maintenance-доріжка Codex для підтримання
наявної документації узгодженою з нещодавно приземленими змінами. Вона не має чистого розкладу:
успішний non-bot push CI run на `main` може її запустити, а ручний dispatch може
запустити її напряму. Workflow-run invocations пропускаються, коли `main` уже змістився або коли
інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він
переглядає commit range від попереднього non-skipped Docs Agent source SHA до
поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені після
останнього проходу документації.

Workflow `Test Performance Agent` — це подієва maintenance-доріжка Codex
для повільних тестів. Вона не має чистого розкладу: успішний non-bot push CI run на
`main` може її запустити, але вона пропускається, якщо інший workflow-run invocation уже
запускався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний activity
gate. Доріжка будує grouped Vitest performance report для повного набору, дозволяє Codex
вносити лише невеликі performance-виправлення тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують
baseline кількість успішних тестів. Якщо baseline має failing tests, Codex може виправляти
лише очевидні failures, і after-agent full-suite report має пройти перед
будь-яким комітом. Коли `main` просувається до приземлення bot push, доріжка
ребейзить перевірений patch, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex
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
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує CI manifest   | Завжди на non-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди на non-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди на non-draft push і PR      |
| `security-fast`                  | Обов’язковий агрегат для швидких security jobs                                               | Завжди на non-draft push і PR      |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts         | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні shards тестів bundled-plugin у всьому extension suite                                  | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, окрім channel, bundled, contract і extension lanes                    | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного local gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для built-artifact channel tests                                                 | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для релізів     |
| `plugin-prerelease-suite`        | Агрегат для plugin prerelease static checks і Docker product lanes                           | Full Release Validation CI child   |
| `check-docs`                     | Форматування документації, lint і broken-link checks                                         | Документація змінена               |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                           | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна Codex slow-test optimization після trusted activity                                  | Main CI success або manual dispatch |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають усі
ланки з областю дії, крім Android: Linux-шарди Node, шарди вбудованих плагінів, контракти каналів,
сумісність із Node 22, `check`, `check-additional`, smoke-перевірку збірки, перевірки документації,
Python Skills, Windows, macOS і i18n Control UI. Окремі ручні запуски CI виконують лише Android з `include_android=true`; повна парасолька релізу
вмикає Android, передаючи `full_release_validation=true`. Передрелізний набір плагінів
виключено з окремого ручного CI, і він вмикається лише тоді, коли
повна парасолька релізу передає `full_release_validation=true`. Ручні запуски використовують
унікальну групу паралельності, щоб повний набір release-candidate не скасовувався
іншим push або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному викликачеві запустити цей граф для гілки, тегу або повного SHA коміту, водночас
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` вирішує, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання артефактів і платформної матриці.
3. `build-artifacts` перекривається зі швидкими Linux-ланками, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний dispatch пропускає виявлення changed-scope і змушує маніфест preflight
поводитися так, ніби змінилася кожна область з областю дії.
Редагування CI workflow перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують Windows, Android або macOS native-збірки; ці платформні ланки залишаються прив’язаними до змін платформного вихідного коду.
Редагування лише маршрутизації CI, вибрані дешеві редагування фікстур core-test і вузькі редагування допоміжних засобів/маршрутизації тестів контрактів плагінів використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності з Node 22, контрактів каналів, повних core-шардів, шардів вбудованих плагінів і додаткових guard-матриць, коли змінені файли обмежені поверхнями маршрутизації або допоміжними поверхнями, які швидке завдання перевіряє безпосередньо.
Windows Node-перевірки прив’язані до Windows-специфічних обгорток процесів/шляхів, допоміжних засобів npm/pnpm/UI runner, конфігурації менеджера пакетів і поверхонь CI workflow, які виконують цю ланку; непов’язані зміни вихідного коду, плагінів, install-smoke і лише тестів залишаються на Linux Node-ланках, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих плагінів і core-поверхонь Plugin/канал/Gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованих плагінів, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення і запускає обмежений Docker-профіль вбудованих плагінів під 240-секундним сукупним таймаутом команди, де Docker run кожного сценарію обмежено окремо. Повний шлях зберігає встановлення QR-пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call перевірок релізу і pull requests, які справді торкаються поверхонь інсталятора/пакета/Docker. Push у `main`, включно з merge-комітами, не примушують повний шлях; коли логіка changed-scope запросила б повне покриття на push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної перевірки або валідації релізу. Повільний smoke Bun global install image-provider окремо gated через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `install-smoke` можуть увімкнути його, але pull requests і push у `main` його не запускають. QR і Docker-тести інсталятора зберігають власні install-focused Dockerfile. Локальний `test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий Node/Git runner для ланок інсталятора/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ланок. Визначення Docker-ланок містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної ланки через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає ланки з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ланок за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service ланки не перевантажували Docker, тоді як легші ланки все ще заповнюють доступні слоти. Одна ланка, важча за ефективні обмеження, все одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Старти ланок за замовчуванням рознесені на 2 секунди, щоб уникати локальних сплесків створення в Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегатний preflight перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ланок, зберігає таймінги ланок для longest-first впорядкування і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для огляду планувальника. За замовчуванням він припиняє планувати нові pooled-ланки після першої помилки, і кожна ланка має 120-хвилинний fallback-таймаут, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail ланки використовують жорсткіші обмеження на ланку. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні ланки планувальника, включно з release-only ланками на кшталт `install-e2e` і розділеними ланками оновлення вбудованих компонентів на кшталт `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб agents могли відтворити одну невдалу ланку. Перевикористовуваний live/E2E workflow питає `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, ланки і credentials потрібне, а потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє інвентар tarball; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E образи через Docker layer cache Blacksmith, коли план потребує package-installed ланок; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Workflow `Package Acceptance` є високорівневим gate пакета: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакта попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у перевикористовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance-логіка могла перевіряти старіші довірені коміти без checkout старого workflow-коду. Перевірки релізу запускають власну дельту Package Acceptance для цільового ref: сумісність bundled-channel, offline plugin fixtures і Telegram package QA щодо визначеного tarball. Docker-набір release-path запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний тип образу і виконував кілька ланок через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI входить до `plugins-runtime-services`, коли це запитує повне release-path покриття, і зберігає окремий chunk `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Застарілі назви агрегатних chunk `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для ручних перезапусків, але release workflow використовує розділені chunks, щоб installer E2E і sweeping встановлення/видалення вбудованих плагінів не домінували на критичному шляху. Псевдонім ланки `install-e2e` залишається агрегатним псевдонімом ручного перезапуску для обох ланок provider installer. Chunk `bundled-channels` запускає розділені ланки `bundled-channel-*` і `bundled-channel-update-*`, а не серійну все-в-одному ланку `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з журналами ланок, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ланок і командами перезапуску для кожної ланки. Вхід workflow `docker_lanes` запускає вибрані ланки проти підготовлених образів замість chunk-завдань, що утримує налагодження невдалої ланки в межах одного цільового Docker-завдання і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана ланка є live Docker lane, цільове завдання локально збирає live-test образ для цього перезапуску. Згенеровані GitHub-команди перезапуску для кожної ланки включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала ланка могла повторно використати точний пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub-запуску і вивести об’єднані/покомпонентні цільові команди перезапуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень slow-lane і phase critical-path. Запланований live/E2E workflow щодня запускає повний Docker-набір release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися з іншими bundled-перевірками.

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегатний chunk `bundled-channels` залишається доступним для ручних one-shot перезапусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними псевдонімами plugin/runtime, але release workflow використовує розділені chunks, щоб channel smokes, цілі оновлення, перевірки plugin runtime і sweeping встановлення/видалення вбудованих плагінів могли виконуватися паралельно. Цільові dispatch `docker_lanes` також розділяють кілька вибраних ланок на паралельні завдання після одного спільного кроку підготовки пакета/образів, а ланки bundled-channel update повторюють спробу один раз для тимчасових npm network помилок.

Локальна логіка змінених ліній живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний перевірковий gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI: зміни production-коду core запускають typecheck для core prod і core test, а також core lint/guards; зміни лише в тестах core запускають тільки typecheck для core test і core lint; production-зміни extension запускають typecheck для extension prod і extension test, а також extension lint; зміни лише в тестах extension запускають typecheck для extension test і extension lint. Зміни публічного Plugin SDK або plugin-контракту розширюються до typecheck для extensions, бо extensions залежать від цих core-контрактів, але Vitest-прогони для extensions є явною тестовою роботою. Version bumps лише для release metadata запускають цільові перевірки версії/config/root-dependency. Невідомі root/config-зміни безпечно переходять у всі check lanes.
Локальна маршрутизація змінених тестів живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі правки тестів запускають самі себе,
правки source віддають перевагу явним mapping-ам, потім sibling tests та import-graph
dependents. Shared group-room delivery config є одним із явних mapping-ів:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt проходять через core reply tests плюс Discord і
Slack delivery regressions, щоб зміна shared default падала до першого PR
push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки широка для harness, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня repo і віддавайте перевагу свіжому warmed box для
широкого proof. Перш ніж витрачати повільний gate на box, який було повторно використано, термін дії якого минув або
який щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли обов’язкові root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що стан remote sync не є надійною
копією PR. Зупиніть цей box і прогрійте свіжий замість debug product test failure.
Для PR з навмисними великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

Manual CI dispatches запускають `checks-node-compat-node22` як широке compatibility coverage. Android є opt-in для standalone manual CI через `include_android=true` і завжди ввімкнений для `Full Release Validation`. `plugin-prerelease-suite` є дорожчим product/package coverage, тому він запускається лише тоді, коли `Full Release Validation` запускає CI з `full_release_validation=true`. Звичайні pull requests, `main` pushes і standalone manual CI dispatches тримають цей suite вимкненим.

Найповільніші Node test families розділені або збалансовані так, щоб кожна job залишалася малою без надмірного резервування runners: channel contracts запускаються як три weighted shards, bundled plugin tests балансуються між вісьмома extension workers, малі core unit lanes поєднані парами, auto-reply запускається як чотири balanced workers із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Broad agents lane використовує shared Vitest file-parallel scheduler, бо він dominated by import/scheduling, а не належить одному повільному test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries з використанням CI shard name, тож `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards concurrently всередині однієї job. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі check names як lightweight verifier jobs, водночас уникаючи двох додаткових Blacksmith workers і другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе ще компілює цей flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або `main` ref. Сприймайте це як CI noise, якщо newest run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють нормальні shard failures, але не стають у queue після того, як увесь workflow уже був superseded.
Automatic CI concurrency key versioned (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не cancel in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, fast security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), fast protocol/contract/bundled checks, sharded channel contract checks, `check` shards окрім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в queue раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощадили; install-smoke Docker builds, де 32-vCPU queue time коштував більше, ніж заощадив                                                                                                                                                                                                                                                                                                     |
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
- [Release channels](/uk/install/development-channels)
