---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакета або встановлення Plugin
    - Підготовка або затвердження реліз-кандидата
    - Налагодження регресій оновлення пакета, очищення залежностей Plugin або встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та Plugins'
x-i18n:
    generated_at: "2026-05-03T08:23:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для перевірки оновлень і Plugin. Мета
проста: довести, що встановлюваний пакет може оновлювати реальний стан користувача, виправляти застарілий
legacy-стан через `doctor` і досі встановлювати, завантажувати, оновлювати та видаляти
Plugin із підтримуваних джерел.

Для ширшої мапи засобу запуску тестів див. [Тестування](/uk/help/testing). Для live-ключів провайдерів
і наборів тестів, що торкаються мережі, див. [Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлень і Plugin захищають ці контракти:

- Tarball пакета є повним, має валідний `dist/postinstall-inventory.json`
  і не залежить від розпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на пакет-кандидат
  без втрати конфігурації, агентів, сесій, робочих просторів, allowlist Plugin або
  конфігурації каналу.
- `openclaw doctor --fix --non-interactive` володіє шляхами очищення та виправлення
  legacy-стану. Startup не має розростатися прихованими міграціями сумісності для застарілого
  стану Plugin.
- Встановлення Plugin працює з локальних каталогів, git-репозиторіїв, npm-пакетів і
  шляху реєстру ClawHub.
- npm-залежності Plugin встановлюються в керований npm root, скануються перед
  довірою і видаляються через npm під час видалення, щоб hoisted-залежності не
  залишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: записи встановлення, resolved
  source, структура встановлених залежностей і enabled-стан залишаються неушкодженими.

## Локальний доказ під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін установлення, видалення, залежностей Plugin або package-inventory також
запустіть сфокусовані тести, що покривають змінений seam:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перш ніж будь-яка package Docker lane використає tarball, доведіть артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки drift для конфігурації/документації/API, записує package dist
inventory, запускає `npm pack --dry-run`, відхиляє заборонені запаковані файли, встановлює
tarball у тимчасовий prefix, запускає postinstall і smoke-тестує bundled entrypoints каналів.

## Docker lanes

Docker lanes є доказом рівня продукту. Вони встановлюють або оновлюють реальний
пакет усередині Linux-контейнерів і перевіряють поведінку через CLI-команди,
запуск Gateway, HTTP-зонди, RPC-статус і стан файлової системи.

Використовуйте сфокусовані lanes під час ітерацій:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Важливі lanes:

- `test:docker:plugins` перевіряє plugin install smoke, встановлення локальних папок,
  skip-поведінку оновлення локальних папок, локальні папки з попередньо встановленими
  залежностями, встановлення `file:`-пакетів, git-встановлення з виконанням CLI, оновлення git
  moving-ref, встановлення з npm-реєстру з hoisted transitive
  dependencies, no-op оновлення npm, встановлення з локального ClawHub fixture та no-op
  оновлення, поведінку marketplace update і enable/inspect для Claude-bundle. Встановіть
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub залишався hermetic/offline.
- `test:docker:plugin-lifecycle-matrix` встановлює пакет-кандидат у чистому
  контейнері, проводить npm Plugin через install, inspect, disable, enable,
  explicit upgrade, explicit downgrade і uninstall після видалення коду Plugin.
  Він логує RSS і CPU-метрики для кожної фази.
- `test:docker:plugin-update` перевіряє, що незмінений установлений Plugin
  не перевстановлюється і не втрачає metadata встановлення під час `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює tarball-кандидат поверх брудного
  old-user fixture, запускає package update плюс non-interactive doctor, потім запускає
  local loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спершу встановлює опублікований baseline,
  налаштовує його через baked recipe `openclaw config set`, оновлює його до
  tarball-кандидата, запускає doctor, перевіряє legacy cleanup, запускає Gateway і
  зондує `/healthz`, `/readyz` і RPC-статус.
- `test:docker:update-migration` — cleanup-heavy lane опублікованого оновлення. Вона
  стартує з налаштованого Discord/Telegram-style стану користувача, запускає baseline
  doctor, щоб налаштовані залежності Plugin мали шанс матеріалізуватися, сідує
  legacy plugin dependency debris для налаштованого packaged Plugin, оновлює до
  tarball-кандидата і вимагає від post-update doctor видалити legacy
  dependency roots.

Корисні варіанти published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Доступні сценарії: `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` і
`versioned-runtime-deps`. В aggregate runs,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі reported
issue-shaped сценарії, включно з міграцією configured-plugin install.

Повна update migration навмисно відокремлена від Full Release CI. Використовуйте
ручний workflow `Update Migration`, коли питання релізу звучить так: "чи може кожен
опублікований stable release від 2026.4.23 і далі оновитися до цього кандидата і
очистити plugin dependency debris?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance — це GitHub-native package gate. Він resolve-ить один пакет-кандидат
у tarball `package-under-test`, записує версію та SHA-256, а потім
запускає reusable Docker E2E lanes проти саме цього tarball. Workflow harness
ref відокремлений від package source ref, тому поточна логіка тестів може перевіряти
старіші trusted releases.

Джерела кандидатів:

- `source=npm`: перевірити `openclaw@beta`, `openclaw@latest` або точну
  опубліковану версію.
- `source=ref`: запакувати trusted branch, tag або commit з вибраним поточним
  harness.
- `source=url`: перевірити HTTPS tarball з обов’язковим `package_sha256`.
- `source=artifact`: повторно використати tarball, завантажений іншим Actions run.

Full Release Validation за замовчуванням використовує `source=artifact`, побудований із
resolved release SHA. Для post-publish доказу передайте
`package_acceptance_package_spec=openclaw@YYYY.M.D`, щоб та сама upgrade matrix
цілилася в shipped npm package натомість.

Release checks викликають Package Acceptance з package/update/plugin set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Вони також передають:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає package migration, update channel switching, cleanup застарілих plugin dependency,
offline-покриття Plugin, поведінку оновлення Plugin і Telegram package
QA на тому самому resolved artifact.

`all-since-2026.4.23` — це upgrade sample Full Release CI: кожен stable npm-published release від `2026.4.23` до `latest`. Для вичерпного покриття published
update migration використовуйте `all-since-2026.4.23` в окремому workflow Update
Migration замість Full Release CI. `release-history` залишається
доступним для ручного ширшого sampling, коли вам також потрібен legacy pre-date
anchor.

Запустіть package profile вручну під час перевірки кандидата перед релізом:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Використовуйте `suite_profile=product`, коли питання релізу включає MCP-канали,
cleanup cron/subagent, OpenAI web search або OpenWebUI. Використовуйте `suite_profile=full`
лише тоді, коли потрібне повне Docker-покриття release-path.

## Типове значення для релізу

Для release candidates типовий стек доказів такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level regressions.
2. `pnpm release:check` для цілісності артефакту пакета.
3. Package Acceptance `package` profile або release-check custom package
   lanes для контрактів install/update/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   behavior.
5. Live-набори лише тоді, коли змінена surface торкається поведінки провайдера або hosted-service.

На maintainer machines широкі gates і Docker/package product proof мають запускатися
в Testbox, якщо явно не виконується local proof.

## Legacy-сумісність

Leniency сумісності є вузькою і time boxed:

- Пакети до `2026.4.25` включно, включно з `2026.4.25-beta.*`, можуть tolerates
  вже shipped package metadata gaps у Package Acceptance.
- Опублікований пакет `2026.4.26` може попереджати про local build metadata stamp
  files, які вже були shipped.
- Пізніші пакети мають відповідати modern contracts. Ті самі gaps fail замість
  warning або skipping.

Не додавайте нові startup migrations для цих старих shapes. Додайте або розширте doctor
repair, потім доведіть це за допомогою `upgrade-survivor` або `published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте поведінку оновлення або Plugin, додавайте покриття на найнижчому рівні, який
може fail з правильної причини:

- Чиста path або metadata logic: unit test поруч із source.
- Package inventory або packed-file behavior: `package-dist-inventory` або tarball
  checker test.
- CLI install/update behavior: Docker lane assertion або fixture.
- Published-release migration behavior: сценарій `published-upgrade-survivor`.
- Registry/package source behavior: fixture `test:docker:plugins` або сервер fixture
  ClawHub.
- Dependency layout або cleanup behavior: перевіряйте і runtime execution, і
  filesystem boundary. npm dependencies можуть бути hoisted під managed npm
  root, тому тести мають довести, що root сканується/очищається, замість припускати
  package-local дерево `node_modules`.

Нові Docker fixtures за замовчуванням мають бути hermetic. Використовуйте локальні fixture registries і
fake packages, якщо тільки мета тесту не полягає в live registry behavior.

## Тріаж помилок

Починайте з ідентичності артефакту:

- Package Acceptance `resolve_package` summary: source, version, SHA-256 і
  artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs і rerun commands.
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`,
  включно з baseline version, candidate version, scenario, phase timings і
  recipe steps.

Віддавайте перевагу повторному запуску точної failed lane з тим самим package artifact над
повторним запуском усього release umbrella.
