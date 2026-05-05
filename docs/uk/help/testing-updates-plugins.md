---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакетів або встановлення Plugin
    - Підготовка або затвердження реліз-кандидата
    - Налагодження оновлення пакета, очищення залежностей Plugin або регресій встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та плагіни'
x-i18n:
    generated_at: "2026-05-05T21:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для валідації оновлень і Plugin. Мета
проста: довести, що інстальований пакет може оновлювати реальний стан користувача,
відновлювати застарілий спадковий стан через `doctor` і все ще встановлювати,
завантажувати, оновлювати та видаляти plugins із підтримуваних джерел.

Ширшу карту засобу запуску тестів див. у [Тестування](/uk/help/testing). Про ключі
live-провайдерів і набори тестів, що торкаються мережі, див. [Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлення і Plugin захищають такі контракти:

- Tarball пакета повний, має чинний `dist/postinstall-inventory.json`
  і не залежить від розпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на кандидатний пакет
  без втрати конфігурації, agents, sessions, workspaces, списків дозволених plugins або
  конфігурації каналів.
- `openclaw doctor --fix --non-interactive` володіє шляхами очищення і відновлення
  спадкового стану. Запуск не має нарощувати приховані міграції сумісності для застарілого
  стану plugins.
- Встановлення Plugin працює з локальних директорій, git-репозиторіїв, npm-пакетів і
  шляху реєстру ClawHub.
- npm-залежності Plugin встановлюються в керований npm root, скануються перед
  довірою і видаляються через npm під час деінсталяції, щоб hoisted-залежності не
  залишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: записи встановлення, resolved
  source, розкладка встановлених залежностей і ввімкнений стан залишаються незмінними.

## Локальне підтвердження під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у встановленні Plugin, видаленні, залежностях або package-inventory також
запустіть сфокусовані тести, що покривають відредагований seam:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перш ніж будь-яка package Docker lane використає tarball, підтвердьте артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки дрейфу config/docs/API, записує package dist
inventory, запускає `npm pack --dry-run`, відхиляє заборонені запаковані файли, встановлює
tarball у тимчасовий prefix, запускає postinstall і smoke-перевіряє entrypoints
вбудованих каналів.

## Docker lanes

Docker lanes є доказом на рівні продукту. Вони встановлюють або оновлюють реальний
пакет усередині Linux-контейнерів і перевіряють поведінку через CLI-команди,
запуск Gateway, HTTP-проби, RPC-статус і стан файлової системи.

Під час ітерацій використовуйте сфокусовані lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Важливі lanes:

- `test:docker:plugins` валідує smoke встановлення Plugin, встановлення з локальної папки,
  поведінку пропуску оновлення локальної папки, локальні папки з попередньо встановленими
  залежностями, встановлення `file:` пакетів, git-встановлення з виконанням CLI, оновлення
  рухомого git ref, встановлення з npm registry із hoisted transitive
  залежностями, npm update no-ops, встановлення з локального fixture ClawHub і update
  no-ops, поведінку marketplace update та Claude-bundle enable/inspect. Встановіть
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub залишався герметичним/offline.
- `test:docker:plugin-lifecycle-matrix` встановлює кандидатний пакет у bare
  контейнері, проводить npm Plugin через install, inspect, disable, enable,
  explicit upgrade, explicit downgrade і uninstall після видалення коду Plugin.
  Він логує метрики RSS і CPU для кожної фази.
- `test:docker:plugin-update` перевіряє, що незмінений установлений Plugin не
  перевстановлюється і не втрачає метадані встановлення під час `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює кандидатний tarball поверх брудного
  old-user fixture, запускає оновлення пакета разом із non-interactive doctor, потім запускає
  loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спочатку встановлює опублікований baseline,
  конфігурує його через вбудований рецепт `openclaw config set`, оновлює його до
  кандидатного tarball, запускає doctor, перевіряє legacy cleanup, запускає Gateway і
  пробує `/healthz`, `/readyz` та RPC status.
- `test:docker:update-restart-auth` встановлює кандидатний пакет, запускає
  керований token-auth Gateway, скидає caller gateway auth env для
  `openclaw update --yes --json` і вимагає, щоб кандидатна команда оновлення
  перезапустила Gateway перед звичайними пробами.
- `test:docker:update-migration` є cleanup-heavy published-update lane. Він
  стартує з налаштованого Discord/Telegram-style стану користувача, запускає baseline
  doctor, щоб залежності налаштованих plugins мали шанс матеріалізуватися, засіває
  legacy plugin dependency debris для налаштованого packaged plugin, оновлює до
  кандидатного tarball і вимагає, щоб post-update doctor видалив legacy
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
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` і `versioned-runtime-deps`. В aggregate runs
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі reported
issue-shaped сценарії, включно з міграцією configured-plugin install.

Повна міграція оновлення навмисно відокремлена від Full Release CI. Використовуйте
ручний workflow `Update Migration`, коли питання релізу звучить так: "чи може кожен
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

Package Acceptance є GitHub-native package gate. Він resolve один кандидатний
пакет у tarball `package-under-test`, записує версію і SHA-256, а потім
запускає reusable Docker E2E lanes проти саме цього tarball. Workflow harness
ref відокремлений від package source ref, тож поточна тестова логіка може валідувати
старіші trusted releases.

Джерела кандидатів:

- `source=npm`: валідувати `openclaw@beta`, `openclaw@latest` або точну
  опубліковану версію.
- `source=ref`: запакувати trusted branch, tag або commit із вибраним поточним
  harness.
- `source=url`: валідувати HTTPS tarball з обов’язковим `package_sha256`.
- `source=artifact`: повторно використати tarball, завантажений іншим Actions run.

Full Release Validation за замовчуванням використовує `source=artifact`, створений із
resolved release SHA. Для post-publish proof передайте
`package_acceptance_package_spec=openclaw@YYYY.M.D`, щоб та сама upgrade matrix
цілилася в поставлений npm-пакет натомість.

Release checks викликають Package Acceptance із набором package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Коли release soak увімкнено, вони також передають:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає package migration, update channel switching, toleration corrupt managed-plugin,
cleanup застарілих plugin dependency, offline plugin coverage, поведінку plugin
update і Telegram package QA на одному resolved artifact без
примусу стандартного release package gate проходити кожен опублікований release.

`last-stable-4` resolve до чотирьох найновіших stable npm-published OpenClaw
releases. Release package acceptance pin-ить `2026.4.23` як першу межу сумісності
plugin-update, `2026.5.2` як межу churn plugin-architecture, і
`2026.4.15` як старіший published-update baseline 2026.4.1x; resolver
dedupe-ить pins, які вже входять до найновіших чотирьох. Для вичерпного покриття
published update migration використовуйте `all-since-2026.4.23` в окремому workflow
Update Migration замість Full Release CI. `release-history` залишається
доступним для ручного ширшого sampling, коли вам також потрібен legacy pre-date
anchor.

Коли вибрано кілька published-upgrade survivor baselines, reusable
Docker workflow розбиває кожен baseline в окреме targeted runner job. Кожен
baseline shard усе ще запускає вибраний набір сценаріїв, але логи й артефакти залишаються
per-baseline, а wall time обмежується найповільнішим shard замість одного великого
serial job.

Запустіть package profile вручну під час валідації кандидата перед релізом:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Використовуйте `suite_profile=product`, коли питання релізу включає MCP channels,
cron/subagent cleanup, OpenAI web search або OpenWebUI. Використовуйте `suite_profile=full`
лише тоді, коли потрібне повне покриття Docker release-path.

## Стандарт релізу

Для release candidates стандартний proof stack такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level regressions.
2. `pnpm release:check` для цілісності package artifact.
3. Package Acceptance `package` profile або release-check custom package
   lanes для контрактів install/update/restart/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   behavior.
5. Live suites лише коли змінена поверхня торкається provider або hosted-service
   behavior.

На maintainer machines broad gates і Docker/package product proof мають запускатися
в Testbox, якщо явно не виконується local proof.

## Legacy compatibility

Послаблення сумісності вузьке і time boxed:

- Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть tolerate
  already-shipped прогалини package metadata у Package Acceptance.
- Опублікований пакет `2026.4.26` може warn щодо local build metadata stamp
  files, які вже були поставлені.
- Пізніші пакети мають задовольняти сучасні контракти. Ті самі прогалини fail замість
  warning або skipping.

Не додавайте нові startup migrations для цих старих форм. Додайте або розширте doctor
repair, потім доведіть це через `upgrade-survivor`, `published-upgrade-survivor` або
`update-restart-auth`, коли команда update володіє restart.

## Додавання покриття

Коли змінюєте поведінку update або plugin, додавайте покриття на найнижчому рівні, який
може fail з правильної причини:

- Pure path або metadata logic: unit test поруч із source.
- Package inventory або packed-file behavior: `package-dist-inventory` або tarball
  checker test.
- CLI install/update behavior: Docker lane assertion або fixture.
- Published-release migration behavior: сценарій `published-upgrade-survivor`.
- Update-owned restart behavior: `update-restart-auth`.
- Registry/package source behavior: fixture `test:docker:plugins` або fixture server
  ClawHub.
- Dependency layout або cleanup behavior: assert і runtime execution, і
  filesystem boundary. npm dependencies можуть бути hoisted під managed npm
  root, тож тести мають доводити, що root сканується/очищається, замість припускати
  package-local дерево `node_modules`.

Тримайте нові Docker fixtures герметичними за замовчуванням. Використовуйте локальні fixture registries і
fake packages, якщо суть тесту не полягає в live registry behavior.

## Тріаж збоїв

Почніть з identity артефакту:

- Зведення приймання пакета `resolve_package`: джерело, версія, SHA-256 і
  назва артефакта.
- Артефакти Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, журнали lane і команди повторного запуску.
- Зведення вцілілих після оновлення: `.artifacts/upgrade-survivor/summary.json`,
  включно з базовою версією, версією кандидата, сценарієм, тривалістю фаз і
  кроками рецепта.

Надавайте перевагу повторному запуску точного невдалого lane з тим самим артефактом пакета, а не
повторному запуску всієї парасольки релізу.
