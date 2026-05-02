---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакетів або встановлення Plugin
    - Підготовка або затвердження реліз-кандидата
    - Налагодження регресій оновлення пакета, очищення залежностей Plugin або встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та Plugin'
x-i18n:
    generated_at: "2026-05-02T15:57:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7843767a4acca25ceea62633faa5f4bec954bebf7cc4eeb9f3b0b990313ff946
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для перевірки оновлень і Plugin. Мета проста: довести, що інстальований пакет може оновлювати реальний стан користувача, відновлювати застарілий legacy-стан через `doctor` і надалі встановлювати, завантажувати, оновлювати та видаляти plugins з підтримуваних джерел.

Для ширшої мапи засобу запуску тестів див. [Тестування](/uk/help/testing). Для live-ключів провайдерів і наборів, що торкаються мережі, див. [Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлень і Plugin захищають такі контракти:

- Tarball пакета повний, має дійсний `dist/postinstall-inventory.json` і не залежить від розпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на кандидатний пакет без втрати конфігурації, агентів, сесій, робочих просторів, списків дозволених plugins або конфігурації каналів.
- `openclaw doctor --fix --non-interactive` відповідає за очищення legacy-стану та шляхи відновлення. Startup не має обростати прихованими міграціями сумісності для застарілого стану Plugin.
- Встановлення Plugin працює з локальних директорій, git-репозиторіїв, npm-пакетів і шляху реєстру ClawHub.
- npm-залежності Plugin встановлюються в керований npm-корінь, скануються перед довірою та видаляються через npm під час uninstall, щоб hoisted-залежності не залишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: записи встановлення, вирішене джерело, розкладка встановлених залежностей і ввімкнений стан залишаються незмінними.

## Локальне підтвердження під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у встановленні, видаленні, залежностях Plugin або package-inventory також запускайте сфокусовані тести, що покривають змінений seam:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перед тим як будь-яка package Docker lane споживатиме tarball, підтвердьте артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки drift для config/docs/API, записує package dist inventory, виконує `npm pack --dry-run`, відхиляє заборонені запаковані файли, встановлює tarball у тимчасовий prefix, запускає postinstall і виконує smoke-перевірки entrypoints вбудованих каналів.

## Docker lanes

Docker lanes є підтвердженням продуктового рівня. Вони встановлюють або оновлюють реальний пакет усередині Linux-контейнерів і перевіряють поведінку через CLI-команди, запуск Gateway, HTTP-проби, RPC-статус і стан файлової системи.

Використовуйте сфокусовані lanes під час ітерацій:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Важливі lanes:

- `test:docker:plugins` перевіряє smoke встановлення Plugin, встановлення з локальної папки, поведінку пропуску оновлення локальної папки, локальні папки з попередньо встановленими залежностями, встановлення `file:` пакетів, git-встановлення з виконанням CLI, оновлення git moving-ref, встановлення з npm registry з hoisted transitive dependencies, npm update no-ops, встановлення з локальної ClawHub fixture та update no-ops, поведінку marketplace update і Claude-bundle enable/inspect. Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub залишався hermetic/offline.
- `test:docker:plugin-update` перевіряє, що незмінений встановлений Plugin не перевстановлюється і не втрачає install metadata під час `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює candidate tarball поверх dirty old-user fixture, запускає package update плюс non-interactive doctor, потім стартує loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спочатку встановлює published baseline, налаштовує його через вбудований рецепт `openclaw config set`, оновлює до candidate tarball, запускає doctor, перевіряє legacy cleanup, стартує Gateway і пробує `/healthz`, `/readyz` та RPC status.
- `test:docker:update-migration` є cleanup-heavy published-update lane. Він стартує з налаштованого user state у стилі Discord/Telegram, запускає baseline doctor, щоб налаштовані залежності Plugin мали шанс матеріалізуватися, seed-ить legacy plugin dependency debris для налаштованого packaged plugin, оновлює до candidate tarball і вимагає, щоб post-update doctor видалив legacy dependency roots.

Корисні варіанти published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Доступні сценарії: `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` і `versioned-runtime-deps`. В aggregate runs `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі reported issue-shaped сценарії, включно з configured-plugin install migration.

Повна update migration навмисно відокремлена від Full Release CI. Використовуйте ручний workflow `Update Migration`, коли release question: «чи може кожен опублікований stable release від 2026.4.23 і далі оновитися до цього кандидата та очистити plugin dependency debris?»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance — це GitHub-native package gate. Він resolve-ить один candidate package у tarball `package-under-test`, записує version і SHA-256, а потім запускає reusable Docker E2E lanes проти саме цього tarball. Workflow harness ref відокремлений від package source ref, тому поточна test logic може перевіряти старіші trusted releases.

Джерела candidate:

- `source=npm`: перевіряє `openclaw@beta`, `openclaw@latest` або точну опубліковану версію.
- `source=ref`: пакує trusted branch, tag або commit з вибраним current harness.
- `source=url`: перевіряє HTTPS tarball з обов’язковим `package_sha256`.
- `source=artifact`: повторно використовує tarball, завантажений іншим Actions run.

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

Це тримає package migration, update channel switching, stale plugin dependency cleanup, offline plugin coverage, поведінку plugin update і Telegram package QA на одному resolved artifact.

`release-history` — це bounded release-check sample: останні шість stable releases, `2026.4.23` і один старіший pre-date anchor. Для exhaustive published update migration coverage використовуйте `all-since-2026.4.23` в окремому workflow Update Migration замість Full Release CI.

Запускайте package profile вручну під час перевірки кандидата перед release:

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

Використовуйте `suite_profile=product`, коли release question включає MCP channels, cron/subagent cleanup, OpenAI web search або OpenWebUI. Використовуйте `suite_profile=full` лише тоді, коли потрібне повне покриття Docker release-path.

## Типове для release

Для release candidates типовий stack підтвердження такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level regressions.
2. `pnpm release:check` для integrity артефакта пакета.
3. Package Acceptance `package` profile або release-check custom package lanes для контрактів install/update/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform behavior.
5. Live suites лише тоді, коли змінена поверхня торкається provider або hosted-service behavior.

На maintainer machines broad gates і Docker/package product proof мають запускатися в Testbox, якщо явно не виконується local proof.

## Legacy-сумісність

Compatibility leniency є вузькою та обмеженою в часі:

- Пакети до `2026.4.25`, включно з `2026.4.25-beta.*`, можуть tolerate already-shipped package metadata gaps у Package Acceptance.
- Опублікований пакет `2026.4.26` може warning для local build metadata stamp files, які вже shipped.
- Пізніші пакети мають задовольняти сучасні контракти. Ті самі gaps fail замість warning або skipping.

Не додавайте нові startup migrations для цих старих shapes. Додайте або розширте doctor repair, потім підтвердьте це за допомогою `upgrade-survivor` або `published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте поведінку update або Plugin, додавайте coverage на найнижчому шарі, який може fail з правильної причини:

- Pure path або metadata logic: unit test поруч із source.
- Package inventory або packed-file behavior: `package-dist-inventory` або tarball checker test.
- CLI install/update behavior: Docker lane assertion або fixture.
- Published-release migration behavior: сценарій `published-upgrade-survivor`.
- Registry/package source behavior: fixture `test:docker:plugins` або fixture server ClawHub.
- Dependency layout або cleanup behavior: перевіряйте і runtime execution, і filesystem boundary. npm-залежності можуть бути hoisted під managed npm root, тому тести мають доводити, що root сканується/очищається, замість припущення про package-local дерево `node_modules`.

Тримайте нові Docker fixtures hermetic за замовчуванням. Використовуйте local fixture registries і fake packages, якщо мета тесту не live registry behavior.

## Failure triage

Почніть з artifact identity:

- Summary Package Acceptance `resolve_package`: source, version, SHA-256 і artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs і rerun commands.
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`, включно з baseline version, candidate version, scenario, phase timings і recipe steps.

Надавайте перевагу rerun failed exact lane з тим самим package artifact, а не rerun усього release umbrella.
