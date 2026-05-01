---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакетів або встановлення Plugin
    - Підготовка або затвердження реліз-кандидата
    - Налагодження оновлення пакета, очищення залежностей Plugin або регресій встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та Plugin'
x-i18n:
    generated_at: "2026-05-01T22:37:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc3cfa7b6a1ede28dfb12940b56d34d3f8ca4d539c26fd818d663d7052f962a8
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це окремий контрольний список для перевірки оновлень і плагінів. Мета
проста: довести, що інстальований пакет може оновлювати реальний стан користувача,
виправляти застарілий legacy-стан через `doctor` і надалі встановлювати,
завантажувати, оновлювати та видаляти плагіни з підтримуваних джерел.

Ширшу мапу тестового раннера див. у [Тестування](/uk/help/testing). Про live-ключі
провайдерів і набори, що звертаються до мережі, див. [Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлень і плагінів захищають такі контракти:

- Tarball пакета повний, має чинний `dist/postinstall-inventory.json` і не
  залежить від розпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на пакет-кандидат
  без втрати конфігурації, агентів, сесій, робочих просторів, allowlist плагінів
  або конфігурації каналів.
- `openclaw doctor --fix --non-interactive` відповідає за legacy-очищення та
  шляхи відновлення. Startup не має нарощувати приховані міграції сумісності для
  застарілого стану плагінів.
- Встановлення плагінів працює з локальних директорій, git-репозиторіїв, npm-пакетів
  і шляху реєстру ClawHub.
- npm-залежності плагінів встановлюються в керований npm root, скануються перед
  довірою і видаляються через npm під час uninstall, щоб hoisted-залежності не
  лишалися.
- Оновлення плагіна стабільне, коли нічого не змінилося: записи встановлення,
  resolved source і стан enabled лишаються неушкодженими.

## Локальне підтвердження під час розробки

Почніть вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у встановленні, видаленні, залежностях плагінів або package inventory також
запускайте сфокусовані тести, що покривають відредаговану межу:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перед тим як будь-який Docker lane пакета використає tarball, підтвердьте артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки drift для config/docs/API, записує package dist
inventory, виконує `npm pack --dry-run`, відхиляє заборонені packed files, встановлює
tarball у тимчасовий prefix, запускає postinstall і виконує smoke-перевірки bundled
channel entrypoints.

## Docker lanes

Docker lanes є product-level підтвердженням. Вони встановлюють або оновлюють реальний
пакет усередині Linux-контейнерів і перевіряють поведінку через CLI-команди,
startup Gateway, HTTP probes, RPC status і стан файлової системи.

Під час ітерацій використовуйте сфокусовані lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
```

Важливі lanes:

- `test:docker:plugins` перевіряє smoke встановлення плагінів, встановлення з
  локальних папок, локальні папки з попередньо встановленими залежностями, git-встановлення
  із package dependencies, встановлення залежностей npm-пакетів, встановлення з
  локального ClawHub fixture, поведінку marketplace update і Claude-bundle enable/inspect.
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub лишався hermetic/offline.
- `test:docker:plugin-update` перевіряє, що незмінений встановлений плагін не
  перевстановлюється й не втрачає install metadata під час `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює tarball-кандидат поверх брудного
  old-user fixture, запускає package update плюс non-interactive doctor, потім
  запускає loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спершу встановлює опублікований baseline,
  конфігурує його через вбудований recipe `openclaw config set`, оновлює його до
  tarball-кандидата, запускає doctor, перевіряє legacy cleanup, запускає Gateway
  і перевіряє `/healthz`, `/readyz` та RPC status.

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
`tilde-log-path` і `versioned-runtime-deps`. В aggregate runs
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі сценарії,
сформовані за повідомленими issue.

## Package Acceptance

Package Acceptance — це GitHub-native пакетний gate. Він resolves один пакет-кандидат
у tarball `package-under-test`, записує версію та SHA-256, а потім запускає reusable
Docker E2E lanes проти саме цього tarball. Workflow harness ref відокремлений від
package source ref, тому поточна тестова логіка може перевіряти старіші довірені релізи.

Джерела кандидата:

- `source=npm`: перевірити `openclaw@beta`, `openclaw@latest` або точну
  опубліковану версію.
- `source=ref`: запакувати довірену гілку, тег або commit з вибраним поточним
  harness.
- `source=url`: перевірити HTTPS tarball з обов’язковим `package_sha256`.
- `source=artifact`: повторно використати tarball, завантажений іншим Actions run.

Release checks викликають Package Acceptance з набором package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Вони також передають:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає міграцію пакета, перемикання update channel, очищення застарілих
залежностей плагінів, offline-покриття плагінів, поведінку plugin update і Telegram
package QA на одному resolved artifact.

Запустіть package profile вручну під час перевірки кандидата перед релізом:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Використовуйте `suite_profile=product`, коли release question включає MCP channels,
cron/subagent cleanup, OpenAI web search або OpenWebUI. Використовуйте
`suite_profile=full` лише тоді, коли потрібне повне Docker-покриття release-path.

## Релізний стандарт

Для release candidates стандартний proof stack такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level regressions.
2. `pnpm release:check` для цілісності package artifact.
3. Package Acceptance `package` profile або release-check custom package
   lanes для контрактів install/update/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   behavior.
5. Live suites лише тоді, коли змінена поверхня зачіпає provider або hosted-service
   behavior.

На машинах maintainer широкі gates і Docker/package product proof мають запускатися
в Testbox, якщо явно не виконується local proof.

## Legacy-сумісність

Compatibility leniency вузька й обмежена в часі:

- Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть tolerate
  already-shipped package metadata gaps у Package Acceptance.
- Опублікований пакет `2026.4.26` може warn щодо local build metadata stamp
  files, які вже були shipped.
- Пізніші пакети мають задовольняти modern contracts. Ті самі gaps fail замість
  warning або skipping.

Не додавайте нові startup migrations для цих старих форм. Додайте або розширте
doctor repair, а потім підтвердьте це за допомогою `upgrade-survivor` або
`published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте поведінку оновлення або плагінів, додавайте покриття на найнижчому
шарі, який може впасти з правильної причини:

- Чиста path або metadata logic: unit test поруч із source.
- Package inventory або packed-file behavior: `package-dist-inventory` або tarball
  checker test.
- CLI install/update behavior: Docker lane assertion або fixture.
- Published-release migration behavior: scenario `published-upgrade-survivor`.
- Registry/package source behavior: fixture `test:docker:plugins` або ClawHub
  fixture server.

Тримайте нові Docker fixtures hermetic за замовчуванням. Використовуйте local fixture
registries і fake packages, якщо метою тесту не є live registry behavior.

## Тріаж збоїв

Почніть з ідентичності артефакта:

- Package Acceptance `resolve_package` summary: source, version, SHA-256 і
  artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs і rerun commands.
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`,
  включно з baseline version, candidate version, scenario, phase timings і
  recipe steps.

Надавайте перевагу повторному запуску exact lane, що впав, з тим самим package
artifact, а не повторному запуску всього release umbrella.
