---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакетів або встановлення Plugin
    - Підготовка або схвалення реліз-кандидата
    - Налагодження оновлення пакета, очищення залежностей Plugin або регресій установлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення та оновлення Plugin
title: 'Тестування: оновлення та Plugin'
x-i18n:
    generated_at: "2026-05-01T23:38:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d4b52047b9b80273e2d93b97e647e5e9c93d93910828fdce010568f3ea81390
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для валідації оновлень і Plugin. Мета
проста: довести, що інстальований пакет може оновити реальний стан користувача,
відновити застарілий успадкований стан через `doctor` і все ще встановлювати,
завантажувати, оновлювати та видаляти plugins із підтримуваних джерел.

Ширшу карту тестового раннера див. у [Тестування](/uk/help/testing). Про ключі
live-провайдерів і набори тестів, що торкаються мережі, див.
[Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлення та Plugin захищають такі контракти:

- Tarball пакета повний, має чинний `dist/postinstall-inventory.json` і не
  залежить від розпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на кандидатний
  пакет без втрати конфігурації, агентів, сесій, робочих просторів, allowlist
  Plugin або конфігурації каналу.
- `openclaw doctor --fix --non-interactive` володіє шляхами очищення та
  відновлення успадкованого стану. Startup не має розростатися прихованими
  міграціями сумісності для застарілого стану Plugin.
- Встановлення Plugin працює з локальних директорій, git-репозиторіїв,
  npm-пакетів і шляху реєстру ClawHub.
- npm-залежності Plugin встановлюються в керований корінь npm, скануються перед
  довірою та видаляються через npm під час uninstall, щоб підняті залежності не
  залишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: записи встановлення,
  розв’язане джерело та ввімкнений стан залишаються неушкодженими.

## Локальне підтвердження під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у встановленні, видаленні, залежностях Plugin або package-inventory
також запускайте сфокусовані тести, що покривають відредагований seam:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перш ніж будь-яка package Docker lane споживатиме tarball, доведіть артефакт
пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки drift для config/docs/API, записує package
dist inventory, запускає `npm pack --dry-run`, відхиляє заборонені запаковані
файли, встановлює tarball у тимчасовий prefix, запускає postinstall і перевіряє
smoke для bundled channel entrypoints.

## Docker lanes

Docker lanes є підтвердженням продуктового рівня. Вони встановлюють або
оновлюють реальний пакет усередині Linux-контейнерів і перевіряють поведінку
через CLI-команди, startup Gateway, HTTP-проби, RPC-статус і стан файлової
системи.

Під час ітерацій використовуйте сфокусовані lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Важливі lanes:

- `test:docker:plugins` валідує smoke встановлення Plugin, встановлення з
  локальних папок, локальні папки з попередньо встановленими залежностями,
  git-встановлення із залежностями пакета, встановлення залежностей npm-пакета,
  встановлення з локальної ClawHub fixture, поведінку marketplace update, а
  також enable/inspect для Claude-bundle. Установіть
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub залишався
  герметичним/offline.
- `test:docker:plugin-update` перевіряє, що незмінений встановлений Plugin не
  перевстановлюється й не втрачає метадані встановлення під час
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює кандидатний tarball поверх брудної
  old-user fixture, запускає оновлення пакета плюс non-interactive doctor,
  потім запускає loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спочатку встановлює опублікований
  baseline, конфігурує його через baked рецепт `openclaw config set`, оновлює
  його до кандидатного tarball, запускає doctor, перевіряє очищення
  успадкованого стану, запускає Gateway і пробує `/healthz`, `/readyz` та
  RPC-статус.
- `test:docker:update-migration` є cleanup-heavy lane для published-update. Вона
  стартує з налаштованого користувацького стану в стилі Discord/Telegram,
  запускає baseline doctor, щоб налаштовані залежності Plugin мали шанс
  матеріалізуватися, засіває уламки успадкованих залежностей Plugin для
  налаштованого packaged Plugin, оновлює до кандидатного tarball і вимагає, щоб
  post-update doctor видалив legacy dependency roots.

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі
сценарії, сформовані за reported issues.

Повна update migration навмисно відокремлена від Full Release CI. Використовуйте
ручний workflow `Update Migration`, коли release-питання звучить так: "чи може
кожен опублікований stable release від 2026.4.23 і далі оновитися до цього
кандидата та очистити уламки залежностей Plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance є GitHub-native package gate. Він розв’язує один кандидатний
пакет у tarball `package-under-test`, записує версію та SHA-256, потім запускає
reusable Docker E2E lanes проти саме цього tarball. Workflow harness ref
відокремлений від package source ref, тому поточна тестова логіка може
валідувати старіші trusted releases.

Джерела кандидата:

- `source=npm`: валідувати `openclaw@beta`, `openclaw@latest` або точну
  опубліковану версію.
- `source=ref`: запакувати trusted branch, tag або commit із вибраним поточним
  harness.
- `source=url`: валідувати HTTPS tarball з обов’язковим `package_sha256`.
- `source=artifact`: повторно використати tarball, завантажений іншим Actions
  run.

Release checks викликають Package Acceptance з package/update/plugin set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Вони також передають:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає package migration, перемикання каналу оновлень, очищення застарілих
залежностей Plugin, offline-покриття Plugin, поведінку оновлення Plugin і
Telegram package QA на одному розв’язаному артефакті.

`release-history` є обмеженим release-check sample: останні шість stable
releases, `2026.4.23` і один старіший pre-date anchor. Для вичерпного покриття
published update migration використовуйте `all-since-2026.4.23` в окремому
workflow Update Migration замість Full Release CI.

Запустіть package profile вручну під час валідації кандидата перед release:

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

Використовуйте `suite_profile=product`, коли release-питання включає MCP
channels, cron/subagent cleanup, OpenAI web search або OpenWebUI. Використовуйте
`suite_profile=full` лише тоді, коли потрібне повне покриття Docker release-path.

## Типовий release

Для release candidates типовий стек підтвердження такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level регресій.
2. `pnpm release:check` для цілісності артефакту пакета.
3. Package Acceptance profile `package` або release-check custom package
   lanes для контрактів install/update/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   behavior.
5. Live-набори лише тоді, коли змінена поверхня торкається поведінки провайдера
   або hosted-service.

На машинах мейнтейнерів broad gates і Docker/package product proof мають
запускатися в Testbox, якщо явно не виконується локальне підтвердження.

## Успадкована сумісність

Поблажливість сумісності вузька й обмежена в часі:

- Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть терпіти
  вже shipped gaps у package metadata в Package Acceptance.
- Опублікований пакет `2026.4.26` може попереджати про local build metadata
  stamp files, які вже shipped.
- Пізніші пакети мають задовольняти сучасні контракти. Ті самі gaps мають
  падати замість warning або skipping.

Не додавайте нові startup migrations для цих старих форм. Додайте або розширте
doctor repair, потім доведіть це за допомогою `upgrade-survivor` або
`published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте поведінку update або Plugin, додавайте покриття на найнижчому
рівні, який може впасти з правильної причини:

- Чиста path або metadata logic: unit test поруч із джерелом.
- Поведінка package inventory або packed-file: `package-dist-inventory` або
  tarball checker test.
- CLI install/update behavior: Docker lane assertion або fixture.
- Поведінка published-release migration: сценарій `published-upgrade-survivor`.
- Поведінка registry/package source: fixture `test:docker:plugins` або сервер
  ClawHub fixture.

Нові Docker fixtures за замовчуванням мають бути герметичними. Використовуйте
локальні fixture registries і fake packages, якщо метою тесту не є live registry
behavior.

## Тріаж збоїв

Починайте з ідентичності артефакту:

- Summary Package Acceptance `resolve_package`: source, version, SHA-256 і
  artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs і rerun commands.
- Summary upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  включно з baseline version, candidate version, scenario, phase timings і
  recipe steps.

Віддавайте перевагу повторному запуску саме failed exact lane з тим самим
package artifact, а не повторному запуску всієї release umbrella.
