---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте найменування версій і періодичність випусків
summary: Канали випусків, контрольний список оператора, бокси валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-07T15:13:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які стандартно публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: попередні теги випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення beta
- Стабільні та стабільні коригувальні випуски стандартно публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або просунути перевірену beta-збірку пізніше
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і macOS-застосунком;
  beta-випуски зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію mac-застосунку залишають для стабільного випуску, якщо це явно не запитано

## Ритм випусків

- Випуски рухаються спершу через beta
- Stable виходить лише після перевірки найновішої beta
- Мейнтейнери зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура випуску, погодження, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора випуску

Цей контрольний список є публічною формою процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і подробиці екстреного відкату залишаються в
runbook випуску, доступному лише мейнтейнерам.

1. Почніть із поточного `main`: отримайте найновіші зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте це, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце версії для запланованого тега, потім виконайте
   `pnpm release:prep`. Це оновлює версії plugins, інвентар plugins, схему
   конфігурації, метадані конфігурації bundled channel, базовий стан документації
   конфігурації, експорти plugin SDK і базовий стан API plugin SDK у правильному порядку. Закомітьте будь-який згенерований
   дрейф перед тегуванням. Потім виконайте локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   повний 40-символьний SHA гілки випуску дозволений для попередньої перевірки лише з метою валідації.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте в гілці випуску й повторно запустіть найменший невдалий
   файл, канал, job workflow, профіль пакета, provider або allowlist моделі, що
   доводить виправлення. Повторно запускайте повний umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   паралельно dispatch-ить усі придатні до публікації пакети plugins у npm і той самий набір у
   ClawHub, а потім просуває підготовлений артефакт попередньої перевірки OpenClaw npm
   з відповідним dist-tag, щойно публікація plugin в npm успішна.
   Публікація ClawHub може ще виконуватися, коли публікується OpenClaw npm, але
   workflow публікації випуску одразу виводить ID дочірніх запусків. Стандартно він
   не чекає ClawHub після dispatch, тому доступність OpenClaw npm
   не блокується повільнішими погодженнями ClawHub або роботою реєстру; встановіть
   `wait_for_clawhub=true`, коли ClawHub має блокувати завершення workflow. Шлях
   ClawHub повторює спроби після тимчасових збоїв встановлення залежностей CLI, публікує
   plugins, що пройшли preview, навіть коли одна preview-комірка дає збій, і завершується
   перевіркою реєстру для кожної очікуваної версії plugin, щоб часткові публікації
   залишалися видимими та придатними для повторної спроби. Після публікації запустіть
   післяпублікаційне приймання пакета
   для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований попередній випуск потребує виправлення,
   створіть наступний відповідний номер попереднього випуску; не видаляйте й не перезаписуйте старий
   попередній випуск.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    необхідні докази валідації. Публікація stable npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного macOS-випуску також вимагає
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm-перевірник після публікації, необов’язковий standalone
    опублікований-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки import
  cycle і архітектурних меж були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку перевірки
  пакування
- Запустіть `pnpm release:prep` після bump версії root і перед tag. Він
  запускає кожен детермінований релізний генератор, який зазвичай розходиться після
  зміни версії/config/API: версії plugin, інвентар plugin, базову схему config,
  metadata config bundled channel, baseline docs config, exports plugin SDK
  і baseline API plugin SDK. `pnpm release:check` повторно запускає ці
  guards у режимі перевірки й повідомляє про кожен збій generated drift, який знаходить, за один
  прохід перед запуском перевірок package release.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні test boxes з однієї entrypoint. Він приймає branch,
  tag або повний commit SHA, dispatches ручний `CI` і dispatches
  `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS
  package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default runs
  тримають вичерпні live/E2E і Docker release-path soak за
  `run_release_soak=true`; `release_profile=full` примусово вмикає soak. З
  `release_profile=full` і `rerun_group=all` він також запускає package Telegram
  E2E проти артефакта `release-package-under-test` з release checks.
  Надайте `npm_telegram_package_spec` після publishing, коли той самий
  Telegram E2E має також довести published npm package. Надайте
  `package_acceptance_package_spec` після publishing, коли Package Acceptance
  має запускати свою package/update matrix проти shipped npm package замість
  артефакта, зібраного з SHA. Надайте
  `evidence_package_spec`, коли private evidence report має довести, що
  validation відповідає published npm package, без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен side-channel proof
  для package candidate, поки release work триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної release version; `source=ref`,
  щоб запакувати trusted `package_ref` branch/tag/SHA з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов'язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим GitHub
  Actions run. Workflow resolves candidate to
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  selected Docker lanes include `published-upgrade-survivor`, package
  artifact є candidate, а `published_upgrade_survivor_baseline` вибирає
  published baseline. `update-restart-auth` використовує candidate package як
  встановлений CLI і як package-under-test, щоб перевірити managed restart path
  команди candidate update.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: install/channel/agent, gateway network і config reload lanes
  - `package`: artifact-native package/update/restart/plugin lanes без OpenWebUI або live ClawHub
  - `product`: profile package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для focused rerun
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  coverage для release candidate. Manual CI dispatches обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час перевірки release telemetry. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і верифікує exported trace
  span names, bounded attributes і redaction content/identifier без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним tagged release
- Запустіть `OpenClaw Release Publish` для mutating publish sequence після того, як
  tag існує. Dispatch it from `release/YYYY.M.D` (or `main` when publishing a
  main-reachable tag), pass the release tag and successful OpenClaw npm
  `preflight_run_id`, and keep the default plugin publish scope
  `all-publishable` unless you are deliberately running a focused repair. The
  workflow serializes plugin npm publish, plugin ClawHub publish, and OpenClaw
  npm publish so the core package is not published before its externalized
  plugins.
- Release checks now run in a separate manual workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` also runs the QA Lab mock parity lane plus the fast
  live Matrix profile and Telegram QA lane before release approval. The live
  lanes use the `qa-live-shared` environment; Telegram also uses Convex CI
  credential leases. Run the manual `QA-Lab - All Lanes` workflow with
  `matrix_profile=all` and `matrix_shards=true` when you want full Matrix
  transport, media, and E2EE inventory in parallel.
