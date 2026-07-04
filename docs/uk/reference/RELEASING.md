---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте назви версій і каденцію
summary: Канали релізів, контрольний список оператора, блоки валідації, іменування версій і каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-07-04T18:21:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw наразі надає три користувацькі канали оновлень:

- stable: наявний промотований канал випусків, який досі визначається через
  npm `latest`, доки не буде завершено окремий етап CLI/каналів
- beta: передвипускні теги, що публікуються в npm `beta`
- dev: рухома вершина `main`

Окремо оператори випусків можуть публікувати core-пакет за попередній завершений
місяць у npm `extended-stable`, починаючи з патча `33`. Поточна звичайна
фінальна лінія місяця продовжує використовувати npm `latest`; цей операторський
поділ публікації сам по собі не змінює визначення каналу оновлення CLI.

## Назви версій

- Щомісячна версія випуску npm extended-stable: `YYYY.M.PATCH`, де `PATCH >= 33`
  - Git-тег: `vYYYY.M.PATCH`
- Щоденна/звичайна фінальна версія випуску: `YYYY.M.PATCH`, де `PATCH < 33`
  - Git-тег: `vYYYY.M.PATCH`
- Версія звичайного коригувального fallback-випуску: `YYYY.M.PATCH-N`
  - Git-тег: `vYYYY.M.PATCH-N`
- Версія beta-передвипуску: `YYYY.M.PATCH-beta.N`
  - Git-тег: `vYYYY.M.PATCH-beta.N`
- Не додавайте нулі на початку місяця або патча
- Починаючи з оновлення процесу випуску за червень 2026 року, третій компонент є
  послідовним щомісячним номером release-train, а не календарним днем. Stable- і beta-
  випуски визначають поточний train; теги лише alpha не використовують і не
  просувають номер beta/stable-патча. Теги й npm-версії до оновлення зберігають
  свої наявні назви та залишаються чинними; автоматизація випусків і надалі
  порівнює їх за роком, місяцем, патчем, каналом і номером передвипуску або
  корекції.
- Alpha/nightly-збірки використовують наступний неопублікований patch train і
  збільшують лише `alpha.N` для повторних збірок. Щойно цей патч отримує beta,
  нові alpha-збірки переходять до наступного патча. Ігноруйте застарілі теги
  лише alpha з більшими номерами патчів під час вибору beta- або stable-train.
- Версії npm незмінні. Якщо beta-тег уже опубліковано, не видаляйте, не
  публікуйте повторно й не використовуйте його повторно; створіть наступний
  beta-номер або наступний щомісячний патч. Оскільки `2026.6.5-beta.1` уже було
  опубліковано під час переходу, release trains за червень 2026 року мають
  використовувати патч `5` або вищий. Не публікуйте нові stable- або beta-trains
  за червень 2026 року як `2026.6.2`, `2026.6.3` або
  `2026.6.4`.
- Після звичайного фінального `2026.6.5` наступний новий beta train —
  `2026.6.6-beta.1`, навіть
  якщо вже існують автоматизовані теги лише alpha з більшими номерами патчів.
- `latest` і надалі відповідає поточній звичайній/щоденній npm-лінії
- `beta` означає поточну ціль встановлення beta
- `extended-stable` означає підтримуваний npm-пакет за попередній місяць, починаючи з патча
  `33`; патч `34` і пізніші є maintenance-випусками в цій щомісячній лінії
- Виділений щомісячний шлях extended-stable публікує лише core-пакет npm. Він
  не публікує plugins, артефакти macOS або Windows, GitHub Release,
  dist-tags приватного репозиторію, образи Docker, мобільні артефакти або
  завантаження з вебсайту.

## Періодичність випусків

- Випуски рухаються спочатку через beta
- Stable виходить лише після перевірки останньої beta
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.PATCH`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег було надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, затвердження, облікові дані та нотатки з відновлення
  доступні лише супровідникам

## Щомісячна публікація extended-stable лише в npm

Це виділений виняток із регулярної процедури випуску нижче. Для
завершеного місяця `YYYY.M` створіть `extended-stable/YYYY.M.33`; публікуйте `vYYYY.M.33` і
подальші maintenance-патчі з тієї самої гілки. Тег випуску, вершина гілки,
checkout, версія пакета, npm preflight і запуск Повної перевірки випуску мають
усі вказувати на той самий коміт. Захищений `main` уже має містити фінальну
версію строго пізнішого календарного місяця нижче патча `33`; maintenance-патчі
залишаються допустимими після того, як `main` просунеться більш ніж на один місяць.

Запустіть npm preflight і Повну перевірку випуску з точної гілки extended-stable,
потім збережіть обидва ID запусків:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` — це наявний профіль глибини перевірки; він
окремий від npm dist-tag `extended-stable` і навмисно залишається без змін.

Після успішного завершення обох запусків і готовності середовища випуску npm просуньте
точний preflight-тарбол. Патч `P` має бути `33` або більшим:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Для fork або непродукційної репетиції, яка навмисно не може задовольнити
щомісячну політику `.33` або політику місяця захищеного `main`, додайте
`-f bypass_extended_stable_guard=true` до dispatch-команд npm preflight і публікації. Типове
значення — `false`. Обхід приймається лише з `npm_dist_tag=extended-stable` і
записується в підсумку workflow. Він не обходить канонічний
workflow ref `extended-stable/YYYY.M.33`, рівність вершини гілки/тега/checkout, синтаксис
фінального тега, рівність версії пакета/тега, ідентичність указаного запуску та маніфесту,
походження тарболу, затвердження середовища, зчитування з registry або докази
виправлення selector.

