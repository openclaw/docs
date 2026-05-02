---
read_when:
    - Зміна поведінки оновлення, doctor, приймання пакетів або встановлення Plugin в OpenClaw
    - Підготовка або затвердження реліз-кандидата
    - Налагодження оновлення пакета, очищення залежностей Plugin або регресій встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та плагіни'
x-i18n:
    generated_at: "2026-05-02T02:02:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це окремий контрольний список для перевірки оновлень і Plugin. Мета
проста: довести, що інстальований пакет може оновлювати реальний стан користувача, виправляти застарілий
legacy-стан через `doctor` і надалі встановлювати, завантажувати, оновлювати та видаляти
Plugin з підтримуваних джерел.

Ширшу мапу засобів запуску тестів див. у [Тестування](/uk/help/testing). Для live-ключів провайдерів
і наборів тестів, що торкаються мережі, див. [Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлень і Plugin захищають такі контракти:

- Tarball пакета повний, має чинний `dist/postinstall-inventory.json`
  і не залежить від нерозпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на пакет-кандидат
  без втрати конфігурації, агентів, сесій, робочих просторів, allowlist Plugin або
  конфігурації каналів.
- `openclaw doctor --fix --non-interactive` відповідає за очищення та виправлення
  legacy-шляхів. Запуск не повинен обростати прихованими міграціями сумісності для застарілого
  стану Plugin.
- Встановлення Plugin працює з локальних каталогів, git-репозиторіїв, npm-пакетів і
  шляху реєстру ClawHub.
- npm-залежності Plugin встановлюються в керований npm root, скануються перед
  довірою й видаляються через npm під час деінсталяції, щоб hoisted-залежності не
  залишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: записи встановлення, resolved
  source, структура встановлених залежностей і ввімкнений стан залишаються незмінними.

## Локальне підтвердження під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у встановленні, видаленні, залежностях Plugin або package-inventory також
запустіть цільові тести, що покривають відредаговану межу:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перш ніж будь-яка package Docker lane використає tarball, перевірте артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки дрейфу config/docs/API, записує package dist
inventory, запускає `npm pack --dry-run`, відхиляє заборонені запаковані файли, встановлює
tarball у тимчасовий prefix, запускає postinstall і виконує smoke-перевірку bundled channel
entrypoints.

## Docker lanes

Docker lanes є product-level підтвердженням. Вони встановлюють або оновлюють реальний
пакет у Linux-контейнерах і перевіряють поведінку через CLI-команди,
запуск Gateway, HTTP-проби, RPC-статус і стан файлової системи.

Під час ітерацій використовуйте цільові lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Важливі lanes:

- `test:docker:plugins` перевіряє smoke встановлення Plugin, встановлення з локальної папки,
  skip-поведінку оновлення локальної папки, локальні папки з попередньо встановленими
  залежностями, встановлення `file:` пакетів, git-встановлення з виконанням CLI, оновлення
  moving-ref у git, встановлення з npm registry з hoisted transitive
  dependencies, no-op оновлення npm, встановлення з локальної ClawHub fixture і no-op
  оновлення, поведінку оновлення marketplace та ввімкнення/інспекцію Claude-bundle. Установіть
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub залишався герметичним/offline.
- `test:docker:plugin-update` перевіряє, що незмінений встановлений Plugin не
  перевстановлюється й не втрачає install metadata під час `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює tarball-кандидат поверх dirty
  old-user fixture, запускає оновлення пакета плюс non-interactive doctor, потім запускає
  loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спершу встановлює опублікований baseline,
  конфігурує його через вбудований рецепт `openclaw config set`, оновлює його до
  tarball-кандидата, запускає doctor, перевіряє legacy cleanup, запускає Gateway і
  пробує `/healthz`, `/readyz` та RPC-статус.
- `test:docker:update-migration` є cleanup-heavy published-update lane. Він
  стартує з налаштованого Discord/Telegram-style стану користувача, запускає baseline
  doctor, щоб налаштовані залежності Plugin мали шанс матеріалізуватися, сіє
  legacy plugin dependency debris для налаштованого packaged plugin, оновлює до
  tarball-кандидата й вимагає, щоб post-update doctor видалив legacy
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
`plugin-deps-cleanup`, `tilde-log-path` і `versioned-runtime-deps`. В aggregate runs
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі reported
issue-shaped scenarios.

Повна міграція оновлень навмисно відокремлена від Full Release CI. Використовуйте
ручний workflow `Update Migration`, коли release-питання звучить так: "чи може кожен
опублікований stable release від 2026.4.23 і далі оновитися до цього кандидата та
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

Package Acceptance — це GitHub-native package gate. Він визначає один candidate
package у tarball `package-under-test`, записує version і SHA-256, а потім
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

Release checks викликають Package Acceptance із набором package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Вони також передають:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає міграцію пакета, перемикання update channel, очищення застарілих plugin dependency,
offline-покриття Plugin, поведінку оновлення Plugin і Telegram package
QA на одному resolved artifact.

`release-history` — це bounded release-check sample: останні шість stable releases,
`2026.4.23` і один старіший pre-date anchor. Для вичерпного покриття published update
migration використовуйте `all-since-2026.4.23` в окремому workflow Update Migration
замість Full Release CI.

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

Використовуйте `suite_profile=product`, коли release-питання охоплює MCP channels,
cron/subagent cleanup, OpenAI web search або OpenWebUI. Використовуйте `suite_profile=full`
лише тоді, коли потрібне повне покриття Docker release-path.

## Типовий варіант для релізу

Для release candidates типовий proof stack такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level регресій.
2. `pnpm release:check` для цілісності артефакту пакета.
3. Package Acceptance `package` profile або release-check custom package
   lanes для install/update/plugin contracts.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   behavior.
5. Live-набори лише тоді, коли змінена surface зачіпає provider або hosted-service
   behavior.

На maintainer machines broad gates і Docker/package product proof мають запускатися
в Testbox, якщо явно не виконується local proof.

## Legacy-сумісність

Compatibility leniency вузька й обмежена в часі:

- Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть толерувати
  вже випущені прогалини package metadata у Package Acceptance.
- Опублікований пакет `2026.4.26` може попереджати про local build metadata stamp
  files, які вже були випущені.
- Пізніші пакети мають задовольняти сучасні контракти. Ті самі прогалини призводять до failure замість
  warning або skipping.

Не додавайте нові startup migrations для цих старих форм. Додайте або розширте doctor
repair, а потім доведіть це через `upgrade-survivor` або `published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте поведінку оновлення або Plugin, додавайте покриття на найнижчому рівні, який
може впасти з правильної причини:

- Чиста логіка шляхів або metadata: unit test поруч із source.
- Поведінка package inventory або packed-file: `package-dist-inventory` або tarball
  checker test.
- Поведінка CLI install/update: Docker lane assertion або fixture.
- Поведінка published-release migration: сценарій `published-upgrade-survivor`.
- Поведінка registry/package source: fixture `test:docker:plugins` або ClawHub
  fixture server.
- Поведінка dependency layout або cleanup: перевіряйте і runtime execution, і
  filesystem boundary. npm-залежності можуть бути hoisted під managed npm
  root, тому тести мають доводити, що root сканується/очищується, замість припущення про
  package-local дерево `node_modules`.

Нові Docker fixtures за замовчуванням мають бути герметичними. Використовуйте локальні fixture registries і
fake packages, якщо метою тесту не є live registry behavior.

## Тріаж збоїв

Починайте з ідентичності артефакту:

- Summary `resolve_package` у Package Acceptance: source, version, SHA-256 і
  artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs і rerun commands.
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`,
  зокрема baseline version, candidate version, scenario, phase timings і
  recipe steps.

Надавайте перевагу повторному запуску exact lane, що впав, з тим самим package artifact замість
повторного запуску всього release umbrella.