- Cross-OS install and upgrade runtime validation is part of public
  `OpenClaw Release Checks` and `Full Release Validation`, which call the
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` directly
- This split is intentional: keep the real npm release path short,
  deterministic, and artifact-focused, while slower live checks stay in their
  own lane so they do not stall or block publish
- Secret-bearing release checks should be dispatched through `Full Release
Validation` or from the `main`/release workflow ref so workflow logic and
  secrets stay controlled
- `OpenClaw Release Checks` accepts a branch, tag, or full commit SHA as long
  as the resolved commit is reachable from an OpenClaw branch or release tag
- `OpenClaw NPM Release` validation-only preflight also accepts the current
  full 40-character workflow-branch commit SHA without requiring a pushed tag
- That SHA path is validation-only and cannot be promoted into a real publish
- In SHA mode the workflow synthesizes `v<package.json version>` only for the
  package metadata check; real publish still requires a real release tag
- Both workflows keep the real publish and promotion path on GitHub-hosted
  runners, while the non-mutating validation path can use the larger
  Blacksmith Linux runners
- That workflow runs
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  using both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` workflow secrets
- npm release preflight no longer waits on the separate release checks lane
- Run `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (or the matching beta/correction tag) before approval
- After npm publish, run
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (or the matching beta/correction version) to verify the published registry
  install path in a fresh temp prefix
- After a beta publish, run `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  to verify installed-package onboarding, Telegram setup, and real Telegram E2E
  against the published npm package using the shared leased Telegram credential
  pool. Local maintainer one-offs may omit the Convex vars and pass the three
  `OPENCLAW_QA_TELEGRAM_*` env credentials directly.
- To run the full post-publish beta smoke from a maintainer machine, use `pnpm release:beta-smoke -- --beta betaN`. The helper runs Parallels npm update/fresh-target validation, dispatches `NPM Telegram Beta E2E`, polls the exact workflow run, downloads the artifact, and prints the Telegram report.
- Maintainers can run the same post-publish check from GitHub Actions via the
  manual `NPM Telegram Beta E2E` workflow. It is intentionally manual-only and
  does not run on every merge.
- Maintainer release automation now uses preflight-then-promote:
  - real npm publish must pass a successful npm `preflight_run_id`
  - the real npm publish must be dispatched from the same `main` or
    `release/YYYY.M.D` branch as the successful preflight run
  - stable npm releases default to `beta`
  - stable npm publish can target `latest` explicitly via workflow input
  - token-based npm dist-tag mutation now lives in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    for security, because `npm dist-tag add` still needs `NPM_TOKEN` while the
    public repo keeps OIDC-only publish
  - public `macOS Release` is validation-only; when a tag lives only on a
    release branch but the workflow is dispatched from `main`, set
    `public_release_branch=release/YYYY.M.D`
  - real private mac publish must pass successful private mac
    `preflight_run_id` and `validate_run_id`
  - the real publish paths promote prepared artifacts instead of rebuilding
    them again
- For stable correction releases like `YYYY.M.D-N`, the post-publish verifier
  also checks the same temp-prefix upgrade path from `YYYY.M.D` to `YYYY.M.D-N`
  so release corrections cannot silently leave older global installs on the
  base stable payload
- npm release preflight fails closed unless the tarball includes both
  `dist/control-ui/index.html` and a non-empty `dist/control-ui/assets/` payload
  so we do not ship an empty browser dashboard again
