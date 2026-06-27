---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Пошук назви версій і каденції
summary: Канали випусків, контрольний список оператора, блоки валідації, іменування версій і каденція
title: Політика випусків
x-i18n:
    generated_at: "2026-06-27T18:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: передрелізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.PATCH`
  - Git-тег: `vYYYY.M.PATCH`
- Версія коригувального стабільного випуску: `YYYY.M.PATCH-N`
  - Git-тег: `vYYYY.M.PATCH-N`
- Версія передрелізу beta: `YYYY.M.PATCH-beta.N`
  - Git-тег: `vYYYY.M.PATCH-beta.N`
- Не доповнюйте місяць або patch нулями
- Починаючи з оновлення процесу випусків за червень 2026 року, третій компонент є
  послідовним номером щомісячного релізного поїзда, а не календарним днем. Стабільні та beta
  випуски визначають поточний поїзд; теги лише alpha не споживають і не
  просувають номер patch для beta/stable. Теги та версії npm до оновлення зберігають
  свої наявні назви й залишаються чинними; автоматизація випусків продовжує
  порівнювати їх за роком, місяцем, patch, каналом і номером передрелізу або
  корекції.
- Збірки alpha/nightly використовують наступний невипущений patch-поїзд і збільшують лише
  `alpha.N` для повторних збірок. Щойно цей patch має beta, нові alpha-збірки
  переходять до наступного patch. Ігноруйте застарілі теги лише alpha з вищими номерами
  patch під час вибору beta або stable поїзда.
- Версії npm є незмінними. Якщо beta-тег уже було опубліковано, не
  видаляйте, не публікуйте повторно й не використовуйте його повторно; випускайте наступний номер beta або наступний щомісячний
  patch. Оскільки `2026.6.5-beta.1` уже було опубліковано під час
  переходу, релізні поїзди червня 2026 року мають використовувати patch `5` або вище. Не
  публікуйте нові stable або beta поїзди червня 2026 року як `2026.6.2`, `2026.6.3` або
  `2026.6.4`.
- Після stable `2026.6.5` наступний новий beta-поїзд — `2026.6.6-beta.1`, навіть
  якщо автоматизовані теги лише alpha з вищими номерами patch уже існують.
- `latest` означає поточний просунутий стабільний випуск npm
- `beta` означає поточну ціль встановлення beta
- Стабільні та коригувальні стабільні випуски типово публікуються в npm `beta`; оператори випуску можуть явно вказати `latest` або просунути перевірену beta-збірку пізніше
- Кожен стабільний випуск OpenClaw постачає npm-пакет, застосунок macOS і підписані
  інсталятори Windows Hub разом; beta-випуски зазвичай спочатку перевіряють і публікують
  шлях npm/package, а збирання/підпис/нотаризація/просування нативного застосунку
  резервуються для stable, якщо це не запитано явно

## Ритм випусків

- Випуски рухаються спочатку через beta
- Stable слідує лише після перевірки останньої beta
- Maintainers зазвичай створюють випуски з гілки `release/YYYY.M.PATCH`, створеної
  з поточного `main`, щоб перевірка випуску й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег було надіслано або опубліковано і він потребує виправлення, maintainers створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, затвердження, облікові дані та нотатки з відновлення
  доступні лише maintainers

## Контрольний список оператора випуску