Workflow публікації перевіряє ідентичності вказаних запусків, digest підготовленого
тарболу та обидва selector-и npm registry. Незалежно підтвердьте
результат після успішного завершення workflow:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Обидві команди мають повернути `YYYY.M.P`. Якщо публікація успішна, але selector
readback не вдається, не публікуйте повторно незмінну версію пакета. Використайте єдину
команду виправлення `npm dist-tag add openclaw@YYYY.M.P extended-stable`, надруковану в
always-run підсумку невдалого workflow, потім повторіть обидва незалежні
readback-и. Відкат до попереднього selector є окремим операторським рішенням, а не
шляхом виправлення readback.

Регулярний checklist нижче й надалі відповідає за beta, `latest`, GitHub Release,
plugins, macOS, Windows та інші платформні публікації. Не виконуйте ці кроки
для цього npm-only шляху extended-stable.

## Checklist оператора регулярного випуску

Цей checklist є публічною формою потоку випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного rollback залишаються в
runbook випусків лише для супровідників.

1. Почніть із поточного `main`: підтягніть найновіші зміни, підтвердьте, що цільовий коміт запушено,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб від нього створювати гілку.
2. Згенеруйте верхній розділ `CHANGELOG.md` із змерджених PR і всіх прямих
   комітів від останнього досяжного релізного тегу. Тримайте записи орієнтованими на користувача,
   дедуплікуйте перетинні записи PR/прямих комітів, закомітьте переписування, запуште його
   і ще раз виконайте rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.PATCH` із поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Підніміть кожну потрібну локацію версії для запланованого тегу, потім запустіть
   `pnpm release:prep`. Він оновлює версії Plugin, інвентар Plugin, схему config,
   метадані config для вбудованих каналів, baseline документації config, експорти Plugin SDK
   і baseline API Plugin SDK у правильному порядку. Закомітьте будь-який згенерований
   дрейф перед тегуванням. Потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тегу
   повний 40-символьний SHA релізної гілки дозволено для preflight лише валідації.
   Preflight генерує докази релізу залежностей для
   точного витягнутого графа залежностей і зберігає їх в npm preflight
   артефакті. Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових боксів: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте в релізній гілці та перезапустіть найменший невдалий
   файл, lane, workflow job, package profile, provider або model allowlist, що
   доводить виправлення. Перезапускайте повний umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для тегованого beta-кандидата запустіть
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` з відповідної
   гілки `release/YYYY.M.PATCH`. Для stable також передайте потрібний Windows source
   release:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Помічник запускає локальні перевірки згенерованого релізу, dispatches або перевіряє
   повні докази release validation і npm preflight, запускає Parallels
   fresh/update proof проти точного підготовленого tarball плюс Telegram package
   proof, записує плани plugin npm і ClawHub та друкує точну команду
   `OpenClaw Release Publish` лише після того, як пакет доказів стає зеленим.
   `OpenClaw Release Publish` dispatches вибрані або всі придатні до публікації plugin
   packages до npm і той самий набір до ClawHub паралельно, а потім просуває
   підготовлений npm preflight artifact OpenClaw з відповідним dist-tag одразу після
   успішної публікації plugin npm.
   Після успіху дочірнього publish OpenClaw npm він створює або оновлює
   відповідну сторінку GitHub release/prerelease з повного відповідного
   розділу `CHANGELOG.md`. Stable-релізи, опубліковані в npm `latest`, стають
   GitHub latest release; stable maintenance releases, залишені в npm `beta`,
   створюються з GitHub `latest=false`. Workflow також завантажує preflight
   evidence залежностей, full-validation manifest і postpublish registry
   verification evidence до GitHub release для реагування на післярелізні інциденти.
   Publish workflow одразу друкує child run IDs, автоматично схвалює
   release environment gates, які workflow token має право схвалювати, підсумовує
   невдалі child jobs з хвостами логів, закриває GitHub release і dependency
   evidence щойно OpenClaw npm publish успішний, чекає ClawHub щоразу, коли
   публікується OpenClaw npm, потім запускає `pnpm release:verify-beta` і
   завантажує postpublish evidence для GitHub release, npm package, вибраних
   plugin npm packages, вибраних ClawHub packages, child workflow run IDs і
   необов’язкового NPM Telegram run ID. Шлях ClawHub повторює тимчасові збої
   встановлення залежностей CLI, публікує plugins, що пройшли preview, навіть коли одна
   preview cell flake, і завершується registry verification для кожної очікуваної
   версії Plugin, щоб часткові публікації лишалися видимими й придатними до повтору. Потім запустіть post-publish
   package acceptance проти опублікованого
   `openclaw@YYYY.M.PATCH-beta.N` або
   `openclaw@beta` package. Якщо запушений або опублікований prerelease потребує виправлення,
   виріжте наступний відповідний номер prerelease; не видаляйте й не переписуйте старий
   prerelease.
10. Для stable продовжуйте лише після того, як перевірений beta або release candidate має
    потрібні validation evidence. Stable npm publish також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight artifact через
    `preflight_run_id`; готовність stable macOS release також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
    macOS publish workflow автоматично публікує підписаний appcast у публічний `main`
    після перевірки release assets; якщо branch protection блокує
    прямий push, він відкриває або оновлює appcast PR. Готовність Stable Windows Hub
    потребує підписаних assets `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` і
    `OpenClawCompanion-SHA256SUMS.txt` в OpenClaw GitHub release.
    Передайте точний підписаний release tag `openclaw/openclaw-windows-node` як
    `windows_node_tag` і його схвалену кандидатом installer digest map як
    `windows_node_installer_digests`; `OpenClaw Release Publish` зберігає
    release draft, dispatches `Windows Node Release` і перевіряє всі три
    assets перед публікацією.