- Post-publish verification also checks that published plugin entrypoints and
  package metadata are present in the installed registry layout. A release that
  ships missing plugin runtime payloads fails the postpublish verifier and
  cannot be promoted to `latest`.
- `pnpm test:install:smoke` also enforces the npm pack `unpackedSize` budget on
  the candidate update tarball, so installer e2e catches accidental pack bloat
  before the release publish path
- If the release work touched CI planning, extension timing manifests, or
  extension test matrices, regenerate and review the planner-owned
  `plugin-prerelease-extension-shard` matrix outputs from
  `.github/workflows/plugin-prerelease.yml` before approval so release notes do
  not describe a stale CI layout
- Stable macOS release readiness also includes the updater surfaces:
  - the GitHub release must end up with the packaged `.zip`, `.dmg`, and `.dSYM.zip`
  - `appcast.xml` on `main` must point at the new stable zip after publish
  - the packaged app must keep a non-debug bundle id, a non-empty Sparkle feed
    URL, and a `CFBundleVersion` at or above the canonical Sparkle build floor
    for that release version

## Release test boxes

`Full Release Validation` is how operators kick off all pre-release tests from
one entrypoint. For a pinned commit proof on a fast-moving branch, use the
helper so every child workflow runs from a temporary branch fixed at the target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

The helper pushes `release-ci/<sha>-...`, dispatches `Full Release Validation`
from that branch with `ref=<sha>`, verifies every child workflow `headSha`
matches the target, then deletes the temporary branch. This avoids proving a
newer `main` child run by accident.

Для перевірки релізної гілки або тегу запускайте це з довіреного ref workflow `main` і передавайте релізну гілку або тег як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, орієнтованих
на пакет, і запускає автономний пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Далі `OpenClaw Release
Checks` розгортає install smoke, cross-OS release checks, live/E2E Docker
покриття релізного шляху, коли soak увімкнено, Package Acceptance з Telegram
package QA, QA Lab parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальний
підсумок верифікатора містить таблиці найповільніших jobs для кожного дочірнього запуску, щоб релізний
менеджер міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
повної матриці етапів, точних назв workflow jobs, відмінностей між stable і full профілями,
артефактів і цільових механізмів перезапуску.
Дочірні workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого входу workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомому `main`;
сирі commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший критичний для релізу OpenAI/core live і Docker шлях
- `stable`: minimum плюс стабільне покриття provider/backend для затвердження релізу
- `full`: stable плюс широке advisory покриття provider/media

Використовуйте `run_release_soak=true` зі `stable`, коли release-blocking lanes
зелені й вам потрібні вичерпні live/E2E, Docker release-path і
обмежений sweep published upgrade-survivor перед промоцією. Цей sweep покриває
чотири найновіші stable пакети плюс закріплені базові версії `2026.4.23` і `2026.5.2`
та старіше покриття `2026.4.15`, з вилученням дубльованих базових версій і
розбиттям кожної базової версії в окремий Docker runner job. `full` передбачає
`run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт у cross-OS,
Package Acceptance і Docker перевірках release-path, коли запускається soak. Це тримає
всі package-facing boxes на тих самих байтах і уникає повторних збірок пакета.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
repo/org variable задано, інакше `openai/gpt-5.4`, оскільки ця lane
перевіряє встановлення пакета, onboarding, запуск gateway і один live agent turn,
а не benchmark найповільнішої моделі за замовчуванням. Ширша live provider
matrix залишається місцем для model-specific coverage.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
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
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну парасольку як перший перезапуск після цільового виправлення. Якщо один box
падає, використовуйте невдалий дочірній workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну парасольку знову лише тоді, коли
виправлення змінило спільну релізну оркестрацію або зробило попередні all-box докази
застарілими. Фінальний верифікатор парасольки повторно перевіряє записані child workflow run
ids, тому після успішного перезапуску дочірнього workflow перезапустіть лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` — це справжній
запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only дочірній plugin, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Цільові перезапуски `npm-telegram` потребують `npm_telegram_package_spec`; запуски full/all
з `release_profile=full` використовують package artifact із release-checks. Цільові
cross-OS перезапуски можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або
інший OS/suite filter. Помилки QA release-checks є advisory; QA-only
помилка не блокує release validation.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: "чи пройшло дерево source повний звичайний test suite?"
Це не те саме, що release-path product validation. Докази, які слід зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному target SHA
- назви невдалих або повільних shards з CI jobs під час розслідування регресій
- артефакти часу Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він перевіряє release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що працюють як окремі install-smoke
  shards