Цей контрольний список є публічною формою потоку випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
runbook випусків лише для maintainers.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Згенеруйте верхній розділ `CHANGELOG.md` із злитих PR і всіх прямих
   комітів від останнього досяжного тегу випуску. Залишайте записи орієнтованими на користувача,
   усувайте дублікати між PR і прямими комітами, закомітьте переписаний файл, надішліть його
   і ще раз виконайте rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.PATCH` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть усі потрібні місця з версіями для запланованого тегу, потім запустіть
   `pnpm release:prep`. Він оновлює версії plugins, інвентар plugins, схему конфігурації,
   метадані конфігурації bundled channel, базову лінію документації конфігурації, експорти plugin SDK
   і базову лінію API plugin SDK у правильному порядку. Закомітьте будь-який згенерований
   дрейф перед тегуванням. Потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тегу
   повний 40-символьний SHA гілки випуску дозволений лише для перевірки
   preflight. Preflight генерує докази випуску залежностей для
   точно перевіреного графа залежностей і зберігає їх в артефакті npm preflight.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових блоків випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в гілці випуску й перезапустіть найменший невдалий
   файл, канал, workflow job, профіль пакета, provider або allowlist моделі, що
   доводить виправлення. Перезапускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для тегованого кандидата beta запустіть
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` з відповідної
   гілки `release/YYYY.M.PATCH`. Для stable також передайте потрібний Windows source
   release:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Помічник запускає локальні перевірки згенерованого випуску, запускає або перевіряє
   докази повної release validation і npm preflight, виконує Parallels
   fresh/update proof проти точно підготовленого tarball плюс Telegram package
   proof, записує плани plugin npm і ClawHub і друкує точну
   команду `OpenClaw Release Publish` лише після того, як пакет доказів зелений.
   `OpenClaw Release Publish` відправляє вибрані або всі придатні до публікації plugin
   packages у npm і той самий набір у ClawHub паралельно, а потім просуває
   підготовлений артефакт OpenClaw npm preflight з відповідним dist-tag, щойно
   публікація plugin npm успішна.
   Після успіху дочірнього процесу публікації OpenClaw npm він створює або оновлює
   відповідну сторінку GitHub release/prerelease з повного відповідного
   розділу `CHANGELOG.md`. Стабільні випуски, опубліковані в npm `latest`, стають
   найновішим випуском GitHub; стабільні maintenance releases, залишені в npm `beta`,
   створюються з GitHub `latest=false`. Workflow також завантажує preflight
   dependency evidence, full-validation manifest і postpublish registry
   verification evidence до GitHub release для післярелізного реагування на інциденти.
   Workflow публікації негайно друкує child run IDs, автоматично затверджує
   release environment gates, які workflow token має право затверджувати, підсумовує
   невдалі child jobs з хвостами логів, закриває GitHub release і dependency
   evidence щойно публікація OpenClaw npm успішна, чекає на ClawHub щоразу,
   коли публікується OpenClaw npm, потім запускає `pnpm release:verify-beta` і
   завантажує postpublish evidence для GitHub release, npm package, вибраних
   plugin npm packages, вибраних ClawHub packages, child workflow run IDs і
   необов’язкового NPM Telegram run ID. Шлях ClawHub повторює тимчасові помилки
   встановлення CLI-залежностей, публікує plugins, які пройшли preview, навіть коли одна
   preview-комірка нестабільна, і завершується registry verification для кожної очікуваної
   версії plugin, щоб часткові публікації залишалися видимими й придатними до повтору. Потім запустіть post-publish
   package acceptance проти опублікованого
   `openclaw@YYYY.M.PATCH-beta.N` або
   `openclaw@beta` package. Якщо надісланий або опублікований prerelease потребує виправлення,
   створіть наступний відповідний номер prerelease; не видаляйте й не переписуйте старий
   prerelease.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази validation. Публікація stable npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight artifact через
    `preflight_run_id`; готовність stable macOS release також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
    Workflow публікації macOS автоматично публікує підписаний appcast у публічний `main`
    після перевірки release assets; якщо захист гілки блокує
    прямий push, він відкриває або оновлює appcast PR. Готовність stable Windows Hub
    потребує підписаних активів `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` і
    `OpenClawCompanion-SHA256SUMS.txt` у GitHub release OpenClaw.
    Передайте точний тег підписаного release `openclaw/openclaw-windows-node` як
    `windows_node_tag` і його схвалену кандидатом карту digest інсталяторів як
    `windows_node_installer_digests`; `OpenClaw Release Publish` зберігає
    чернетку release, запускає `Windows Node Release` і перевіряє всі три
    assets перед публікацією.