11. Після publish запустіть npm post-publish verifier, необов’язковий standalone
    published-npm Telegram E2E, коли потрібен post-publish channel proof,
    promotion dist-tag, коли потрібно, перевірте згенеровану сторінку GitHub release,
    запустіть кроки release announcement, потім завершіть [закриття stable main](#stable-main-closeout), перш ніж називати stable release завершеним.

## Закриття stable main

Stable-публікація не завершена, доки `main` не містить фактичний відвантажений
стан релізу.

1. Почніть зі свіжого найновішого `main`. Проаудіюйте `release/YYYY.M.PATCH` відносно нього й
   forward-port реальні виправлення, яких немає в `main`. Не мержте сліпо
   release-only compatibility, test або validation adapters у новіший `main`.
2. Установіть `main` на відвантажену stable-версію, а не на спекулятивний наступний train. Запустіть
   `pnpm release:prep` після зміни root version, потім
   `pnpm deps:shrinkwrap:generate`.
3. Зробіть так, щоб розділ `## YYYY.M.PATCH` у `CHANGELOG.md` на `main` точно збігався з
   тегованою релізною гілкою. Додайте оновлення stable `appcast.xml`, коли mac
   release його опублікував.
4. Не додавайте `YYYY.M.PATCH+1`, beta version або порожній майбутній changelog
   section до `main`, доки оператор явно не почне цей release train.
5. Запустіть `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` і
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Запуште, потім перевірте, що `origin/main`
   містить відвантажену версію та changelog, перш ніж називати stable release
   завершеним.
6. Тримайте repository variables `RELEASE_ROLLBACK_DRILL_ID` і
   `RELEASE_ROLLBACK_DRILL_DATE` актуальними після кожного приватного rollback drill.
   `OpenClaw Stable Main Closeout` стартує з push у `main`, який містить
   відвантажену версію, changelog і appcast після stable publication. Він читає
   незмінні postpublish evidence, щоб прив’язати відвантажений tag до його Full Release
   Validation і Publish runs, потім перевіряє stable main state, release,
   обов’язковий stable soak і blocking performance evidence. Він прикріплює
   незмінний closeout manifest і checksum до GitHub release. Автоматичний
   push trigger пропускає legacy releases, що передують незмінним postpublish
   evidence; він ніколи не трактує цей пропуск як завершений closeout. Повний
   closeout потребує обох assets і відповідного checksum. Частковий manifest
   відтворює записаний `main` SHA і rollback drill, щоб регенерувати ідентичні
   bytes, потім прикріплює відсутній checksum; недійсна пара або checksum
   без manifest лишається blocking. Push-triggered run без rollback
   drill repository variables пропускається без завершення closeout; відсутній або
   старіший за 90 днів drill record усе ще блокує manual evidence-backed
   closeout. Приватні recovery commands лишаються в maintainer-only runbook.
   Використовуйте manual dispatch лише для ремонту або replay evidence-backed stable closeout.
   Legacy fallback correction tag може повторно використати base-package evidence лише тоді, коли
   correction tag resolves до того самого source commit, що й base stable tag.
   Correction з іншим source має опублікувати й перевірити власні package
   evidence.

## Release preflight

- Запустіть `pnpm check:test-types` перед попередньою перевіркою релізу, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед попередньою перевіркою релізу, щоб ширші перевірки циклів
  імпортів і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для етапу перевірки
  пакування
- Запустіть `pnpm release:prep` після підвищення версії в корені й перед створенням тегу. Він
  запускає всі детерміновані релізні генератори, які часто розходяться після зміни
  версії/конфігурації/API: версії plugin, інвентар plugin, базову схему конфігурації,
  метадані конфігурації вбудованих каналів, базову лінію документації конфігурації, експорти plugin SDK
  і базову лінію API plugin SDK. `pnpm release:check` повторно запускає ці
  запобіжники в режимі перевірки й повідомляє про кожен виявлений збій згенерованого розходження за один
  прохід перед запуском перевірок релізу пакета.
- Синхронізація версій plugin за замовчуванням оновлює версії пакетів офіційних plugin і наявні
  нижні межі `openclaw.compat.pluginApi` до версії релізу OpenClaw.
  Вважайте це поле нижньою межею API plugin SDK/runtime, а не просто копією
  версії пакета: для релізів лише plugin, які навмисно залишаються
  сумісними зі старішими хостами OpenClaw, залишайте нижню межу на найстарішому підтримуваному
  API хоста й документуйте цей вибір у доказах релізу plugin.
- Запустіть ручний робочий процес `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, перевірок пакетів між ОС,
  паритету QA Lab, ліній Matrix і Telegram. Стабільні й повні
  запуски завжди містять вичерпні live/E2E та Docker release-path soak;
  `run_release_soak=true` збережено для явного beta soak. Package
  Acceptance надає канонічний package Telegram E2E під час перевірки кандидата,
  уникаючи другого паралельного live poller.
  Надайте `release_package_spec` після публікації beta, щоб повторно використати випущений
  npm-пакет у release checks, Package Acceptance і package Telegram
  E2E без повторного збирання релізного tarball. Надайте
  `npm_telegram_package_spec` лише коли Telegram має використовувати інший
  опублікований пакет, ніж решта перевірки релізу. Надайте
  `package_acceptance_package_spec`, коли Package Acceptance має використовувати
  інший опублікований пакет, ніж специфікація релізного пакета. Надайте
  `evidence_package_spec`, коли звіт доказів релізу має довести, що
  перевірка відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Запустіть ручний робочий процес `Package Acceptance`, коли потрібні докази через бічний канал
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` із поточною
  обв’язкою `workflow_ref`; `source=url` для публічного HTTPS tarball з
  обов’язковим SHA-256 і суворою політикою публічних URL; `source=trusted-url` для
  іменованої політики довіреного джерела з обов’язковими `trusted_source_id` і SHA-256; або
  `source=artifact` для tarball, завантаженого іншим запуском GitHub Actions. Цей
  робочий процес розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker-лінії містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опубліковану базову лінію. `update-restart-auth` використовує пакет-кандидат як
  встановлений CLI і як package-under-test, щоб перевірити керований шлях перезапуску
  команди оновлення кандидата.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: install/channel/agent, мережа gateway і лінії перезавантаження конфігурації
  - `package`: package/update/restart/plugin-лінії, нативні для артефакта, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс канали MCP, cron/subagent cleanup,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний робочий процес `CI` напряму, коли вам потрібне лише детерміноване нормальне
  покриття CI для кандидата релізу. Ручні запуски CI обходять changed
  scoping і примусово запускають шарди Linux Node, шарди bundled-plugin, шарди контрактів plugin і
  каналів, сумісність Node 22, `check-*`, `check-additional-*`,
  smoke-перевірки зібраних артефактів, перевірки документації, Python skills, Windows, macOS і
  лінії i18n Control UI. Окремі ручні запуски CI запускають Android лише коли їх запущено
  з `include_android=true`; `Full Release Validation` передає цей вхідний параметр своєму
  дочірньому CI.
  Приклад з Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Запустіть `pnpm qa:otel:smoke` під час перевірки релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експорт трас, метрик і логів,
  а також обмежені атрибути трас і редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запустіть `pnpm qa:otel:collector-smoke` під час перевірки сумісності колектора.
  Він спрямовує той самий OTLP-експорт QA-lab через реальний Docker-контейнер OpenTelemetry Collector
  перед локальними перевірками receiver.
- Запустіть `pnpm qa:prometheus:smoke` під час перевірки захищеного scraping Prometheus.
  Він проганяє QA-lab, відхиляє неавтентифіковані scrape-запити й перевіряє, що
  критичні для релізу сімейства метрик залишаються без вмісту prompt, сирих ідентифікаторів,
  auth tokens і локальних шляхів.
- Запустіть `pnpm qa:observability:smoke`, коли хочете виконати smoke-лінії
  OpenTelemetry і Prometheus із source-checkout одну за одною.
- Запустіть `pnpm release:check` перед кожним тегованим релізом
- Попередня перевірка `OpenClaw NPM Release` генерує релізні докази залежностей перед
  пакуванням npm tarball. Шлюз уразливостей npm advisory є
  блокувальним для релізу. Ризик транзитивного маніфесту, поверхня ownership/install
  залежностей і звіти про зміни залежностей є лише релізними доказами. Звіт про
  зміни залежностей порівнює кандидата релізу з попереднім
  досяжним релізним тегом.
- Попередня перевірка завантажує докази залежностей як
  `openclaw-release-dependency-evidence-<tag>` і також вбудовує їх у
  `dependency-evidence/` всередині підготовленого npm preflight artifact. Реальний
  шлях публікації повторно використовує цей preflight artifact, а потім прикріплює ті самі докази
  до GitHub release як `openclaw-<version>-dependency-evidence.zip`.
- Запустіть `OpenClaw Release Publish` для мутувальної послідовності публікації після того,
  як тег існує. Запустіть його з `release/YYYY.M.PATCH` (або `main`, коли публікуєте
  тег, досяжний з main), передайте release tag, успішний OpenClaw npm
  `preflight_run_id` і успішний `full_release_validation_run_id`, і залиште
  стандартну область публікації plugin `all-publishable`, якщо ви не запускаєте свідомо
  сфокусоване виправлення. Робочий процес серіалізує публікацію plugin npm, публікацію plugin
  ClawHub і публікацію OpenClaw npm, щоб основний пакет не було опубліковано
  перед його externalized plugins.
- Стабільний `OpenClaw Release Publish` вимагає точний `windows_node_tag` після того,
  як існує відповідний непередрелізний реліз `openclaw/openclaw-windows-node`.
  Він також вимагає затверджену для кандидата мапу `windows_node_installer_digests`.
  Перед запуском будь-якого дочірнього процесу публікації він перевіряє, що вихідний реліз
  опублікований, не є передрелізним, містить потрібні інсталятори x64/ARM64 і
  все ще відповідає цій затвердженій мапі. Потім він запускає `Windows Node Release`,
  поки реліз OpenClaw ще є чернеткою, передаючи закріплену мапу digest інсталяторів
  без змін. Дочірній
  робочий процес завантажує підписані інсталятори Windows Hub з цього точного тегу,
  звіряє їх із закріпленими digest, перевіряє, що їхні підписи Authenticode
  використовують очікуваного підписанта OpenClaw Foundation на Windows runner,
  записує маніфест SHA-256 і завантажує інсталятори плюс маніфест до
  канонічного GitHub release OpenClaw, потім повторно завантажує просунуті assets і
  перевіряє належність до маніфесту та хеші. Батьківський процес перевіряє поточний
  контракт assets для x64, ARM64 і checksum перед публікацією. Пряме відновлення
  відхиляє неочікувані імена assets `OpenClawCompanion-*` перед заміною
  очікуваних contract assets закріпленими байтами джерела. Вручну запускайте
  `Windows Node Release` лише для відновлення і завжди передавайте точний тег, ніколи
  `latest`, плюс явну JSON-мапу `expected_installer_digests` із
  затвердженого вихідного релізу. Посилання для завантаження на сайті мають вказувати на точні URL
  release asset OpenClaw для поточного стабільного релізу або
  `releases/latest/download/...` лише після перевірки, що redirect GitHub latest
  вказує на той самий реліз; не посилайтеся лише на сторінку релізу companion repo.
- Перевірки релізу тепер виконуються в окремому ручному робочому процесі:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає лінію mock parity QA Lab плюс швидкий
  live-профіль Matrix і лінію Telegram QA перед затвердженням релізу. Live
  лінії використовують середовище `qa-live-shared`; Telegram також використовує оренди облікових даних Convex CI.
  Запустіть ручний робочий процес `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли хочете повний інвентар
  транспорту Matrix, медіа й E2EE паралельно.
- Крос-ОС перевірка інсталяції й оновлення runtime є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  повторно використовуваний робочий процес
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: тримайте реальний npm release path коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються у власній
  лінії, щоб вони не затримували й не блокували публікацію
- Релізні перевірки із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  розв’язаний коміт досяжний з гілки OpenClaw або release tag
- Попередня перевірка `OpenClaw NPM Release` лише для валідації також приймає поточний
  повний 40-символьний SHA коміту workflow-branch без вимоги pushed tag
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у реальну публікацію
- У режимі SHA робочий процес синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно вимагає справжній release tag
- Обидва робочі процеси тримають реальний шлях публікації й просування на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей робочий процес запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему лінію release checks
- Перед локальним тегуванням кандидата релізу запустіть
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Допоміжний засіб
  запускає швидкі релізні guardrails, перевірки релізу plugin npm/ClawHub, build,
  UI build і `release:openclaw:npm:check` у порядку, який ловить поширені
  помилки, що блокують затвердження, перед стартом GitHub publish workflow.
- Запустіть `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед затвердженням
- Після публікації npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (або відповідну beta/correction версію), щоб перевірити опублікований шлях
  встановлення з реєстру у свіжому тимчасовому префіксі
- Після публікації beta запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  на опублікованому npm-пакеті з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запуски супровідників можуть опускати змінні Convex і передавати три
  env облікові дані `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke із машини супровідника, використайте `pnpm release:beta-smoke -- --beta betaN`. Допоміжний інструмент виконує перевірку Parallels npm update/fresh-target, запускає `NPM Telegram Beta E2E`, опитує точний запуск workflow, завантажує артефакт і друкує звіт Telegram.
- Супровідники можуть запустити ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація release для супровідників тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.PATCH`, що й успішний preflight-запуск
  - стабільні npm release за замовчуванням використовують `beta`
  - стабільна npm-публікація може явно націлюватися на `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер живе в
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, оскільки
    `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як вихідний repo зберігає
    публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для перевірки; коли тег існує лише в
    release-гілці, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.PATCH`
  - реальна macOS-публікація має пройти успішні macOS `preflight_run_id` і
    `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість того, щоб
    збирати їх знову
- Для стабільних корекційних release, як-от `YYYY.M.PATCH-N`, post-publish верифікатор
  також перевіряє той самий шлях оновлення з тимчасовим префіксом із `YYYY.M.PATCH` до `YYYY.M.PATCH-N`,
  щоб корекції release не могли непомітно залишити старіші глобальні встановлення на
  базовому стабільному payload
- npm release preflight завершується закритою помилкою, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожній browser dashboard
- Post-publish перевірка також перевіряє, що опубліковані entrypoint-и plugin і
  метадані пакета присутні у встановленій структурі реєстру. Release, який
  постачає відсутні runtime payload-и plugin, провалює postpublish верифікатор і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  candidate update tarball, тож installer e2e виявляє випадкове роздування пакета
  до шляху публікації release
- Якщо release-робота зачепила CI-планування, extension timing manifests або
  extension test matrices, повторно згенеруйте й перегляньте належні planner-у
  matrix-виходи `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність стабільного macOS release також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий стабільний zip після публікації; 
    workflow публікації macOS комітить його автоматично або відкриває appcast
    PR, коли прямий push заблоковано
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної нижньої межі Sparkle build
    для цієї версії release

## Тестові бокси релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для доказу закріпленого коміту на гілці, що швидко змінюється, використовуйте
допоміжний скрипт, щоб кожен дочірній workflow запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Допоміжний скрипт надсилає `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що `headSha` кожного дочірнього workflow
збігається з цільовим, а потім видаляє тимчасову гілку. Це допомагає не довести випадково
новіший дочірній запуск `main`.

Для валідації релізної гілки або тегу запускайте її з довіреного workflow-ref `main`
і передавайте релізну гілку або тег як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Workflow визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, а потім запускає `OpenClaw Release Checks`.
`OpenClaw Release Checks` розгалужується на install smoke, крос-ОС релізні перевірки,
покриття live/E2E Docker релізного шляху, коли soak увімкнено, Package Acceptance
з канонічним Telegram package E2E, QA Lab parity, live Matrix і live
Telegram. Повний/all запуск прийнятний лише тоді, коли зведення `Full Release Validation`
показує `normal_ci`, `plugin_prerelease` і `release_checks` як
успішні, якщо лише сфокусований повторний запуск навмисно не пропустив окремий дочірній `Plugin
Prerelease`. Використовуйте окремий дочірній `npm-telegram` лише для сфокусованого
повторного запуску опублікованого пакета з `release_package_spec` або
`npm_telegram_package_spec`. Підсумкове зведення верифікатора містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб менеджер релізу міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation), щоб переглянути
повну матрицю етапів, точні назви завдань workflow, відмінності між stable і full profile,
артефакти та ідентифікатори сфокусованих повторних запусків.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого workflow-ref вводу для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомій `main`;
сирі commit SHA не можуть бути refs для workflow dispatch, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший релізно-критичний live і Docker шлях OpenAI/core
- `stable`: minimum плюс покриття стабільних provider/backend для схвалення релізу
- `full`: stable плюс широке advisory-покриття provider/media

