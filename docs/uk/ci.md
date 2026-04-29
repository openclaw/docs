---
read_when:
    - Потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються помилкою
summary: Граф завдань CI, перевірки за областю дії та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-29T04:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5315d80962cfce8e894fca23fe0eaf74c5d1f30638612b50d329946c7a6b0fb0
    source_path: ci.md
    workflow: 16
---

CI запускається під час кожного push до `main` і кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний парасольковий workflow для "запустити все
перед релізом." Він приймає гілку, тег або повний SHA коміту, запускає ручний
workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks`
для smoke-перевірки встановлення, приймання пакета, наборів Docker release-path,
live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram lanes. Він також може запускати
післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета. `release_profile=minimum|stable|full` керує шириною
live/provider, що передається в release checks: `minimum` залишає найшвидші
критично важливі для релізу lanes OpenAI/core, `stable` додає стабільний набір
provider/backend, а `full` запускає широку advisory-матрицю provider/media.
Парасольковий workflow записує id запущених дочірніх запусків, а фінальне
завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх
запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску.
Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише
батьківське verifier-завдання, щоб оновити результат парасолькового workflow і
підсумок часу виконання.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` обидва
приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише
для звичайного повного дочірнього CI, `release-checks` для кожного дочірнього
релізного workflow або вужчу релізну групу: `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у
парасольковому workflow. Це утримує перезапуск невдалого release box обмеженим
після цільового виправлення.

Дочірній release live/E2E зберігає широке native-покриття `pnpm test:live`, але
запускає його як іменовані shards (`native-live-src-agents`,
`native-live-src-gateway-core`, відфільтровані за provider
завдання `native-live-src-gateway-profiles`,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, розділені media shards для аудіо/відео та
відфільтровані за provider music shards) через `scripts/test-live-shard.mjs`
замість одного послідовного завдання. Це зберігає те саме файлове покриття,
водночас спрощуючи повторний запуск і діагностику повільних live-збоїв provider.
Агреговані назви shards `native-live-extensions-o-z`,
`native-live-extensions-media` і `native-live-extensions-media-music`
залишаються чинними для ручних одноразових перезапусків.

Native live media shards запускаються в
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який збирає workflow
`Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і
`ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням.
Тримайте Docker-backed live-набори на звичайних Blacksmith runners, бо container
jobs — неправильне місце для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний образ
`ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live
release workflow один раз збирає й публікує цей образ, після чого Docker live
model, gateway, CLI backend, ACP bind і Codex harness shards запускаються з
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці shards самостійно перебудовують повну
source Docker target, release run налаштовано неправильно, і він марнуватиме
час виконання на дубльовані збірки образів.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз
розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає
цей artifact і до live/E2E release-path Docker workflow, і до package acceptance
shard. Це зберігає байти пакета узгодженими між release boxes і уникає
повторного пакування того самого кандидата в кількох дочірніх завданнях.

`Package Acceptance` — це побічний workflow для валідації package artifact без
блокування release workflow. Він розв’язує одного кандидата з опублікованої npm
spec, trusted `package_ref`, зібраного вибраним `workflow_ref` harness, HTTPS
tarball URL із SHA-256 або tarball artifact з іншого запуску GitHub Actions,
завантажує його як `package-under-test`, а потім повторно використовує Docker
release/E2E scheduler із цим tarball замість повторного пакування workflow
checkout. Профілі покривають smoke, package, product, full і custom
Docker lane selections. Профіль `package` використовує offline plugin-покриття,
щоб валідація опублікованого пакета не залежала від доступності live ClawHub.
Необов’язковий Telegram lane повторно використовує artifact
`package-under-test` у workflow `NPM Telegram Beta E2E`, а шлях опублікованої
npm spec зберігається для standalone dispatches.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей
інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI:
звичайний CI валідує дерево вихідного коду, тоді як package acceptance валідує
один tarball через той самий Docker E2E harness, який користувачі задіюють
після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата
   пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   artifact `package-under-test` і друкує джерело, workflow ref, package ref,
   версію, SHA-256 і профіль у GitHub step summary.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Reusable workflow завантажує цей
   artifact, валідує інвентар tarball, за потреби готує package-digest
   Docker images і запускає вибрані Docker lanes проти цього пакета замість
   пакування workflow checkout. Коли профіль вибирає кілька цільових
   `docker_lanes`, reusable workflow один раз готує пакет і спільні образи, а
   потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними
   artifacts.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він
   запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий
   artifact `package-under-test`, коли Package Acceptance розв’язав його;
   standalone Telegram dispatch все ще може встановити опубліковану npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або
   необов’язковий Telegram lane зазнали невдачі.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте
  це для приймання опублікованих beta/stable.
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA.
  Resolver отримує branches/tags OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії repository branch або release tag, встановлює залежності в
  detached worktree і пакує його за допомогою
  `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` з `artifact_run_id` і
  `artifact_name`; `package_sha256` необов’язковий, але його варто надати для
  artifacts, поширених зовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted
