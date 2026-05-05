---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакета або встановлення Plugin
    - Підготовка або затвердження реліз-кандидата
    - Налагодження регресій оновлення пакета, очищення залежностей Plugin або встановлення Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення й оновлення Plugin
title: 'Тестування: оновлення та плагіни'
x-i18n:
    generated_at: "2026-05-05T04:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e5dbc85d567b9aec07d13e309d45da45d9088fb41dcbb2a07dae69dca6b09af
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для перевірки оновлень і Plugin. Мета
проста: довести, що інстальований пакет може оновлювати реальний стан
користувача, ремонтувати застарілий legacy-стан через `doctor` і далі
інсталювати, завантажувати, оновлювати та видаляти Plugin з підтримуваних
джерел.

Ширшу мапу запуску тестів див. у [Тестування](/uk/help/testing). Для ключів live-провайдерів
і наборів, що торкаються мережі, див. [Live-тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлень і Plugin захищають такі контракти:

- Tarball пакета повний, має валідний `dist/postinstall-inventory.json`
  і не залежить від нерозпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на пакет-кандидат
  без втрати конфігурації, агентів, сесій, робочих просторів, allowlist Plugin
  або конфігурації каналу.
- `openclaw doctor --fix --non-interactive` володіє шляхами очищення та ремонту
  legacy-стану. Startup не має нарощувати приховані міграції сумісності для
  застарілого стану Plugin.
- Інсталяції Plugin працюють із локальних директорій, git-репозиторіїв, npm-пакетів
  і шляху реєстру ClawHub.
- npm-залежності Plugin інсталюються в керований npm root, скануються перед
  довірою і видаляються через npm під час деінсталяції, щоб hoisted-залежності
  не лишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: записи інсталяції,
  розв’язане джерело, макет інстальованих залежностей і ввімкнений стан
  лишаються неушкодженими.

## Локальний доказ під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін інсталяції, деінсталяції, залежностей або інвентарю пакета Plugin також
запустіть сфокусовані тести, що покривають редагований seam:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перш ніж будь-яка Docker lane пакета споживатиме tarball, доведіть артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки дрейфу конфігурації/документації/API, записує
інвентар package dist, запускає `npm pack --dry-run`, відхиляє заборонені
запаковані файли, інсталює tarball у тимчасовий prefix, запускає postinstall
і smoke-перевіряє entrypoint-и bundled channel.

## Docker lanes

Docker lanes є доказом рівня продукту. Вони інсталюють або оновлюють реальний
пакет усередині Linux-контейнерів і перевіряють поведінку через CLI-команди,
запуск Gateway, HTTP-проби, RPC-статус і стан файлової системи.

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

- `test:docker:plugins` перевіряє smoke інсталяції Plugin, інсталяції з локальної
  теки, поведінку пропуску оновлення локальної теки, локальні теки з попередньо
  інстальованими залежностями, інсталяції пакетів `file:`, git-інсталяції з
  виконанням CLI, оновлення moving-ref у git, інсталяції з npm-реєстру з
  hoisted транзитивними залежностями, npm update no-op, інсталяції з локального
  fixture ClawHub і no-op оновлення, поведінку marketplace update, а також
  увімкнення/inspect Claude-bundle. Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`,
  щоб блок ClawHub лишався герметичним/офлайн.
- `test:docker:plugin-lifecycle-matrix` інсталює пакет-кандидат у порожній
  контейнер, проводить npm Plugin через install, inspect, disable, enable,
  явний upgrade, явний downgrade і uninstall після видалення коду Plugin.
  Він логує метрики RSS і CPU для кожної фази.
- `test:docker:plugin-update` перевіряє, що незмінений інстальований Plugin
  не перевстановлюється і не втрачає метадані інсталяції під час
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` інсталює tarball-кандидат поверх брудного
  fixture старого користувача, запускає оновлення пакета плюс неінтерактивний
  doctor, а потім запускає loopback Gateway і перевіряє збереження стану.
- `test:docker:published-upgrade-survivor` спершу інсталює опублікований baseline,
  конфігурує його через вбудований рецепт `openclaw config set`, оновлює його до
  tarball-кандидата, запускає doctor, перевіряє legacy-очищення, запускає Gateway
  і пробує `/healthz`, `/readyz` та RPC-статус.
- `test:docker:update-migration` є lane опублікованого оновлення з акцентом на
  очищенні. Він стартує з налаштованого користувацького стану в стилі
  Discord/Telegram, запускає baseline doctor, щоб налаштовані залежності Plugin
  мали шанс матеріалізуватися, засіває legacy-сміття залежностей Plugin для
  налаштованого packaged Plugin, оновлює до tarball-кандидата і вимагає, щоб
  post-update doctor видалив legacy roots залежностей.

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
`stale-source-plugin-shadow`, `tilde-log-path` і `versioned-runtime-deps`. В aggregate-запусках
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` розгортається в усі сценарії
форми reported issue, включно з міграцією інсталяції configured-plugin.

Повна міграція оновлень навмисно відокремлена від Full Release CI. Використовуйте
ручний workflow `Update Migration`, коли release-питання звучить так: «чи може
кожен опублікований stable release від 2026.4.23 і далі оновитися до цього
кандидата та прибрати сміття залежностей Plugin?»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance є GitHub-native package gate. Він розв’язує один пакет-кандидат
у tarball `package-under-test`, записує версію та SHA-256, а потім запускає
reusable Docker E2E lanes проти саме цього tarball. Workflow harness ref
відокремлений від package source ref, тому поточна логіка тестів може
перевіряти старіші довірені релізи.

Джерела кандидатів:

- `source=npm`: перевірити `openclaw@beta`, `openclaw@latest` або точну
  опубліковану версію.
- `source=ref`: запакувати довірену гілку, тег або commit із вибраним поточним
  harness.
- `source=url`: перевірити HTTPS tarball з обов’язковим `package_sha256`.
- `source=artifact`: повторно використати tarball, завантажений іншим Actions run.

Full Release Validation стандартно використовує `source=artifact`, побудований з
розв’язаного release SHA. Для post-publish proof передайте
`package_acceptance_package_spec=openclaw@YYYY.M.D`, щоб та сама upgrade matrix
цілилася в відвантажений npm-пакет.

Release checks викликають Package Acceptance із набором package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Коли release soak увімкнено, вони також передають:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає міграцію пакета, перемикання каналу оновлень, очищення застарілих
залежностей Plugin, офлайн-покриття Plugin, поведінку оновлення Plugin і
Telegram package QA на тому самому розв’язаному артефакті, не змушуючи
стандартний release package gate проходити кожен опублікований реліз.

`last-stable-4` розв’язується в чотири найновіші stable npm-published релізи
OpenClaw. Release package acceptance закріплює `2026.4.23` як першу межу
сумісності plugin-update, `2026.5.2` як межу зміни plugin-архітектури, а
`2026.4.15` як старіший baseline published-update з 2026.4.1x; resolver
дедуплікує pin-и, які вже є в останніх чотирьох. Для вичерпного покриття
published update migration використовуйте `all-since-2026.4.23` в окремому
workflow Update Migration замість Full Release CI. `release-history` лишається
доступним для ручного ширшого семплінгу, коли також потрібен старий pre-date
anchor.

Коли вибрано кілька published-upgrade survivor baselines, reusable Docker workflow
розбиває кожен baseline в окрему цільову runner job. Кожен baseline shard усе ще
запускає вибраний набір сценаріїв, але логи й артефакти лишаються per-baseline,
а wall time обмежений найповільнішим shard замість одного великого серійного job.

Запустіть package profile вручну під час перевірки кандидата перед релізом:

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

Використовуйте `suite_profile=product`, коли release-питання включає MCP channels,
cron/subagent cleanup, OpenAI web search або OpenWebUI. Використовуйте
`suite_profile=full` лише тоді, коли потрібне повне покриття Docker release-path.

## Стандарт релізу

Для release candidates стандартний proof stack такий:

1. `pnpm check:changed` і `pnpm test:changed` для source-level регресій.
2. `pnpm release:check` для цілісності package artifact.
3. Package Acceptance `package` profile або custom package lanes release-check для
   контрактів install/update/plugin.
4. Cross-OS release checks для OS-specific installer, onboarding і platform
   behavior.
5. Live suites лише коли змінена поверхня торкається provider або hosted-service
   behavior.

На maintainer machines broad gates і Docker/package product proof мають
запускатися в Testbox, якщо явно не виконується local proof.

## Legacy-сумісність

Поблажливість сумісності вузька й обмежена в часі:

- Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть толерувати
  вже відвантажені прогалини metadata пакета в Package Acceptance.
- Опублікований пакет `2026.4.26` може попереджати про вже відвантажені stamp-файли
  metadata локальної збірки.
- Пізніші пакети мають задовольняти сучасні контракти. Ті самі прогалини дають
  failure замість warning або skipping.

Не додавайте нові startup migrations для цих старих форм. Додайте або розширте
doctor repair, а потім доведіть це через `upgrade-survivor` або
`published-upgrade-survivor`.

## Додавання покриття

Коли змінюєте поведінку update або Plugin, додавайте покриття на найнижчому
рівні, який може впасти з правильної причини:

- Чиста логіка paths або metadata: unit test поруч із source.
- Package inventory або packed-file behavior: `package-dist-inventory` або tarball
  checker test.
- Поведінка CLI install/update: assertion або fixture в Docker lane.
- Поведінка міграції published-release: сценарій `published-upgrade-survivor`.
- Поведінка registry/package source: fixture `test:docker:plugins` або fixture
  server ClawHub.
- Поведінка dependency layout або cleanup: перевіряйте і runtime execution, і
  filesystem boundary. npm-залежності можуть hoist-итися під керований npm root,
  тож тести мають доводити, що root сканується/очищається, замість припущення
  про package-local дерево `node_modules`.

Нові Docker fixtures стандартно тримайте герметичними. Використовуйте локальні
fixture registries і fake packages, якщо мета тесту не є live registry behavior.

## Тріаж failures

Починайте з ідентичності артефакту:

- Summary `resolve_package` у Package Acceptance: source, version, SHA-256 і
  artifact name.
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs і rerun commands.
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`,
  включно з baseline version, candidate version, scenario, phase timings і
  recipe steps.

Надавайте перевагу повторному запуску саме тієї failed lane з тим самим package
artifact, а не повторному запуску всього release umbrella.