Валідація stable і full завжди запускає вичерпний live/E2E, Docker
релізний шлях і обмежений sweep перевірки, що опубліковане оновлення переживає upgrade, перед promotion.
Використовуйте `run_release_soak=true`, щоб запросити такий самий sweep для beta. Цей sweep охоплює
останні чотири stable пакети плюс закріплені базові версії `2026.4.23` і `2026.5.2`
плюс старіше покриття `2026.4.15`, з видаленими дубльованими базовими версіями та
кожною базовою версією, розбитою в окреме завдання Docker runner.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт у крос-ОС,
Package Acceptance і Docker перевірках релізного шляху, коли запускається soak. Це тримає
всі бокси, що працюють із пакетом, на тих самих байтах і уникає повторних збірок пакета.
Після того як beta вже опубліковано в npm, встановіть `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`,
щоб релізні перевірки один раз завантажили відвантажений пакет, витягли його build source
SHA з `dist/build-info.json` і повторно використали цей артефакт для крос-ОС,
Package Acceptance, Docker релізного шляху та package Telegram lanes.
Крос-ОС OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
змінна repo/org задана, інакше `openai/gpt-5.4`, бо цей lane
доводить інсталяцію пакета, onboarding, запуск gateway і один live agent turn,
а не бенчмарк найповільнішої моделі за замовчуванням. Ширша live provider
matrix залишається місцем для покриття, специфічного для моделей.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну umbrella як перший повторний запуск після сфокусованого виправлення. Якщо один бокс
падає, використовуйте для наступного доказу невдалий дочірній workflow, завдання, Docker lane, package profile, model
provider або QA lane. Запускайте повну umbrella знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні all-box докази
застарілими. Підсумковий верифікатор umbrella повторно перевіряє записані run
ids дочірніх workflow, тому після успішного повторного запуску дочірнього workflow повторно запустіть лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` в umbrella. `all` — це справжній
запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише релізний дочірній Plugin, `release-checks` запускає кожен релізний
бокс, а вужчі релізні групи — `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують `release_package_spec` або
`npm_telegram_package_spec`; full/all запуски використовують канонічний package Telegram
E2E всередині Package Acceptance. Сфокусовані
крос-ОС повторні запуски можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або
інший фільтр ОС/набору. Збої QA release-check блокують звичайну релізну
валідацію, включно з обов’язковим OpenClaw dynamic tool drift у стандартному tier.
Tideclaw alpha запуски все ще можуть вважати non-package-safety release-check lanes
advisory. Коли `live_suite_filter` явно запитує gated QA live lane, як-от
Discord, WhatsApp або Slack, відповідна
repo-змінна `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` має бути увімкнена; інакше
захоплення вводу завершується збоєм замість мовчазного пропуску lane.

