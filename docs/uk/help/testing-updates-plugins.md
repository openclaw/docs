---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакунків або встановлення Plugin
    - Підготовка або затвердження реліз-кандидата
    - Налагодження регресій оновлення пакета, очищення залежностей Plugin або встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та Plugin'
x-i18n:
    generated_at: "2026-05-02T18:57:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для валідації оновлення та Plugin. Мета
проста: довести, що встановлюваний пакет може оновлювати реальний стан
користувача, відновлювати застарілий legacy-стан через `doctor` і все ще
встановлювати, завантажувати, оновлювати та видаляти Plugin-и з підтримуваних
джерел.

Ширшу карту засобів запуску тестів див. у [Тестуванні](/uk/help/testing). Для live-ключів
провайдерів і наборів, що торкаються мережі, див.
[Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлення та Plugin захищають такі контракти:

- Tarball пакета є повним, має дійсний `dist/postinstall-inventory.json`
  і не залежить від нерозпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на пакет-кандидат
  без втрати конфігурації, агентів, сесій, робочих просторів, allowlist-ів Plugin
  або конфігурації каналу.
- `openclaw doctor --fix --non-interactive` відповідає за очищення legacy-стану та
  шляхи відновлення. Запуск не має обростати прихованими міграціями сумісності
  для застарілого стану Plugin.
- Встановлення Plugin працює з локальних директорій, git-репозиторіїв, npm-пакетів
  і шляху реєстру ClawHub.
- npm-залежності Plugin встановлюються в керований npm-корінь, скануються перед
  довірою та видаляються через npm під час видалення, щоб hoisted-залежності
  не залишалися.
- Оновлення Plugin є стабільним, коли нічого не змінилося: записи встановлення,
  resolved-джерело, макет встановлених залежностей і ввімкнений стан залишаються
  незмінними.

## Локальне підтвердження під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у встановленні, видаленні, залежностях Plugin або інвентарі пакета також
запустіть сфокусовані тести, що покривають відредагований інтерфейс:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перед тим як будь-яка Docker-доріжка пакета споживатиме tarball, підтвердьте
артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки drift-у конфігурації/документації/API, записує
інвентар дистрибутива пакета, запускає `npm pack --dry-run`, відхиляє заборонені
запаковані файли, встановлює tarball у тимчасовий prefix, запускає postinstall і
smoke-перевіряє entrypoint-и bundled-каналів.

## Docker-доріжки

Docker-доріжки є підтвердженням на рівні продукту. Вони встановлюють або
оновлюють реальний пакет усередині Linux-контейнерів і перевіряють поведінку
через CLI-команди, запуск Gateway, HTTP-проби, RPC-статус і стан файлової
системи.

Під час ітерацій використовуйте сфокусовані доріжки:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Важливі доріжки:

- `test:docker:plugins` валідує smoke встановлення Plugin, встановлення локальних
  папок, поведінку пропуску оновлення локальних папок, локальні папки з попередньо
  встановленими залежностями, встановлення `file:` пакетів, git-встановлення з
  виконанням CLI, оновлення git moving-ref, встановлення з npm-реєстру з hoisted
  транзитивними залежностями, npm update no-op-и, встановлення локальних ClawHub
  fixture-ів і update no-op-и, поведінку оновлення marketplace, а також увімкнення/
  inspect Claude-bundle. Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок
  ClawHub залишався герметичним/offline.
- `test:docker:plugin-update` валідує, що незмінений встановлений Plugin не
  перевстановлюється і не втрачає метадані встановлення під час `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює tarball-кандидат поверх брудного
  fixture-а старого користувача, запускає оновлення пакета плюс неінтерактивний
  doctor, потім запускає loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спочатку встановлює опублікований baseline,
  конфігурує його через вбудований рецепт `openclaw config set`, оновлює до
  tarball-кандидата, запускає doctor, перевіряє legacy-очищення, запускає Gateway
  і зондує `/healthz`, `/readyz` та RPC-статус.
- `test:docker:update-migration` є cleanup-heavy доріжкою опублікованого оновлення.
  Вона стартує з налаштованого користувацького стану в стилі Discord/Telegram,
  запускає baseline doctor, щоб налаштовані залежності Plugin отримали шанс
  матеріалізуватися, додає legacy-сміття залежностей Plugin для налаштованого
  packaged Plugin, оновлює до tarball-кандидата та вимагає, щоб post-update doctor
  видалив legacy-корені залежностей.

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
`versioned-runtime-deps`. В aggregate-запусках
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі
сценарії форми reported issue, включно з міграцією встановлення configured-plugin.

Повна міграція оновлень навмисно відокремлена від Full Release CI. Використовуйте
ручний workflow `Update Migration`, коли release-питання таке: «чи може кожен
опублікований stable-реліз від 2026.4.23 і далі оновитися до цього кандидата та
прибрати сміття залежностей Plugin?»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Приймання пакета

Package Acceptance є GitHub-native gate-ом пакета. Він resolves один пакет-кандидат
у tarball `package-under-test`, записує версію та SHA-256, а потім запускає
reusable Docker E2E-доріжки проти саме цього tarball. Ref workflow harness є
окремим від ref джерела пакета, тому поточна тестова логіка може валідувати
старіші довірені релізи.

Джерела кандидатів:

- `source=npm`: валідуйте `openclaw@beta`, `openclaw@latest` або точну
  опубліковану версію.
- `source=ref`: пакуйте довірену гілку, тег або commit із вибраним поточним
  harness.
- `source=url`: валідуйте HTTPS tarball з обов’язковим `package_sha256`.
- `source=artifact`: повторно використовуйте tarball, завантажений іншим
  Actions-запуском.

Full Release Validation за замовчуванням використовує `source=artifact`, зібраний
із resolved release SHA. Для post-publish підтвердження передайте
`package_acceptance_package_spec=openclaw@YYYY.M.D`, щоб та сама upgrade-матриця
цілилася в shipped npm-пакет.

Release checks викликають Package Acceptance з package/update/plugin набором:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Вони також передають:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає міграцію пакета, перемикання update channel, очищення застарілих
залежностей Plugin, offline-покриття Plugin, поведінку оновлення Plugin і
Telegram package QA на одному resolved-артефакті.

`all-since-2026.4.23` є upgrade-вибіркою Full Release CI: кожен stable
npm-published реліз від `2026.4.23` до `latest`. Для вичерпного покриття
міграції опублікованих оновлень використовуйте `all-since-2026.4.23` в окремому
workflow Update Migration замість Full Release CI. `release-history` залишається
доступним для ширшого ручного sampling, коли вам також потрібен legacy pre-date
anchor.

Запустіть package profile вручну під час валідації кандидата перед релізом:

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

Використовуйте `suite_profile=product`, коли release-питання охоплює MCP-канали,
cron/subagent cleanup, OpenAI web search або OpenWebUI. Використовуйте
`suite_profile=full` лише тоді, коли потрібне повне Docker-покриття release-path.

## Типове підтвердження для релізу

Для release candidates типовий стек підтвердження такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level регресій.
2. `pnpm release:check` для цілісності артефакта пакета.
3. Package Acceptance `package` profile або release-check custom package
   lanes для контрактів install/update/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   поведінки.
5. Live-набори лише тоді, коли змінена поверхня торкається поведінки провайдера
   або hosted-service.

На maintainer-машинах broad gates і Docker/package product proof мають запускатися
в Testbox, якщо явно не виконується локальне підтвердження.

## Legacy-сумісність

Поблажливість сумісності є вузькою та обмеженою в часі:

- Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть толерувати
  вже shipped прогалини метаданих пакета в Package Acceptance.
- Опублікований пакет `2026.4.26` може попереджати про вже shipped stamp-файли
  метаданих локальної збірки.
- Пізніші пакети мають відповідати сучасним контрактам. Ті самі прогалини
  провалюються замість warning або skipping.

Не додавайте нові startup-міграції для цих старих форм. Додайте або розширте
doctor-відновлення, потім підтвердьте його через `upgrade-survivor` або
`published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте поведінку оновлення або Plugin, додавайте покриття на найнижчому
рівні, який може впасти з правильної причини:

- Чиста логіка шляхів або метаданих: unit-тест поруч із джерелом.
- Поведінка інвентарю пакета або packed-file: `package-dist-inventory` або тест
  tarball checker.
- Поведінка CLI install/update: твердження або fixture Docker-доріжки.
- Поведінка міграції published-release: сценарій `published-upgrade-survivor`.
- Поведінка джерела registry/package: fixture `test:docker:plugins` або fixture
  сервер ClawHub.
- Поведінка макета залежностей або очищення: перевіряйте і runtime execution, і
  межу файлової системи. npm-залежності можуть бути hoisted під керованим
  npm-коренем, тому тести мають доводити, що корінь сканується/очищається, а не
  припускати package-local дерево `node_modules`.

Нові Docker fixture-и за замовчуванням мають бути герметичними. Використовуйте
локальні fixture-реєстри та фейкові пакети, якщо метою тесту не є live-поведінка
реєстру.

## Тріаж збоїв

Починайте з ідентичності артефакта:

- Summary Package Acceptance `resolve_package`: source, version, SHA-256 і назва
  artifact.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs і rerun commands.
- Summary upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  включно з baseline version, candidate version, scenario, phase timings і
  recipe steps.

Віддавайте перевагу повторному запуску exact failed lane з тим самим package
artifact, а не повторному запуску всієї release umbrella.