- repository E2E lanes
- Docker chunks release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед перезапуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і командами перезапуску. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` на reusable live/E2E workflow замість
перезапуску всіх release chunks. Згенеровані команди перезапуску включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступні, щоб
невдала lane могла повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity lane, що порівнює OpenAI candidate lane з базовою версією Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти: "чи поводиться реліз правильно у QA сценаріях і
live channel flows?" Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час затвердження релізу. Повне Matrix coverage залишається доступним як
ручний sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це gate інстальованого продукту. Його забезпечують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує версію пакета та SHA-256 і тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: упакувати довірену `package_ref` branch, tag або full commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update,
configured-auth update restart, stale plugin dependency cleanup, offline plugin
fixtures, plugin update і Telegram package QA проти того самого resolved
tarball. Blocking release checks використовують default latest published package
baseline; `run_release_soak=true` або
`release_profile=full` розширює це до кожної stable npm-published baseline від
`2026.4.23` до `latest` плюс reported-issue fixtures. Використовуйте
Package Acceptance з `source=npm` для вже shipped candidate, або
`source=ref`/`source=artifact` для локального npm tarball з SHA-backed перед
публікацією. Це GitHub-native
заміна для більшості package/update coverage, яке раніше потребувало
Parallels. Cross-OS release checks все ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка локальна, Docker, Package Acceptance або release-check lane доводить
зміну plugin install/update, doctor cleanup або published-package migration.
Вичерпна published update migration з кожного stable package `2026.4.23+` —
це окремий ручний workflow `Update Migration`, а не частина Full Release CI.

Застаріле пом’якшення для приймання пакетів навмисно обмежене в часі. Пакети до
`2026.4.25` включно можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
у npm: приватні записи інвентарю QA, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні файли патчів у git-фікстурі, отриманій із tarball,
відсутній збережений `update.channel`, застарілі розташування записів встановлення plugin,
відсутнє збереження записів встановлення marketplace, а також міграція метаданих
конфігурації під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні файли штампів метаданих збірки, які вже були випущені. Пізніші пакети
мають відповідати сучасним контрактам пакетів; ті самі прогалини призводять до збою
валідації релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
фактичного встановлюваного пакета:

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

- `smoke`: швидкі смуги встановлення пакета/каналу/агента, мережі Gateway і
  перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/перезапуску/пакета plugin без живого
  ClawHub; це стандарт для перевірки релізу
- `product`: `package` плюс канали MCP, очищення cron/субагентів, вебпошук OpenAI
  і OpenWebUI
- `full`: фрагменти шляху релізу Docker з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження Telegram кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у смугу Telegram; окремий
workflow Telegram і далі приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` — це звичайна мутувальна точка входу для публікації. Вона
оркеструє workflow довіреного видавця в потрібному для релізу порядку:

1. Отримати тег релізу та визначити SHA його коміту.
2. Перевірити, що тег досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тією самою областю і SHA.
6. Запустити `OpenClaw NPM Release` з тегом релізу, npm dist-tag і
   збереженим `preflight_run_id`.

Приклад публікації бети:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільна публікація до стандартного beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільне просування безпосередньо до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте низькорівневі workflow `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого виправлення або повторної публікації. Для виправлення вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або запустіть дочірній workflow напряму, коли
пакет OpenClaw не має бути опублікований.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі контрольовані оператором вхідні параметри:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, ним також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; стандартно `beta`

`OpenClaw Release Publish` приймає такі контрольовані оператором вхідні параметри:

- `tag`: обов’язковий тег релізу; має вже існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий тег npm для пакета OpenClaw
- `plugin_publish_scope`: стандартно `all-publishable`; використовуйте `selected` лише
  для сфокусованого виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: стандартно `true`; встановлюйте `false` лише коли використовуєте
  workflow як оркестратор виправлення тільки для plugin

`OpenClaw Release Checks` приймає такі контрольовані оператором вхідні параметри:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки з секретами
  вимагають, щоб розв’язаний коміт був досяжний із гілки OpenClaw або
  тегу релізу.
- `run_release_soak`: увімкнення вичерпного live/E2E, шляху релізу Docker і
  all-since upgrade-survivor soak для стабільних/стандартних перевірок релізу. Його примусово
  вмикає `release_profile=full`.

Правила:

- Стабільні й корекційні теги можуть публікуватися або до `beta`, або до `latest`
- Бета-пререлізні теги можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного SHA коміту дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди виконують лише
  валідацію
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До існування тегу можна використати поточний повний SHA коміту гілки workflow
     для пробного запуску preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спочатку через beta або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив у `beta`, використовуйте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для просування цієї стабільної версії з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму до `latest`, а `beta`
   має одразу вказувати на ту саму стабільну збірку, використовуйте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить і шлях прямої публікації, і шлях просування спочатку через beta
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди
CLI 1Password (`op`) лише всередині виділеної tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; утримання його всередині tmux робить запити,
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