### Vitest

Бокс Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово запускає звичайний граф тестів для release
candidate: Linux Node shards, bundled-plugin shards, plugin and channel contract
shards, сумісність Node 22, `check-*`, `check-additional-*`,
built-artifact smoke checks, docs checks, Python skills, Windows, macOS
і Control UI i18n. Android включено, коли `Full Release Validation` запускає
бокс, бо umbrella передає `include_android=true`; окремий ручний CI
потребує `include_android=true` для покриття Android.

Використовуйте цей бокс, щоб відповісти: «чи пройшло дерево джерел повний звичайний набір тестів?»
Це не те саме, що продуктова валідація релізного шляху. Докази, які слід зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shards із завдань CI під час дослідження регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, крос-ОС або package бокси. Використовуйте першу команду
для прямого CI без Android. Додайте `include_android=true`, коли прямий
release-candidate CI має охопити Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідовує release candidate через упаковані
Docker середовища, а не лише тести на рівні джерел.

Релізне покриття Docker включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що запускаються як окремі install-smoke
  shards
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли релізні перевірки
  включають live suites

Використовуйте артефакти Docker перед повторним запуском. Планувальник release-path завантажує
`.artifacts/docker-tests/` з логами lane, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступні, щоб
невдалий lane міг повторно використати той самий tarball і GHCR images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремо від Vitest і Docker
package mechanics.

