---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакета або встановлення Plugin
    - Підготовка або затвердження реліз-кандидата
    - Налагодження оновлення пакета, очищення залежностей Plugin або регресій встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та плагіни'
x-i18n:
    generated_at: "2026-05-04T21:00:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для перевірки оновлень і Plugin. Мета
проста: довести, що інстальований пакет може оновлювати реальний стан
користувача, відновлювати застарілий legacy-стан через `doctor` і далі
встановлювати, завантажувати, оновлювати та видаляти Plugin з підтримуваних
джерел.

Ширшу мапу тестового runner див. у [Тестування](/uk/help/testing). Для ключів
live provider і suite, що торкаються мережі, див. [Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлень і Plugin захищають такі контракти:

- Tarball пакета є повним, має чинний `dist/postinstall-inventory.json` і не
  залежить від розпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на кандидатний
  пакет без втрати config, agents, sessions, workspaces, allowlist Plugin або
  config каналів.
- `openclaw doctor --fix --non-interactive` володіє шляхами legacy-очищення та
  відновлення. Startup не має нарощувати приховані compatibility-міграції для
  застарілого стану Plugin.
- Встановлення Plugin працює з локальних директорій, git repo, npm packages і
  шляху registry ClawHub.
- npm-залежності Plugin встановлюються в керований npm root, скануються перед
  довірою та видаляються через npm під час uninstall, щоб hoisted залежності не
  залишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: install records,
  resolved source, installed dependency layout і enabled state залишаються
  незмінними.

## Локальне підтвердження під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у install, uninstall, залежностях або package-inventory Plugin також
запускайте сфокусовані тести, що покривають відредагований seam:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перед тим як будь-яка package Docker lane споживатиме tarball, підтвердьте
артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки drift config/docs/API, записує package dist
inventory, виконує `npm pack --dry-run`, відхиляє заборонені packed files,
встановлює tarball у тимчасовий prefix, запускає postinstall і smoke-тестує
entrypoints bundled channel.

## Docker lanes

Docker lanes є підтвердженням на рівні продукту. Вони встановлюють або
оновлюють реальний пакет у Linux containers і перевіряють поведінку через CLI
commands, startup Gateway, HTTP probes, RPC status і filesystem state.

Під час ітерацій використовуйте сфокусовані lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Важливі lanes:

- `test:docker:plugins` перевіряє smoke install Plugin, installs local folder,
  поведінку skip для update local folder, local folders із попередньо
  встановленими залежностями, installs `file:` package, git installs із CLI
  execution, git moving-ref updates, npm registry installs із hoisted transitive
  dependencies, no-op для npm update, installs local ClawHub fixture і no-op
  update, поведінку marketplace update і Claude-bundle enable/inspect. Задайте
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub був hermetic/offline.
- `test:docker:plugin-lifecycle-matrix` встановлює candidate package у bare
  container, проганяє npm Plugin через install, inspect, disable, enable,
  explicit upgrade, explicit downgrade і uninstall після видалення коду Plugin.
  Він логуватиме RSS і CPU metrics для кожної фази.
- `test:docker:plugin-update` перевіряє, що незмінений встановлений Plugin не
  перевстановлюється і не втрачає install metadata під час `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює candidate tarball поверх dirty
  old-user fixture, запускає package update плюс non-interactive doctor, потім
  стартує Gateway на loopback і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спочатку встановлює published
  baseline, налаштовує його через baked recipe `openclaw config set`, оновлює
  до candidate tarball, запускає doctor, перевіряє legacy cleanup, стартує
  Gateway і пробує `/healthz`, `/readyz` та RPC status.
- `test:docker:update-migration` є cleanup-heavy published-update lane. Він
  стартує з налаштованого користувацького стану у стилі Discord/Telegram,
  запускає baseline doctor, щоб configured plugin dependencies мали шанс
  матеріалізуватися, сіє legacy plugin dependency debris для configured
  packaged Plugin, оновлює до candidate tarball і вимагає, щоб post-update
  doctor видалив legacy dependency roots.

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
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` і `versioned-runtime-deps`. В aggregate runs
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі
сценарії, сформовані як reported issues, включно з configured-plugin install migration.

Full update migration навмисно відокремлена від Full Release CI. Використовуйте
manual workflow `Update Migration`, коли release question звучить як "чи може
кожен опублікований stable release від 2026.4.23 і далі оновитися до цього
candidate і очистити plugin dependency debris?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance є GitHub-native package gate. Він розвʼязує один candidate
package у tarball `package-under-test`, записує version і SHA-256, а потім
запускає reusable Docker E2E lanes проти саме цього tarball. Workflow harness
ref відокремлений від package source ref, тому поточна test logic може
перевіряти старіші trusted releases.

Candidate sources:

- `source=npm`: перевірити `openclaw@beta`, `openclaw@latest` або точну
  published version.
- `source=ref`: запакувати trusted branch, tag або commit з вибраним current
  harness.
- `source=url`: перевірити HTTPS tarball з обовʼязковим `package_sha256`.
- `source=artifact`: повторно використати tarball, завантажений іншим Actions run.

Full Release Validation типово використовує `source=artifact`, зібраний із
resolved release SHA. Для post-publish proof передайте
`package_acceptance_package_spec=openclaw@YYYY.M.D`, щоб та сама upgrade matrix
цілилася в shipped npm package.

Release checks викликають Package Acceptance із package/update/plugin set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Вони також передають:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає package migration, update channel switching, stale plugin dependency
cleanup, offline plugin coverage, plugin update behavior і Telegram package QA
на одному resolved artifact.

`all-since-2026.4.23` є upgrade sample для Full Release CI: кожен stable npm-published release від `2026.4.23` до `latest`. Для exhaustive coverage
published update migration використовуйте `all-since-2026.4.23` в окремому
workflow Update Migration замість Full Release CI. `release-history` лишається
доступним для ручного ширшого sampling, коли вам також потрібен legacy pre-date
anchor.

Запустіть package profile вручну під час перевірки candidate перед release:

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

Використовуйте `suite_profile=product`, коли release question включає MCP
channels, cleanup cron/subagent, OpenAI web search або OpenWebUI.
Використовуйте `suite_profile=full` лише тоді, коли потрібне повне покриття
Docker release-path.

## Стандарт для release

Для release candidates стандартний proof stack такий:

1. `pnpm check:changed` і `pnpm test:changed` для регресій на рівні source.
2. `pnpm release:check` для цілісності package artifact.
3. Package Acceptance profile `package` або release-check custom package
   lanes для контрактів install/update/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   behavior.
5. Live suites лише тоді, коли змінена surface торкається provider або hosted-service
   behavior.

На maintainer machines широкі gates і Docker/package product proof мають
запускатися в Testbox, якщо явно не виконується local proof.

## Legacy compatibility

Compatibility leniency є вузькою і обмеженою в часі:

- Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть
  толерувати вже shipped package metadata gaps у Package Acceptance.
- Опублікований package `2026.4.26` може попереджати про local build metadata
  stamp files, які вже shipped.
- Пізніші packages мають відповідати сучасним контрактам. Ті самі gaps
  fail замість warning або skipping.

Не додавайте нові startup migrations для цих старих форм. Додайте або
розширте doctor repair, потім підтвердьте це через `upgrade-survivor` або
`published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте update або plugin behavior, додавайте coverage на найнижчому
рівні, який може fail з правильної причини:

- Pure path або metadata logic: unit test поруч із source.
- Package inventory або packed-file behavior: `package-dist-inventory` або
  tarball checker test.
- CLI install/update behavior: Docker lane assertion або fixture.
- Published-release migration behavior: scenario `published-upgrade-survivor`.
- Registry/package source behavior: fixture `test:docker:plugins` або ClawHub
  fixture server.
- Dependency layout або cleanup behavior: перевіряйте і runtime execution, і
  filesystem boundary. npm dependencies можуть бути hoisted під managed npm
  root, тому тести мають доводити, що root сканується/очищається, замість
  припускати package-local дерево `node_modules`.

Нові Docker fixtures типово мають бути hermetic. Використовуйте local fixture
registries і fake packages, якщо метою тесту не є live registry behavior.

## Тріаж збоїв

Починайте з artifact identity:

- Summary Package Acceptance `resolve_package`: source, version, SHA-256 і
  artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs і rerun commands.
- Summary upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  включно з baseline version, candidate version, scenario, phase timings і
  recipe steps.

Надавайте перевагу rerun точного failed lane з тим самим package artifact, а не
rerun усього release umbrella.