workflow/harness code, який виконує тест. `package_ref` — це source commit, який
пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати
старіші trusted source commits без запуску старої workflow logic.

Профілі відповідають Docker-покриттю:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker release-path chunks з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Release checks викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'` і
`telegram_mode=mock-openai`. Release-path Docker
chunks покривають перетин package/update/plugin lanes, тоді як Package
Acceptance зберігає artifact-native proof для bundled-channel compat, offline
plugin і Telegram проти того самого розв’язаного package tarball.
Cross-OS release checks все ще покривають специфічні для ОС onboarding,
installer і platform behavior; валідацію package/update product слід починати з
Package Acceptance. Windows packaged і installer fresh lanes також перевіряють,
що встановлений пакет може імпортувати browser-control override з raw absolute
Windows path.

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих
пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть
використовувати compatibility path для відомих private QA entries у
`dist/postinstall-inventory.json`, які вказують на файли, пропущені в tarball;
`doctor-switch` може пропустити підвипадок persistence для
`gateway install --wrapper`, коли пакет не відкриває цей flag;
`update-channel-switch` може prune відсутні `pnpm.patchedDependencies` з
tarball-derived fake git fixture і може логувати відсутній persisted
`update.channel`; plugin smokes можуть читати legacy install-record locations
або приймати відсутню marketplace install-record persistence; а `plugin-update`
може дозволити міграцію config metadata, водночас і надалі вимагаючи, щоб
install record і no-reinstall behavior залишалися незмінними. Опублікований
пакет `2026.4.26` також може попереджати про local build metadata stamp files,
які вже було випущено. Пізніші пакети мають задовольняти сучасні contracts; ті
самі умови призводять до failure замість warning або skip.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім
перегляньте дочірній запуск `docker_acceptance` і його Docker artifacts:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase
timings і rerun commands. Надавайте перевагу перезапуску невдалого package
profile або точних Docker lanes замість повторного запуску full release
validation.

QA Lab має окремі CI-доріжки поза основним workflow із розумним визначенням області. Workflow `Parity gate` запускається для відповідних змін у PR і ручного запуску; він збирає приватне QA-середовище виконання та порівнює агентні пакети mock GPT-5.5 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручного запуску; він розгортає mock parity gate, live-доріжку Matrix, а також live-доріжки Telegram і Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex-оренди. Release-перевірки запускають live-доріжки транспорту Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway також вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривають окремі набори live model, native provider і Docker provider. Matrix використовує `--profile fast` для запланованих і release-gate перевірок, додаючи `--fail-fast` лише тоді, коли checkout-нутий CLI це підтримує. Стандартне значення CLI і ручний workflow-ввід залишаються `all`; ручний запуск із `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` також запускає критичні для релізу доріжки QA Lab перед затвердженням релізу; його QA parity gate запускає кандидатний і baseline-пакети як паралельні lane-завдання, а потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння. Не ставте шлях landing PR за `Parity gate`, якщо зміна насправді не торкається QA runtime, parity пакетів моделей або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів вважайте це опціональним сигналом і натомість дотримуйтеся scoped CI/check доказів.

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні й ручні запуски сканують код Actions workflow, а також найризикованіші JavaScript/TypeScript-поверхні auth, secrets, sandbox, cron і gateway з високоточними security queries. Завдання channel-runtime-boundary окремо сканує core channel implementation contracts, а також channel plugin runtime, gateway, Plugin SDK, secrets і audit touchpoints у категорії `/codeql-critical-security/channel-runtime-boundary`, щоб security-сигнал каналів міг масштабуватися без розширення baseline JS/TS-категорії.

Workflow `CodeQL Android Critical Security` — це запланований Android security shard. Він вручну збирає Android app для CodeQL на найменшій мітці Blacksmith Linux runner, яку приймає workflow sanity, і завантажує результати в категорію `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` — це щотижневий/ручний macOS security shard. Він вручну збирає macOS app для CodeQL на Blacksmith macOS, фільтрує результати dependency build із завантаженого SARIF і завантажує результати в категорію `/codeql-critical-security/macos`. Тримайте його поза щоденним workflow за замовчуванням, оскільки macOS build домінує за runtime навіть коли чистий.