Релізне покриття QA Lab включає:

- mock parity lane, що порівнює candidate lane OpenAI з baseline Opus 4.6
  за допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` або
  `pnpm qa:observability:smoke`, коли release telemetry потребує явного локального
  доказу

Використовуйте цей бокс, щоб відповісти: «чи реліз поводиться правильно в QA scenarios і
live channel flows?» Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення релізу. Повне покриття Matrix залишається доступним як
ручний sharded QA-Lab запуск, а не стандартний release-critical lane.

### Package

Бокс Package — це gate інстальованого продукту. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує версію пакета та SHA-256 і тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`
  з вибраним harness `workflow_ref`
- `source=url`: завантажує публічний HTTPS `.tgz` з обов’язковим `package_sha256`;
  облікові дані URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціального
  використання імена хостів або розв’язані адреси, а також небезпечні перенаправлення
  відхиляються
- `source=trusted-url`: завантажує HTTPS `.tgz` з обов’язковими
  `package_sha256` і `trusted_source_id` з іменованої політики в
  `.github/package-trusted-sources.json`; використовуйте це для супроводжуваних
  мейнтейнерами корпоративних дзеркал або приватних репозиторіїв пакетів замість
  додавання обходу приватної мережі на рівні вхідних даних до `source=url`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance із `source=artifact`,