11. Після публікації запустіть npm post-publish verifier, необов’язковий standalone
    published-npm Telegram E2E, коли потрібен post-publish channel proof,
    просування dist-tag за потреби, перевірте згенеровану сторінку GitHub release,
    виконайте кроки оголошення випуску, потім завершіть [закриття stable main](#stable-main-closeout)
    перед тим, як вважати стабільний випуск завершеним.

## Закриття stable main

Публікацію stable не завершено, доки `main` не містить фактичний відвантажений
стан випуску.

1. Почніть зі свіжого найновішого `main`. Перевірте `release/YYYY.M.PATCH` відносно нього та
   перенесіть уперед справжні виправлення, яких немає в `main`. Не зливайте наосліп
   сумісність лише для релізу, тестові або валідаційні адаптери в новіший `main`.
2. Установіть `main` на випущену стабільну версію, а не на спекулятивну наступну гілку релізів. Запустіть
   `pnpm release:prep` після зміни кореневої версії, потім
   `pnpm deps:shrinkwrap:generate`.
3. Зробіть так, щоб розділ `## YYYY.M.PATCH` у `CHANGELOG.md` на `main` точно збігався з
   позначеною тегом релізною гілкою. Додайте стабільне оновлення `appcast.xml`, якщо mac
   реліз його опублікував.
4. Не додавайте `YYYY.M.PATCH+1`, бета-версію або порожній майбутній розділ журналу змін
   до `main`, доки оператор явно не запустить цю гілку релізів.
5. Запустіть `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` і
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Виконайте push, потім перевірте, що `origin/main`
   містить випущену версію та журнал змін, перш ніж вважати стабільний реліз
   завершеним.
6. Підтримуйте змінні репозиторію `RELEASE_ROLLBACK_DRILL_ID` і
   `RELEASE_ROLLBACK_DRILL_DATE` актуальними після кожного приватного навчального відкату.
   `OpenClaw Stable Main Closeout` починається з push у `main`, який містить
   випущену версію, журнал змін і appcast після стабільної публікації. Він читає
   незмінні докази після публікації, щоб прив’язати випущений тег до його запусків Full Release
   Validation і Publish, потім перевіряє стабільний стан main, реліз,
   обов’язкову стабільну витримку та блокувальні докази продуктивності. Він додає
   незмінний маніфест завершення та контрольну суму до релізу GitHub. Автоматичний
   тригер push пропускає застарілі релізи, що передують незмінним доказам після публікації;
   він ніколи не вважає такий пропуск завершеним завершенням. Повне
   завершення вимагає і ресурсів, і відповідної контрольної суми. Частковий маніфест
   повторює свій записаний SHA `main` і навчальний відкат, щоб повторно згенерувати ідентичні
   байти, а потім додає відсутню контрольну суму; недійсна пара або контрольна сума
   без маніфесту залишаються блокувальними. Запуск, ініційований push, без змінних репозиторію
   для навчального відкату пропускається без завершення closeout; відсутній або
   старіший ніж 90 днів запис навчання все одно блокує ручне завершення,
   підтверджене доказами. Приватні команди відновлення залишаються в runbook лише для мейнтейнерів.
   Використовуйте ручний dispatch лише для виправлення або повторного виконання підтвердженого доказами стабільного closeout.
   Тег виправлення застарілого fallback може повторно використати докази базового пакета лише тоді, коли
   тег виправлення вказує на той самий вихідний commit, що й базовий стабільний тег.
   Виправлення з іншим вихідним кодом має опублікувати й перевірити власні докази
   пакета.

## Передрелізна перевірка

- Виконайте `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним бар’єром `pnpm check`
- Виконайте `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів імпорту
  та меж архітектури були зеленими поза швидшим локальним бар’єром
- Виконайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку
  перевірки пакування
- Виконайте `pnpm release:prep` після підняття версії в корені й перед тегуванням. Він
  запускає кожен детермінований релізний генератор, який часто дрейфує після
  зміни версії/конфігурації/API: версії plugin, інвентар plugin, базову схему
  конфігурації, метадані конфігурації вбудованих каналів, базову лінію документації
  конфігурації, експорти SDK plugin і базову лінію API SDK plugin. `pnpm release:check` повторно запускає ці
  запобіжники в режимі перевірки й повідомляє про кожен знайдений збій дрейфу
  згенерованих файлів за один прохід перед запуском перевірок релізу пакета.
- Синхронізація версій Plugin типово оновлює версії пакетів офіційних plugin і наявні
  нижні межі `openclaw.compat.pluginApi` до релізної версії OpenClaw.
  Сприймайте це поле як нижню межу API SDK/runtime plugin, а не просто як копію
  версії пакета: для релізів лише plugin, які навмисно залишаються сумісними
  зі старішими хостами OpenClaw, залишайте нижню межу на найстарішому підтримуваному
  API хоста й документуйте цей вибір у доказі релізу plugin.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові середовища з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, міжплатформних
  перевірок пакета, паритету QA Lab, Matrix і ліній Telegram. Стабільні й повні
  запуски завжди включають вичерпні live/E2E та Docker release-path soak;
  `run_release_soak=true` збережено для явного beta soak. Package
  Acceptance надає канонічний пакетний Telegram E2E під час перевірки кандидата,
  уникаючи другого паралельного live poller.
  Надайте `release_package_spec` після публікації beta, щоб повторно використати відвантажений
  npm-пакет у release checks, Package Acceptance і пакетному Telegram
  E2E без повторного складання релізного tarball. Надавайте
  `npm_telegram_package_spec` лише тоді, коли Telegram має використовувати інший
  опублікований пакет, ніж решта перевірки релізу. Надайте
  `package_acceptance_package_spec`, коли Package Acceptance має використовувати
  інший опублікований пакет, ніж специфікація релізного пакета. Надайте
  `evidence_package_spec`, коли звіт доказів релізу має довести, що
  перевірка відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен побічний доказ
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для публічного HTTPS tarball з
  обов’язковим SHA-256 і суворою політикою публічних URL; `source=trusted-url` для
  іменованої політики довіреного джерела з обов’язковими `trusted_source_id` і SHA-256; або
  `source=artifact` для tarball, завантаженого іншим запуском GitHub Actions. Workflow
  розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker-лінії включають `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опубліковану базову лінію. `update-restart-auth` використовує пакет кандидата як
  встановлений CLI і як package-under-test, щоб перевірити керований шлях
  перезапуску команди оновлення кандидата.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: лінії встановлення/каналу/агента, мережі gateway і перезавантаження конфігурації
  - `package`: нативні для артефакта лінії пакета/оновлення/перезапуску/plugin без OpenWebUI або live ClawHub
  - `product`: профіль пакета плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запускайте ручний workflow `CI` напряму, коли потрібне лише детерміноване звичайне
  покриття CI для релізного кандидата. Ручні запуски CI обходять змінене
  обмеження області та примусово запускають Linux Node shards, shards вбудованих plugin, shards контрактів plugin і
  каналів, сумісність Node 22, `check-*`, `check-additional-*`,
  smoke-перевірки зібраних артефактів, перевірки документації, Python skills, Windows, macOS і
  лінії Control UI i18n. Окремі ручні запуски CI запускають Android лише тоді, коли їх запущено
  з `include_android=true`; `Full Release Validation` передає цей параметр своєму
  дочірньому CI.
  Приклад з Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Запускайте `pnpm qa:otel:smoke` під час перевірки релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експорт trace, metric і log,
  а також обмежені атрибути trace і редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm qa:otel:collector-smoke` під час перевірки сумісності collector.
  Він маршрутизує той самий OTLP-експорт QA-lab через справжній Docker-контейнер OpenTelemetry Collector
  перед перевірками локального receiver.
- Запускайте `pnpm qa:prometheus:smoke` під час перевірки захищеного Prometheus scraping.
  Він проганяє QA-lab, відхиляє неавтентифіковані scrape і перевіряє, що
  критичні для релізу сімейства метрик не містять вмісту prompt, сирих ідентифікаторів,
  auth tokens і локальних шляхів.
- Запускайте `pnpm qa:observability:smoke`, коли потрібні source-checkout
  OpenTelemetry і Prometheus smoke-лінії одна за одною.
- Виконуйте `pnpm release:check` перед кожним тегованим релізом
- Передрелізна перевірка `OpenClaw NPM Release` генерує релізні докази залежностей перед
  пакуванням npm tarball. Бар’єр npm advisory vulnerability є
  блокувальним для релізу. Ризик транзитивного маніфесту, поверхня ownership/install
  залежностей і звіти про зміни залежностей є лише релізними доказами. Звіт
  про зміни залежностей порівнює релізного кандидата з попереднім
  досяжним релізним тегом.
- Передрелізна перевірка завантажує докази залежностей як
  `openclaw-release-dependency-evidence-<tag>` і також вбудовує їх у
  `dependency-evidence/` всередині підготовленого npm preflight artifact. Справжній
  шлях публікації повторно використовує цей preflight artifact, потім прикріплює ті самі докази
  до релізу GitHub як `openclaw-<version>-dependency-evidence.zip`.
- Запускайте `OpenClaw Release Publish` для змінної послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.PATCH` (або `main`, коли публікуєте
  тег, досяжний з main), передайте релізний тег, успішний OpenClaw npm
  `preflight_run_id` і успішний `full_release_validation_run_id`, і залиште
  стандартну область публікації plugin `all-publishable`, якщо ви не виконуєте навмисно
  сфокусоване виправлення. Workflow серіалізує публікацію plugin npm, публікацію plugin
  ClawHub і публікацію OpenClaw npm, щоб основний пакет не було опубліковано
  до його зовнішніх plugin.
- Стабільний `OpenClaw Release Publish` вимагає точний `windows_node_tag` після того,
  як існує відповідний non-prerelease реліз `openclaw/openclaw-windows-node`.
  Він також вимагає затверджену для кандидата мапу `windows_node_installer_digests`.
  Перед запуском будь-якого дочірнього publish він перевіряє, що вихідний реліз
  опублікований, не є prerelease, містить потрібні інсталятори x64/ARM64 і
  досі відповідає цій затвердженій мапі. Потім він запускає `Windows Node Release`,
  поки реліз OpenClaw ще є чернеткою, передаючи закріплену мапу digest інсталяторів без змін. Дочірній
  workflow завантажує підписані інсталятори Windows Hub з цього точного тегу,
  звіряє їх із закріпленими digest, перевіряє, що їхні підписи Authenticode
  використовують очікуваного підписанта OpenClaw Foundation на Windows runner,
  записує маніфест SHA-256 і завантажує інсталятори плюс маніфест у
  канонічний GitHub-реліз OpenClaw, потім повторно завантажує просунуті assets і
  перевіряє належність до маніфесту та hashes. Батьківський workflow перевіряє поточний
  контракт assets x64, ARM64 і checksum перед публікацією. Пряме відновлення
  відхиляє неочікувані імена assets `OpenClawCompanion-*` перед заміною
  очікуваних контрактних assets закріпленими байтами джерела. Ручно запускайте
  `Windows Node Release` лише для відновлення й завжди передавайте точний тег, ніколи
  `latest`, а також явну JSON-мапу `expected_installer_digests` із
  затвердженого вихідного релізу. Посилання завантаження на сайті мають указувати на точні URL assets релізу OpenClaw
  для поточного стабільного релізу або на
  `releases/latest/download/...` лише після перевірки, що latest redirect GitHub
  вказує на той самий реліз; не посилайтеся лише на сторінку релізу companion repo.
- Тепер release checks виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity lane плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  лінії використовують середовище `qa-live-shared`; Telegram також використовує оренди облікових даних Convex CI.
  Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Міжплатформна перевірка runtime встановлення й оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте справжній шлях npm-релізу коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у своїй
  власній лінії, щоб вони не затримували й не блокували публікацію
- Релізні перевірки із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тегу
- Передрелізна перевірка лише валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у справжню публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; справжня публікація все одно вимагає справжній релізний тег
- Обидва workflow залишають справжній шлях публікації й просування на GitHub-hosted
  runners, тоді як незмінний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему лінію release checks
- Перед локальним тегуванням релізного кандидата виконайте
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Helper
  запускає швидкі релізні guardrails, перевірки релізу plugin npm/ClawHub, build,
  UI build і `release:openclaw:npm:check` у порядку, який виявляє типові
  помилки, що блокують схвалення, до старту workflow публікації GitHub.
- Виконайте `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після публікації npm виконайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (або відповідну beta/коригувальну версію), щоб перевірити шлях установлення з опублікованого реєстру
  у свіжому тимчасовому префіксі
- Після публікації beta запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding установленого пакета, налаштування Telegram і реальний Telegram E2E
  з опублікованим npm-пакетом, використовуючи спільний пул орендованих облікових даних Telegram.
  Локальні разові запуски супровідників можуть не вказувати змінні Convex і передавати три
  облікові дані env `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини супровідника, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Допоміжний скрипт запускає перевірку Parallels npm update/fresh-target, надсилає `NPM Telegram Beta E2E`, опитує точний запуск workflow, завантажує артефакт і друкує звіт Telegram.
- Супровідники можуть запустити ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів для супровідників тепер використовує preflight-then-promote:
  - справжня публікація npm має пройти успішний npm `preflight_run_id`
  - справжня публікація npm має бути надіслана з тієї самої гілки `main` або
    `release/YYYY.M.PATCH`, що й успішний preflight-запуск
  - стабільні релізи npm типово використовують `beta`
  - стабільна публікація npm може явно націлюватися на `latest` через вхідний параметр workflow
  - мутація npm dist-tag на основі токена тепер живе в
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, оскільки
    `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як вихідний репозиторій зберігає
    публікацію лише через OIDC
  - публічний `macOS Release` є лише перевіркою; коли тег існує тільки в
    release-гілці, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.PATCH`
  - справжня публікація macOS має пройти успішні macOS `preflight_run_id` і
    `validate_run_id`
  - справжні шляхи публікації просувають підготовлені артефакти замість того, щоб перебудовувати
    їх знову
- Для стабільних коригувальних релізів на кшталт `YYYY.M.PATCH-N` post-publish verifier
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.PATCH` до `YYYY.M.PATCH-N`,
  щоб корекції релізів не могли непомітно залишити старіші глобальні встановлення на
  базовому стабільному payload
- npm release preflight завершується fail-closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не поставили порожню браузерну dashboard
- Post-publish перевірка також перевіряє, що опубліковані entrypoints Plugin і
  metadata пакета присутні в установленій структурі реєстру. Реліз, який
  постачає відсутні runtime payloads Plugin, не проходить postpublish verifier і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  tarball кандидата оновлення, тож installer e2e ловить випадкове роздування pack
  до шляху публікації релізу
- Якщо релізна робота торкалася планування CI, маніфестів timing plugins або
  матриць тестів plugins, згенеруйте повторно й перегляньте керовані планувальником
  outputs матриці `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілу схему CI
- Готовність стабільного релізу macOS також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий стабільний zip після публікації; workflow
    публікації macOS комітить його автоматично або відкриває PR appcast,
    коли прямий push заблоковано
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї версії релізу

## Тестові бокси релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для доказу закріпленого коміту на швидко змінюваній гілці використовуйте
допоміжний скрипт, щоб кожен дочірній робочий процес запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Допоміжний скрипт надсилає `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен дочірній робочий процес `headSha`
збігається з ціллю, а потім видаляє тимчасову гілку. Це запобігає випадковому підтвердженню
новішого дочірнього запуску `main`.

Для перевірки релізної гілки або тегу запускайте його з довіреного посилання робочого процесу
`main` і передавайте релізну гілку або тег як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Робочий процес розв’язує цільове посилання, запускає ручний `CI` з
`target_ref=<release-ref>`, а потім запускає `OpenClaw Release Checks`.
`OpenClaw Release Checks` розгалужується на install smoke, крос-OS перевірки релізу,
live/E2E покриття релізного шляху Docker, коли ввімкнено soak, Package Acceptance
з канонічним Telegram package E2E, паритет QA Lab, live Matrix і live
Telegram. Повний/all запуск прийнятний лише тоді, коли підсумок `Full Release Validation`
показує `normal_ci`, `plugin_prerelease` і `release_checks` як
успішні, якщо тільки сфокусований повторний запуск навмисно не пропустив окремий дочірній
`Plugin Prerelease`. Використовуйте окремий дочірній `npm-telegram` лише для сфокусованого
повторного запуску опублікованого пакета з `release_package_spec` або
`npm_telegram_package_spec`. Фінальний підсумок
верифікатора містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб реліз-менеджер
бачив поточний критичний шлях без завантаження логів.
Див. [Повна перевірка релізу](/uk/reference/full-release-validation), щоб отримати
повну матрицю етапів, точні назви завдань робочого процесу, відмінності між stable і full профілями,
артефакти та маркери сфокусованих повторних запусків.
Дочірні робочі процеси запускаються з довіреного посилання, яке запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого вхідного параметра workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи посилання запуску робочого процесу.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомому `main`;
сирі SHA комітів не можуть бути посиланнями workflow dispatch, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший релізно-критичний OpenAI/core live і Docker шлях
- `stable`: minimum плюс стабільне покриття provider/backend для схвалення релізу
- `full`: stable плюс широке advisory покриття provider/media

Перевірки stable і full завжди запускають вичерпний live/E2E, Docker
релізний шлях і обмежений sweep виживання опублікованих оновлень перед промоцією.
Використовуйте `run_release_soak=true`, щоб запросити той самий sweep для бети. Цей sweep покриває
останні чотири stable пакети плюс закріплені базові версії `2026.4.23` і `2026.5.2`
плюс старіше покриття `2026.4.15`, з вилученням дублікатів базових версій і
шардингом кожної базової версії в окреме Docker runner job.

`OpenClaw Release Checks` використовує довірене посилання робочого процесу, щоб один раз розв’язати цільове
посилання як `release-package-under-test`, і повторно використовує цей артефакт у крос-OS,
Package Acceptance і Docker перевірках релізного шляху, коли запускається soak. Це утримує
всі package-facing бокси на тих самих байтах і уникає повторних збірок пакета.
Після того як бета вже є на npm, задайте `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`,
щоб release checks один раз завантажили відвантажений пакет, витягли SHA джерела збірки
з `dist/build-info.json` і повторно використали цей артефакт для крос-OS,
Package Acceptance, release-path Docker і package Telegram lanes.
Крос-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
змінну repo/org задано, інакше `openai/gpt-5.4`, тому що ця lane
підтверджує встановлення пакета, onboarding, запуск gateway і один live agent turn,
а не бенчмарк найповільнішої моделі за замовчуванням. Ширша live provider
матриця залишається місцем для покриття, специфічного для моделі.

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

Не використовуйте повну парасольку як перший повторний запуск після сфокусованого виправлення. Якщо один бокс
падає, використовуйте невдалий дочірній робочий процес, завдання, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну парасольку знову лише тоді,
коли виправлення змінило спільну оркестрацію релізу або зробило попередні докази all-box
застарілими. Фінальний верифікатор парасольки повторно перевіряє записані ids запусків дочірніх робочих процесів,
тому після успішного повторного запуску дочірнього робочого процесу повторно запустіть лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це справжній
запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише релізний дочірній plugin, `release-checks` запускає кожен релізний
бокс, а вужчі релізні групи — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують `release_package_spec` або
`npm_telegram_package_spec`; повні/all запуски використовують канонічний package Telegram
E2E всередині Package Acceptance. Сфокусовані
повторні запуски cross-OS можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або
інший фільтр OS/suite. Помилки QA release-check блокують звичайну перевірку релізу,
включно з обов’язковим OpenClaw dynamic tool drift у стандартному рівні.
Запуски Tideclaw alpha все ще можуть вважати non-package-safety release-check lanes
рекомендаційними. Коли `live_suite_filter` явно запитує gated QA live lane, як-от
Discord, WhatsApp або Slack, відповідну
змінну repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` має бути ввімкнено; інакше
захоплення вводу завершується помилкою замість тихого пропуску lane.

### Vitest

Бокс Vitest — це ручний дочірній робочий процес `CI`. Ручний CI навмисно
обходить changed scoping і примусово запускає звичайний граф тестів для release
candidate: Linux Node shards, bundled-plugin shards, plugin і channel contract
shards, сумісність Node 22, `check-*`, `check-additional-*`,
built-artifact smoke checks, docs checks, Python skills, Windows, macOS,
і Control UI i18n. Android включено, коли `Full Release Validation` запускає
бокс, тому що парасолька передає `include_android=true`; окремий ручний CI
потребує `include_android=true` для покриття Android.

Використовуйте цей бокс, щоб відповісти: «чи пройшло дерево джерел повний звичайний набір тестів?»
Це не те саме, що продуктова перевірка релізного шляху. Докази, які слід зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shards із завдань CI під час розслідування регресій
- артефакти часу Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли реліз потребує детермінованого звичайного CI, але
не Docker, QA Lab, live, cross-OS або package бокси. Використовуйте першу команду
для прямого CI без Android. Додайте `include_android=true`, коли прямий
release-candidate CI має покривати Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
робочий процес `install-smoke`. Він перевіряє release candidate через пакетовані
Docker середовища, а не лише тести рівня джерел.

Покриття релізного Docker включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що запускаються як окремі install-smoke
  shards
- repository E2E lanes
- Docker chunks релізного шляху: `core`, `package-update-openai`,
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
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Планувальник release-path завантажує
`.artifacts/docker-tests/` з логами lane, `summary.json`, `failures.json`,
часом фаз, JSON плану планувальника і командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступні, щоб
невдала lane могла повторно використати той самий tarball і GHCR images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це agentic
поведінковий і channel-level релізний gate, окремий від Vitest і Docker
механіки пакета.

Покриття релізного QA Lab включає:

- mock parity lane, що порівнює OpenAI candidate lane з базовою версією Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` або
  `pnpm qa:observability:smoke`, коли release telemetry потребує явного локального
  доказу

Використовуйте цей бокс, щоб відповісти: «чи поводиться реліз коректно в QA scenarios і
live channel flows?» Зберігайте URL артефактів для parity, Matrix і Telegram
lanes під час схвалення релізу. Повне покриття Matrix залишається доступним як
ручний sharded QA-Lab run, а не стандартна release-critical lane.

### Package

Бокс Package — це gate встановлюваного продукту. Його підтримують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує версію пакета і SHA-256, а також тримає
посилання workflow harness окремо від посилання джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакуйте довірену гілку `package_ref`, тег або повний SHA коміту
  з вибраним harness `workflow_ref`
- `source=url`: завантажте публічний HTTPS `.tgz` з обов’язковим `package_sha256`;
  облікові дані в URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціального призначення
  імена хостів або розв’язані адреси, а також небезпечні перенаправлення відхиляються
- `source=trusted-url`: завантажте HTTPS `.tgz` з обов’язковими
  `package_sha256` і `trusted_source_id` з іменованої політики в
  `.github/package-trusted-sources.json`; використовуйте це для корпоративних дзеркал або приватних репозиторіїв пакетів,
  якими володять мейнтейнери, замість додавання обходу приватної мережі на рівні входу до `source=url`
- `source=artifact`: повторно використайте `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає приймання пакета з `source=artifact`,
підготовленим артефактом пакета релізу, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Приймання пакета зберігає перевірки міграції, оновлення,
перезапуску після оновлення налаштованої автентифікації, встановлення Skills із live ClawHub, очищення застарілих залежностей Plugin, offline-фікстур Plugin,
оновлення Plugin і пакетного QA Telegram для того самого розв’язаного
tarball. Блокувальні перевірки релізу використовують стандартну базову лінію останнього опублікованого пакета;
бета-профіль із `run_release_soak=true`, `release_profile=stable` або
`release_profile=full` розширюється до кожної стабільної базової лінії, опублікованої в npm, від
`2026.4.23` до `latest` плюс фікстури повідомлених проблем. Використовуйте
приймання пакета з `source=npm` для вже випущеного кандидата,
`source=ref` для локального npm tarball, підкріпленого SHA, до публікації,
`source=trusted-url` для корпоративного/приватного дзеркала, яким володіє мейнтейнер, або
`source=artifact` для підготовленого tarball, завантаженого іншим запуском GitHub Actions.
Це нативна для GitHub
заміна більшості покриття пакетів/оновлень, яке раніше вимагало
Parallels. Крос-OS перевірки релізу все ще важливі для специфічного для OS onboarding,
інсталятора та поведінки платформи, але перевірка продукту для пакетів/оновлень має
надавати перевагу прийманню пакета.

Канонічний контрольний список для перевірки оновлень і Plugin —
[Тестування оновлень і Plugin](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка локальна, Docker, приймання пакета або перевірка релізу lane доводить
встановлення/оновлення Plugin, очищення doctor або зміну міграції опублікованого пакета.
Вичерпна міграція опублікованих оновлень з кожного стабільного пакета `2026.4.23+` є
окремим ручним workflow `Update Migration`, а не частиною повного CI релізу.

Застаріла поблажливість приймання пакета навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
у npm: приватні записи QA-інвентарю, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій з tarball,
відсутній збережений `update.channel`, застарілі розташування записів встановлення Plugin,
відсутнє збереження записів встановлення з marketplace і міграція метаданих config
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні файли штампів метаданих збірки, які вже були випущені. Пізніші пакети
мають відповідати сучасним контрактам пакетів; ті самі прогалини провалюють перевірку
релізу.

Використовуйте ширші профілі приймання пакета, коли питання релізу стосується
фактично встановлюваного пакета:

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

- `smoke`: швидкі lanes встановлення пакета/каналу/агента, мережі Gateway і перезавантаження config
- `package`: контракти встановлення/оновлення/перезапуску/пакета Plugin плюс live-доказ встановлення Skill із ClawHub; це стандарт для перевірки релізу
- `product`: `package` плюс канали MCP, очищення cron/subagent, вебпошук OpenAI і OpenWebUI
- `full`: Docker-частини шляху релізу з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для пакетного доказу Telegram для кандидата увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у прийманні пакета. Workflow передає
розв’язаний tarball `package-under-test` у Telegram lane; окремий
workflow Telegram усе ще приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною мутаційною точкою входу для публікації. Він
оркеструє workflows trusted-publisher у порядку, потрібному релізу:

1. Перевірити тег релізу та розв’язати SHA його коміту.
2. Переконатися, що тег досяжний з `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тією самою областю та SHA.
6. Запустити `OpenClaw NPM Release` з тегом релізу, npm dist-tag і
   збереженим `preflight_run_id` після перевірки збереженого
   `full_release_validation_run_id`.
7. Для стабільних релізів створити або оновити GitHub release як чернетку, запустити
   `Windows Node Release` з явним `windows_node_tag` і
   схваленими кандидатом `windows_node_installer_digests`, а також перевірити канонічні
   assets інсталятора/checksum перед публікацією чернетки.

Приклад публікації бета-версії:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Стабільна публікація до стандартного beta dist-tag:

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

Стабільне просування безпосередньо до `latest` є явним:

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

Використовуйте нижчорівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого ремонту або повторної публікації. `OpenClaw Release Publish` відхиляє
`plugin_publish_scope=selected`, коли `publish_openclaw_npm=true`, щоб основний
пакет не міг вийти без кожного придатного до публікації офіційного Plugin, включно з
`@openclaw/diffs-language-pack`. Для ремонту вибраного Plugin встановіть
`publish_openclaw_npm=false` з `plugin_publish_scope=selected` і
`plugins=@openclaw/name`, або запустіть дочірній workflow напряму.

## Входи workflow NPM

`OpenClaw NPM Release` приймає такі входи, керовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з перевіркою
- `preflight_only`: `true` лише для перевірки/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; стандартно `beta`

`OpenClaw Release Publish` приймає такі входи, керовані оператором:

- `tag`: обов’язковий тег релізу; має вже існувати
- `preflight_run_id`: успішний id preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `full_release_validation_run_id`: успішний id запуску `Full Release Validation`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `windows_node_tag`: точний непререлізний тег релізу `openclaw/openclaw-windows-node`;
  обов’язковий для стабільної публікації OpenClaw
- `windows_node_installer_digests`: схвалена кандидатом компактна JSON-мапа
  поточних імен інсталяторів Windows до їхніх закріплених digest `sha256:`; обов’язкова
  для стабільної публікації OpenClaw
- `npm_dist_tag`: цільовий npm-тег для пакета OpenClaw
- `plugin_publish_scope`: стандартно `all-publishable`; використовуйте `selected` лише
  для сфокусованого ремонту тільки Plugin з `publish_openclaw_npm=false`
- `plugins`: розділені комами імена пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: стандартно `true`; встановлюйте `false` лише коли використовуєте
  workflow як оркестратор ремонту тільки Plugin
- `wait_for_clawhub`: стандартно `false`, щоб доступність npm не блокувалася
  sidecar ClawHub; встановлюйте `true` лише коли завершення workflow має включати
  завершення ClawHub

`OpenClaw Release Checks` приймає такі входи, керовані оператором:

- `ref`: гілка, тег або повний SHA коміту для перевірки. Перевірки з секретами
  вимагають, щоб розв’язаний коміт був досяжний з гілки OpenClaw або
  тегу релізу.
- `run_release_soak`: увімкнути вичерпні live/E2E, Docker шлях релізу та
  all-since upgrade-survivor soak для перевірок бета-релізу. Примусово вмикається
  `release_profile=stable` і `release_profile=full`.

Правила:

- Стабільні та корекційні теги можуть публікуватися або до `beta`, або до `latest`
- Теги beta prerelease можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` вхід повного SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  лише перевірками
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення тегу можна використати поточний повний SHA коміту гілки workflow
     для dry run лише з валідацією preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спершу через beta або `latest` лише
   тоді, коли ви навмисно хочете напряму опублікувати стабільний реліз
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на release ref
5. Виберіть точний непререлізний тег релізу `openclaw/openclaw-windows-node`,
   чиї підписані інсталятори x64 і ARM64 мають постачатися. Збережіть його як
   `windows_node_tag`, а їхню перевірену мапу дайджестів збережіть як
   `windows_node_installer_digests`. Допоміжний засіб release-candidate записує обидва
   значення й додає їх до згенерованої команди публікації.
6. Збережіть успішні `preflight_run_id` і `full_release_validation_run_id`
7. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`,
   вибраним `windows_node_tag`, його збереженим `windows_node_installer_digests`,
   збереженим `preflight_run_id` і збереженим `full_release_validation_run_id`;
   він публікує зовнішні plugins до npm і ClawHub перед просуванням
   npm-пакета OpenClaw
8. Якщо реліз потрапив у `beta`, використайте
   workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
9. Якщо реліз навмисно опублікували напряму до `latest`, а `beta`
   має одразу вказувати на ту саму стабільну збірку, використайте той самий release
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag живе в репозиторії release ledger, оскільки їй досі потрібен
`NPM_TOKEN`, тоді як вихідний репозиторій зберігає публікацію лише через OIDC.

Це залишає і прямий шлях публікації, і шлях просування спершу через beta
задокументованими й видимими для оператора.

Якщо maintainer має повернутися до локальної автентифікації npm, запускайте будь-які команди 1Password
CLI (`op`) лише всередині окремої сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить prompts,
сповіщення й обробку OTP видимими та запобігає повторним сповіщенням хоста.

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

Maintainers використовують приватну документацію релізу в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