Workflow `CodeQL Critical Quality` — це відповідний не-security shard. Він запускає лише JavaScript/TypeScript quality queries із severity error і без security над вузькими цінними поверхнями на меншому Blacksmith Linux runner. Його baseline-завдання сканує ту саму поверхню auth, secrets, sandbox, cron і gateway, що й security workflow. Завдання config-boundary сканує контракти config schema, migration, normalization і IO в окремій категорії `/codeql-critical-quality/config-boundary`. Завдання gateway-runtime-boundary сканує схеми gateway protocol і контракти server method в окремій категорії `/codeql-critical-quality/gateway-runtime-boundary`. Завдання channel-runtime-boundary сканує core channel implementation contracts в окремій категорії `/codeql-critical-quality/channel-runtime-boundary`. Завдання agent-runtime-boundary сканує command execution, model/provider dispatch, auto-reply dispatch і queues, а також runtime-контракти ACP control-plane в окремій категорії `/codeql-critical-quality/agent-runtime-boundary`. Завдання ui-control-plane сканує Control UI bootstrap, local persistence, gateway control flows і runtime-контракти task control-plane в окремій категорії `/codeql-critical-quality/ui-control-plane`. Завдання plugin-boundary сканує loader, registry, public-surface і entrypoint-контракти Plugin SDK в окремій категорії `/codeql-critical-quality/plugin-boundary`. Тримайте workflow окремо від security, щоб quality-знахідки можна було планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад лише як scoped або sharded follow-up work після того, як вузькі профілі матимуть стабільні runtime і signal.

Workflow `Docs Agent` — це подієво-керована maintenance-доріжка Codex для підтримання наявної документації у відповідності з нещодавно landed changes. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а ручний dispatch може запустити його напряму. Workflow-run виклики пропускаються, коли `main` уже зсунувся далі або коли за останню годину було створено інший non-skipped Docs Agent run. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний run може покрити всі зміни main, накопичені з останнього docs pass.

The `Test Performance Agent` workflow — це подієво-керована лінія супроводу Codex
для повільних тестів. Вона не має суто розкладу: успішний CI-запуск після push
не від бота в `main` може її запустити, але вона пропускається, якщо інший
виклик через workflow-run уже виконувався або виконується цього UTC-дня. Ручний
запуск обходить цей щоденний шлюз активності. Лінія створює згрупований звіт
Vitest про продуктивність для повного набору тестів, дозволяє Codex вносити
лише невеликі виправлення продуктивності тестів зі збереженням покриття замість
широких рефакторингів, потім повторно запускає звіт для повного набору тестів і
відхиляє зміни, що зменшують базову кількість успішних тестів. Якщо в базовому
стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт для
повного набору тестів після агента має пройти перед будь-яким комітом. Коли
`main` просувається до того, як bot push потрапить у репозиторій, лінія ребейзить
перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
конфліктні застарілі патчі пропускаються. Вона використовує Ubuntu на GitHub,
щоб дія Codex могла зберегти ту саму безпечну позицію drop-sudo, що й агент
документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та будує CI-маніфест  | Завжди для недрафтових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisory                                  | Завжди для недрафтових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні Node             |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, релевантні Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні Node             |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні Node             |
| `checks-node-core-test`          | Шарди основних Node-тестів, за винятком каналів, bundled, contract і extension ліній         | Зміни, релевантні Node             |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node             |
| `check-additional`               | Шарди архітектури, меж, захистів surface розширень, package-boundary і gateway-watch         | Зміни, релевантні Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і startup-memory smoke                                             | Зміни, релевантні Node             |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                           | Зміни, релевантні Node             |
| `checks-node-compat-node22`      | Лінія збірки й smoke для сумісності з Node 22                                                | Ручний CI-запуск для релізів       |
| `plugin-prerelease-suite`        | Агрегат для prerelease статичних перевірок Plugin і Docker product ліній                     | Ручний CI-запуск для релізів       |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні Python Skills    |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс спільні регресії runtime import specifier  | Зміни, релевантні Windows          |
| `macos-node`                     | Лінія тестів TypeScript для macOS із використанням спільних зібраних артефактів              | Зміни, релевантні macOS            |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні macOS            |
| `android`                        | Android unit-тести для обох варіантів плюс одна debug APK збірка                             | Зміни, релевантні Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний CI на main або ручний запуск |