підготовленим артефактом релізного пакета, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance зберігає QA для міграції, оновлення,
перезапуску оновлення з налаштованою автентифікацією, встановлення Skills із live ClawHub,
очищення застарілих залежностей плагінів, offline-фікстур плагінів, оновлення плагінів
і пакета Telegram на тому самому розв’язаному tarball. Блокувальні перевірки релізу
використовують типову базову лінію останнього опублікованого пакета; beta-профіль із
`run_release_soak=true`, `release_profile=stable` або
`release_profile=full` розширюється до кожної стабільної базової лінії, опублікованої в npm,
від `2026.4.23` до `latest`, а також фікстур повідомлених проблем. Використовуйте
Package Acceptance із `source=npm` для вже випущеного кандидата,
`source=ref` для локального npm tarball, підкріпленого SHA, перед публікацією,
`source=trusted-url` для корпоративного/приватного дзеркала, яке супроводжують мейнтейнери, або
`source=artifact` для підготовленого tarball, завантаженого іншим запуском GitHub Actions.
Це нативна для GitHub заміна більшості покриття package/update, яке раніше вимагало
Parallels. Крос-OS перевірки релізу все ще важливі для OS-специфічної адаптації,
інсталятора та поведінки платформи, але продуктова перевірка package/update має
надавати перевагу Package Acceptance.

Канонічний чекліст для перевірки оновлень і плагінів:
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins). Використовуйте його,
коли вирішуєте, який локальний, Docker, Package Acceptance або release-check lane доводить
зміну встановлення/оновлення плагіна, очищення doctor або міграції опублікованого пакета.
Вичерпна міграція опублікованих оновлень з кожного стабільного пакета `2026.4.23+` є
окремим ручним workflow `Update Migration`, а не частиною Full Release CI.

Пом’якшення legacy package-acceptance навмисно обмежене в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
у npm: приватні записи QA inventory, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли у git-фікстурі, похідній від tarball,
відсутній збережений `update.channel`, legacy розташування install-record плагінів,
відсутня персистентність marketplace install-record і міграція метаданих конфігурації
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про файли локальних stamp-метаданих збірки, які вже були випущені. Пізніші пакети
мають задовольняти сучасні контракти пакетів; ті самі прогалини провалюють перевірку релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
реального встановлюваного пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Поширені профілі пакетів:

- `smoke`: швидкі lanes встановлення пакета/каналу/агента, мережі Gateway і
  перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/перезапуску/пакета плагіна плюс proof
  встановлення Skills із live ClawHub; це типовий профіль release-check
- `product`: `package` плюс MCP-канали, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: Docker chunks для релізного шляху з OpenWebUI
- `custom`: точний список `docker_lanes` для фокусних повторних запусків

Для Telegram proof кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає розв’язаний
tarball `package-under-test` у Telegram lane; окремий Telegram workflow все ще
приймає опубліковану npm spec для перевірок після публікації.

## Автоматизація публікації регулярного релізу

Для beta, `latest`, плагіна, GitHub Release і публікації платформ
`OpenClaw Release Publish` є звичайною мутаційною точкою входу. Щомісячний
npm-only шлях extended-stable `.33+` не використовує цей orchestrator. Регулярний workflow
оркеструє trusted-publisher workflows у порядку, потрібному релізу:

1. Checkout релізного тегу й розв’язання його commit SHA.
2. Перевірка, що тег досяжний із `main` або `release/*`.
3. Запуск `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` із `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` з тим самим scope і SHA.
6. Dispatch `OpenClaw NPM Release` із релізним тегом, npm dist-tag і
   збереженим `preflight_run_id` після перевірки збереженого
   `full_release_validation_run_id`.
7. Для стабільних релізів створення або оновлення GitHub release як draft, dispatch
   `Windows Node Release` з явним `windows_node_tag` і
   candidate-approved `windows_node_installer_digests`, а також перевірка канонічних
   assets інсталятора/checksum перед публікацією draft.

Приклад публікації beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Публікація stable до типового beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Пряме просування stable до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте workflows нижчого рівня `Plugin NPM Release` і `Plugin ClawHub Release`
лише для фокусного ремонту або повторної публікації. `OpenClaw Release Publish` відхиляє
`plugin_publish_scope=selected`, коли `publish_openclaw_npm=true`, щоб core
package не міг бути випущений без кожного офіційного плагіна, придатного до публікації, включно з
`@openclaw/diffs-language-pack`. Для ремонту вибраного плагіна встановіть
`publish_openclaw_npm=false` з `plugin_publish_scope=selected` і
`plugins=@openclaw/name` або запустіть дочірній workflow напряму.