Ручні CI-запуски виконують той самий граф завдань, що й звичайний CI, але
примусово вмикають кожну scoped лінію: Linux Node shards, bundled-plugin shards,
контракти каналів, сумісність із Node 22, prerelease покриття Plugin, `check`,
`check-additional`, build smoke, перевірки документації, Python Skills, Windows,
macOS, Android і Control UI i18n. Ручні запуски використовують унікальну групу
конкурентності, щоб повний набір release-candidate не скасовувався іншим push
або PR-запуском на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному виклику запустити цей граф для гілки, тегу або повного SHA коміту,
використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали до запуску дорогих:

1. `preflight` визначає, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб нижчі споживачі могли почати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає виявлення changed-scope і змушує маніфест preflight
поводитися так, ніби кожна область змінилася.
Зміни CI workflow перевіряють граф Node CI плюс лінтинг workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії залишаються обмеженими змінами платформного коду.
CI-зміни лише маршрутизації, вибрані дешеві зміни core-test фікстур і вузькі зміни допоміжних засобів/маршрутизації тестів контрактів плагінів використовують швидкий Node-only шлях маніфесту: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає артефактів збірки, сумісності Node 22, контрактів каналів, повних core-шардів, шардів вбудованих плагінів і додаткових матриць запобіжників, коли змінені файли обмежені поверхнями маршрутизації або допоміжними поверхнями, які швидке завдання перевіряє напряму.
Windows Node перевірки обмежені специфічними для Windows обгортками процесів/шляхів, npm/pnpm/UI runner допоміжними засобами, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни джерельного коду, плагінів, install-smoke і лише тестів залишаються на Linux Node лініях, щоб вони не резервували 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request-и запускають швидкий шлях для поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих плагінів і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke завдання. Зміни лише джерельного коду вбудованих плагінів, лише тестові редагування і лише документаційні редагування не резервують Docker worker-и. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає smoke CLI видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення і запускає обмежений Docker-профіль вбудованого плагіна в межах 240-секундного сукупного таймауту команди, з окремим обмеженням Docker run для кожного сценарію. Повний шлях зберігає встановлення QR-пакета і Docker/update покриття інсталятора для нічних запланованих запусків, ручних запусків, workflow-call release checks і pull request-ів, які справді торкаються поверхонь інсталятора/пакета/Docker. Push-и в `main`, зокрема merge commit-и, не примушують повний шлях; коли логіка changed-scope запитала б повне покриття на push, workflow залишає швидкий Docker smoke і лишає повний install smoke для нічної або релізної валідації. Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`; він виконується за нічним розкладом і з release checks workflow, а ручні запуски `install-smoke` можуть увімкнути його, але pull request-и й push-и в `main` його не запускають. QR і installer Docker тести зберігають власні install-focused Dockerfile-и. Локальний `test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий Node/Git runner для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника живе в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартну кількість слотів main-pool 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів provider-sensitive tail-pool 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб npm install і multi-service лінії не перевантажували Docker, поки легші лінії все ще заповнюють доступні слоти. Одна лінія, важча за ефективні обмеження, усе одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Старти ліній за замовчуванням рознесені на 2 секунди, щоб уникати локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для інспекції планувальника. За замовчуванням він припиняє планувати нові pooled-лінії після першої помилки, і кожна лінія має 120-хвилинний fallback-таймаут, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail лінії використовують суворіші per-lane обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні лінії планувальника, зокрема release-only лінії, як-от `install-e2e`, і розділені bundled update лінії, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії і credentials потрібне, потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E образи через Docker layer cache Blacksmith, коли план потребує package-installed ліній; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість перебудови. Workflow `Package Acceptance` є високорівневим пакетовим шлюзом: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball плюс SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у багаторазовий Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна acceptance-логіка могла перевіряти старіші довірені коміти без checkout старого workflow-коду. Release checks запускають кастомну Package Acceptance delta для цільового ref: bundled-channel compat, offline plugin фікстури і Telegram package QA проти визначеного tarball. Release-path Docker suite запускає менші chunked завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу і виконував кілька ліній через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`). OpenWebUI включено в `plugins-runtime-services`, коли повне release-path покриття цього вимагає, і він зберігає окремий chunk `openwebui` лише для OpenWebUI-only запусків. Застарілі агрегатні назви chunk-ів `package-update`, `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` досі працюють для ручних повторних запусків, але release workflow використовує розділені chunk-и, щоб installer E2E і sweeps встановлення/видалення вбудованих плагінів не домінували в критичному шляху. Псевдонім лінії `install-e2e` залишається агрегатним псевдонімом ручного повторного запуску для обох provider installer ліній. Chunk `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість послідовної all-in-one лінії `bundled-channel-deps`. Кожен chunk завантажує `.artifacts/docker-tests/` з логами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk-завдань, що утримує debugging невдалої лінії в межах одного цільового Docker-завдання і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker лінією, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані GitHub команди повторного запуску для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти з GitHub запуску і вивести комбіновані/по-лінійні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних ліній і критичного шляху фаз. Запланований live/E2E workflow щодня запускає повний release-path Docker suite. Матрицю bundled update розділено за ціллю оновлення, щоб повторні npm update і doctor repair проходи могли шардитися з іншими bundled перевірками.

Поточні Docker chunk-и релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегатний chunk `bundled-channels` залишається доступним для ручних one-shot повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними псевдонімами plugin/runtime, але release workflow використовує розділені chunk-и, щоб channel smokes, цілі оновлення, plugin runtime перевірки і sweeps встановлення/видалення вбудованих плагінів могли виконуватися паралельно. Цільові запуски `docker_lanes` також розділяють кілька вибраних ліній на паралельні завдання після одного спільного кроку підготовки пакета/образу, а bundled-channel update лінії повторюють спробу один раз для тимчасових npm мережевих збоїв.

Логіка локального визначення змінених lanes живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний контрольний gate суворіший щодо архітектурних меж, ніж широка область платформи CI: зміни production-коду core запускають typecheck для core prod і core tests плюс core lint/guards, зміни лише core tests запускають тільки typecheck для core tests плюс core lint, production-зміни розширень запускають typecheck для extension prod і extension tests плюс extension lint, а зміни лише extension tests запускають typecheck для extension tests плюс extension lint. Зміни публічного Plugin SDK або plugin-contract розширюються до typecheck розширень, бо розширення залежать від цих core-контрактів, але sweeps розширень Vitest є явною тестовою роботою. Version bumps лише release metadata запускають цільові перевірки версій/config/root-dependency. Невідомі зміни root/config безпечно переходять до всіх check lanes.
Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і
навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе,
зміни source надають перевагу явним мапінгам, потім sibling tests та залежним
елементам import-graph. Shared group-room delivery config є одним із явних мапінгів:
зміни group visible-reply config, source reply delivery mode або
message-tool system prompt маршрутизуються через core reply tests плюс регресії доставлення Discord і
Slack, щоб зміна shared default падала ще до першого
push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна
настільки harness-wide, що дешевий mapped set не є надійним proxy.

Для валідації Testbox запускайте з кореня repo та віддавайте перевагу свіжому warmed box для
широкого proof. Перед тим як витрачати повільний gate на box, який було reused, expired або
який щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині
box. Sanity check швидко падає, коли обов’язкові root files, як-от
`pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200
tracked deletions. Зазвичай це означає, що remote sync state не є надійною
копією PR. Зупиніть цей box і warm fresh one замість налагодження
product test failure. Для навмисних PR із великим видаленням встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

Manual CI dispatches запускають `checks-node-compat-node22` і `plugin-prerelease-suite` як покриття сумісності release-candidate. Звичайні pull requests і pushes до `main` пропускають ці lanes і тримають matrix сфокусованою на Node 24 test/channel lanes.

Найповільніші родини Node tests розділені або збалансовані, щоб кожна job залишалася малою без надмірного резервування runners: channel contracts запускаються як три weighted shards, bundled plugin tests балансуються між шістьма extension workers, малі core unit lanes об’єднані в пари, auto-reply запускається як чотири збалансовані workers із розділенням reply subtree на shards agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Broad agents lane використовує спільний Vitest file-parallel scheduler, бо вона домінована import/scheduling, а не одним повільним test file. `runtime-config` запускається з infra core-runtime shard, щоб shared runtime shard не володів tail. Include-pattern shards записують timing entries з назвою CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards паралельно всередині однієї job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані, зберігаючи їхні старі check names як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої artifact-consumer queue.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із BuildConfig flags для SMS/call-log, уникаючи дубльованої job пакування debug APK на кожному Android-relevant push.
GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як весь workflow уже був superseded.
Автоматичний CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie в старій queue group не міг нескінченно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs та aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували; install-smoke Docker builds, де час черги 32-vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                                                     |
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
- [Канали release](/uk/install/development-channels)