## Вхідні дані NPM workflow

`OpenClaw NPM Release` приймає такі вхідні дані, керовані оператором:

- `tag`: обов’язковий релізний тег, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту workflow-branch для validation-only preflight
- `preflight_only`: `true` лише для validation/build/package, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використовував
  підготовлений tarball з успішного preflight-запуску
- `full_release_validation_run_id`: обов’язковий для реальної щомісячної extended-stable і регулярної
  non-beta публікації, щоб workflow автентифікував точний validation run
- `npm_dist_tag`: цільовий npm tag для шляху публікації; приймає `alpha`, `beta`,
  `latest` або `extended-stable` і типово дорівнює `beta`. Фінальний patch `33` і пізніші мають
  використовувати `extended-stable`; типово `extended-stable` відхиляє попередні patches і завжди
  відхиляє нефінальні теги.
- `bypass_extended_stable_guard`: testing-only boolean, типово `false`; з
  `npm_dist_tag=extended-stable` обходить eligibility для щомісячного extended-stable, зберігаючи
  ідентичність релізу, артефакт, approval і readback checks.

`OpenClaw Release Publish` приймає такі вхідні дані, керовані оператором:

- `tag`: обов’язковий релізний тег; уже має існувати
- `preflight_run_id`: успішний run id preflight `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `full_release_validation_run_id`: успішний run id `Full Release Validation`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `windows_node_tag`: точний non-prerelease release tag `openclaw/openclaw-windows-node`;
  обов’язковий для публікації stable OpenClaw
- `windows_node_installer_digests`: candidate-approved compact JSON map поточних
  назв Windows installer до їхніх закріплених digest `sha256:`; обов’язковий
  для публікації stable OpenClaw
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для фокусного plugin-only repair з `publish_openclaw_npm=false`
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; встановлюйте `false` лише коли використовуєте
  workflow як plugin-only repair orchestrator
- `wait_for_clawhub`: типово `false`, щоб доступність npm не блокувалася
  sidecar ClawHub; встановлюйте `true` лише коли завершення workflow має включати
  завершення ClawHub

`OpenClaw Release Checks` приймає такі вхідні дані, керовані оператором:

- `ref`: гілка, тег або повний commit SHA для перевірки. Перевірки із secrets
  вимагають, щоб розв’язаний коміт був досяжний з гілки OpenClaw або
  релізного тегу.
- `run_release_soak`: opt into exhaustive live/E2E, Docker release-path і
  all-since upgrade-survivor soak для перевірок beta-релізу. Його примусово вмикають
  `release_profile=stable` і `release_profile=full`.

Правила:

- Регулярні фінальні та correction версії нижче patch `33` можуть публікуватися або до
  `beta`, або до `latest`. Фінальні версії з patch `33` або вище мають публікуватися до
  `extended-stable`, а версії з correction-suffix на цій межі відхиляються.
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` вхідний повний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  validation-only
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє, що метадані перед публікацією лишаються узгодженими

## Послідовність регулярного beta/latest stable релізу

Ця legacy послідовність призначена для регулярного orchestrated release, який також відповідає за
плагіни, GitHub Release, Windows та іншу платформну роботу. Це не
щомісячний npm-only шлях extended-stable `.33+`, задокументований угорі цієї сторінки.

Під час підготовки регулярного orchestrated stable release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега можна використати поточний повний SHA коміту гілки workflow
     для dry run передрелізного workflow лише для перевірки
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спочатку beta або `latest` лише
   тоді, коли ви навмисно хочете виконати пряму стабільну публікацію
3. Запустіть `Full Release Validation` на релізній гілці, релізному тегу або повному
   SHA коміту, коли потрібні звичайна CI, а також покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на релізному ref
5. Виберіть точний непререлізний тег релізу `openclaw/openclaw-windows-node`,
   чиї підписані інсталятори x64 і ARM64 мають бути випущені. Збережіть його як
   `windows_node_tag`, а їхню перевірену мапу дайджестів збережіть як
   `windows_node_installer_digests`. Допоміжний інструмент release-candidate записує обидва
   значення та включає їх у згенеровану команду публікації.
6. Збережіть успішні `preflight_run_id` і `full_release_validation_run_id`
7. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`,
   вибраним `windows_node_tag`, його збереженим `windows_node_installer_digests`,
   збереженим `preflight_run_id` і збереженим `full_release_validation_run_id`;
   він публікує винесені назовні plugins у npm і ClawHub перед просуванням
   npm-пакета OpenClaw
8. Якщо реліз потрапив у `beta`, використайте
   workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
9. Якщо реліз навмисно було опубліковано напряму в `latest`, а `beta`
   має негайно вказувати на ту саму стабільну збірку, використайте той самий релізний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag живе в репозиторії релізного журналу, бо вона все ще потребує
`NPM_TOKEN`, тоді як вихідний репозиторій зберігає публікацію лише через OIDC.

Це залишає і шлях прямої публікації, і шлях просування спочатку beta
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної автентифікації npm, запускайте будь-які
команди 1Password CLI (`op`) лише всередині окремої сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить prompts,
сповіщення та обробку OTP спостережуваними й запобігає повторним сповіщенням хоста.

## Публічні посилання

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers використовують приватну релізну документацію в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
