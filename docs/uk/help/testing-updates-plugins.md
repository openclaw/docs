---
read_when:
    - Зміна поведінки оновлення OpenClaw, doctor, приймання пакета або встановлення Plugin
    - Підготовка або затвердження кандидата на реліз
    - Налагодження регресій, пов’язаних з оновленням пакета, очищенням залежностей Plugin або встановленням Plugin
sidebarTitle: Update and plugin tests
summary: Як OpenClaw перевіряє шляхи оновлення, міграції пакетів і поведінку встановлення/оновлення Plugin
title: 'Тестування: оновлення та Plugin-и'
x-i18n:
    generated_at: "2026-06-27T17:39:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Це спеціальний контрольний список для перевірки оновлень і plugin. Мета
проста: довести, що інстальований пакет може оновлювати реальний стан
користувача, виправляти застарілий спадковий стан через `doctor` і все ще
встановлювати, завантажувати, оновлювати та видаляти plugins з підтримуваних
джерел.

Ширшу карту засобів запуску тестів див. у [Тестування](/uk/help/testing). Для
ключів живих провайдерів і наборів, що торкаються мережі, див.
[Живе тестування](/uk/help/testing-live).

## Що ми захищаємо

Тести оновлень і plugin захищають такі контракти:

- Tarball пакета є повним, має дійсний `dist/postinstall-inventory.json` і не
  залежить від розпакованих файлів репозиторію.
- Користувач може перейти зі старішого опублікованого пакета на пакет-кандидат
  без втрати конфігурації, агентів, сесій, робочих просторів, allowlist для
  plugin або конфігурації каналу.
- `openclaw doctor --fix --non-interactive` володіє шляхами спадкового очищення
  та виправлення. Запуск не має обростати прихованими міграціями сумісності для
  застарілого стану plugin.
- Встановлення Plugin працює з локальних каталогів, git-репозиторіїв, npm-пакетів
  і шляху реєстру ClawHub.
- Npm-залежності Plugin встановлюються в одному керованому npm-проєкті на кожен
  plugin, скануються перед довірою та видаляються через npm під час
  деінсталяції, щоб підняті залежності не залишалися.
- Оновлення Plugin стабільне, коли нічого не змінилося: записи встановлення,
  розв’язане джерело, макет встановлених залежностей і ввімкнений стан
  залишаються незмінними.

## Локальне підтвердження під час розробки

Починайте вузько:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для змін у встановленні, видаленні, залежностях plugin або інвентарі пакета
також запускайте сфокусовані тести, що покривають відредагований стик:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перш ніж будь-який Docker-ланцюг пакета споживатиме tarball, підтвердьте
артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускає перевірки розбіжностей конфігурації/документації/API,
записує інвентар дистрибутива пакета, виконує `npm pack --dry-run`, відхиляє
заборонені запаковані файли, встановлює tarball у тимчасовий префікс, запускає
postinstall і перевіряє базові точки входу вбудованих каналів.

## Docker-ланцюги

Docker-ланцюги є підтвердженням на рівні продукту. Вони встановлюють або
оновлюють реальний пакет у Linux-контейнерах і перевіряють поведінку через
команди CLI, запуск Gateway, HTTP-проби, RPC-статус і стан файлової системи.

Під час ітерацій використовуйте сфокусовані ланцюги:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Важливі ланцюги:

- `test:docker:plugins` перевіряє smoke-встановлення plugin, встановлення з
  локальної папки, поведінку пропуску оновлення локальної папки, локальні папки з
  попередньо встановленими залежностями, встановлення пакетів `file:`,
  встановлення з git із виконанням CLI, оновлення рухомого git-посилання,
  встановлення з npm-реєстру з піднятими транзитивними залежностями, no-op
  npm-оновлення, відхилення некоректних метаданих npm-пакета, встановлення з
  локального фікстура ClawHub і no-op оновлення, поведінку оновлення marketplace
  та ввімкнення/інспекцію Claude-бандла. Встановіть
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб блок ClawHub залишався герметичним і
  офлайн.
- `test:docker:plugin-lifecycle-matrix` встановлює пакет-кандидат у порожньому
  контейнері, проводить npm-plugin через встановлення, інспекцію, вимкнення,
  ввімкнення, явне оновлення, явне зниження версії та видалення після видалення
  коду plugin. Він записує метрики RSS і CPU для кожної фази.
- `test:docker:plugin-update` перевіряє, що незмінений встановлений plugin не
  перевстановлюється і не втрачає метадані встановлення під час
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` встановлює tarball-кандидат поверх брудного
  фікстура старого користувача, запускає оновлення пакета плюс
  неінтерактивний doctor, потім запускає loopback Gateway і перевіряє
  збереження стану.
- `test:docker:published-upgrade-survivor` спершу встановлює опублікований
  базовий пакет, конфігурує його через вбудований рецепт `openclaw config set`,
  оновлює до tarball-кандидата, запускає doctor, перевіряє спадкове очищення,
  запускає Gateway і перевіряє `/healthz`, `/readyz` та RPC-статус.
- `test:docker:update-restart-auth` встановлює пакет-кандидат, запускає
  керований Gateway з token-auth, скидає env автентифікації Gateway для
  викликача для `openclaw update --yes --json` і вимагає, щоб команда оновлення
  кандидата перезапустила Gateway перед звичайними пробами.
- `test:docker:update-migration` є ланцюгом опублікованого оновлення з великим
  акцентом на очищення. Він стартує з налаштованого стану користувача у стилі
  Discord/Telegram, запускає базовий doctor, щоб залежності налаштованих plugin
  мали шанс матеріалізуватися, засіває спадкове сміття залежностей plugin для
  налаштованого запакованого plugin, оновлює до tarball-кандидата й вимагає,
  щоб post-update doctor видалив спадкові корені залежностей.

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
`stale-source-plugin-shadow`, `tilde-log-path` і `versioned-runtime-deps`. В
агрегованих запусках `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
розгортається в усі сценарії у формі повідомлених issue, включно з міграцією
встановлення налаштованих plugin.

Повна міграція оновлень навмисно відокремлена від повного CI релізу.
Використовуйте ручний workflow `Update Migration`, коли релізне питання звучить
так: "чи може кожен опублікований стабільний реліз, починаючи з 2026.4.23,
оновитися до цього кандидата й очистити сміття залежностей plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Приймання пакета

Приймання пакета — це GitHub-native пакетний gate. Він розв’язує один пакет
кандидата в tarball `package-under-test`, записує версію та SHA-256, а потім
запускає багаторазові Docker E2E-ланцюги проти саме цього tarball. Посилання
harness workflow відокремлене від посилання джерела пакета, тому поточна логіка
тестів може перевіряти старіші довірені релізи.

Джерела кандидатів:

- `source=npm`: перевірити `openclaw@beta`, `openclaw@latest` або точну
  опубліковану версію.
- `source=ref`: запакувати довірену гілку, тег або commit із вибраним поточним
  harness.
- `source=url`: перевірити публічний HTTPS tarball з обов’язковим
  `package_sha256`. Цей шлях відхиляє облікові дані в URL, нестандартні HTTPS
  порти, приватні/внутрішні hostname або DNS/IP результати, IP-простір
  спеціального призначення та небезпечні redirects.
- `source=trusted-url`: перевірити HTTPS tarball з обов’язковими
  `package_sha256` і `trusted_source_id` за політикою, якою володіють
  maintainer, у `.github/package-trusted-sources.json`. Використовуйте це для
  enterprise/private дзеркал замість послаблення `source=url` перемикачем
  allow-private на рівні input. Bearer auth, коли налаштований політикою,
  використовує фіксований secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: повторно використати tarball, завантажений іншим запуском
  Actions.

Повна перевірка релізу за замовчуванням використовує `source=artifact`,
побудований із розв’язаного SHA релізу. Для підтвердження після публікації
передайте `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, щоб та сама
матриця оновлень цільово перевіряла відправлений npm-пакет.

Релізні перевірки викликають Приймання пакета з набором package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Коли ввімкнено release soak, вони також передають:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Це тримає міграцію пакета, перемикання каналу оновлень, толерантність до
пошкодженого керованого plugin, очищення застарілих залежностей plugin, офлайн
покриття plugin, поведінку оновлення plugin і QA пакета Telegram на тому самому
розв’язаному артефакті, не змушуючи типовий релізний gate пакета проходити всі
опубліковані релізи.

`last-stable-4` розв’язується в чотири найновіші стабільні npm-опубліковані
релізи OpenClaw. Приймання релізного пакета фіксує `2026.4.23` як першу межу
сумісності plugin-update, `2026.5.2` як межу змін архітектури plugin, а
`2026.4.15` як старішу базу published-update для 2026.4.1x; resolver усуває
дублікати pins, які вже входять до останніх чотирьох. Для вичерпного покриття
міграції опублікованих оновлень використовуйте `all-since-2026.4.23` в окремому
workflow Update Migration замість повного CI релізу. `release-history`
залишається доступним для ручного ширшого семплювання, коли вам також потрібен
спадковий pre-date anchor.

Коли вибрано кілька базових версій published-upgrade survivor, багаторазовий
Docker workflow розбиває кожну базу на окрему цільову runner job. Кожен shard
бази все одно запускає вибраний набір сценаріїв, але логи й артефакти
залишаються окремими для кожної бази, а wall time обмежується найповільнішим
shard замість одного великого послідовного job.

Запустіть профіль пакета вручну під час перевірки кандидата перед релізом:

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

Використовуйте `suite_profile=product`, коли релізне питання охоплює MCP-канали,
cron/subagent cleanup, вебпошук OpenAI або OpenWebUI. Використовуйте
`suite_profile=full` лише тоді, коли потрібне повне Docker-покриття релізного
шляху.

## Типові перевірки релізу

Для кандидатів у реліз типовий стек підтвердження такий:

1. `pnpm check:changed` і `pnpm test:changed` для регресій на рівні джерела.
2. `pnpm release:check` для цілісності артефакту пакета.
3. Профіль Приймання пакета `package` або спеціальні package-ланцюги
   release-check для контрактів install/update/restart/plugin.
4. Крос-OS релізні перевірки для специфічної для OS поведінки інсталятора,
   onboarding і платформи.
5. Живі набори лише тоді, коли змінена поверхня торкається поведінки провайдера
   або hosted-service.

На машинах maintainer широкі gate і Docker/package підтвердження продукту мають
запускатися в Testbox, якщо явно не виконується локальне підтвердження.

## Спадкова сумісність

Поблажливість сумісності є вузькою й обмеженою в часі:

- Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть толерувати
  вже відправлені прогалини метаданих пакета в Прийманні пакета.
- Опублікований пакет `2026.4.26` може попереджати про вже відправлені файли
  штампів метаданих локальної збірки.
- Пізніші пакети мають задовольняти сучасні контракти. Ті самі прогалини
  спричиняють помилку замість попередження або пропуску.

Не додавайте нові міграції запуску для цих старих форм. Додайте або розширте
doctor-виправлення, а потім підтвердьте його через `upgrade-survivor`,
`published-upgrade-survivor` або `update-restart-auth`, коли команда оновлення
володіє перезапуском.

## Додавання покриття

Коли змінюєте поведінку оновлення або plugin, додавайте покриття на найнижчому
рівні, який може впасти з правильної причини:

- Чиста логіка шляхів або метаданих: модульний тест поруч із джерелом.
- Поведінка інвентаризації пакета або запакованих файлів: тест `package-dist-inventory` або
  перевірки tarball.
- Поведінка встановлення/оновлення CLI: перевірка в доріжці Docker або фікстура.
- Поведінка міграції опублікованого релізу: сценарій `published-upgrade-survivor`.
- Поведінка перезапуску, що належить оновленню: `update-restart-auth`.
- Поведінка джерела реєстру/пакета: фікстура `test:docker:plugins` або сервер
  фікстур ClawHub.
- Поведінка розкладки залежностей або очищення: перевіряйте як виконання під час runtime, так і
  межу файлової системи. Залежності npm можуть бути підняті всередині керованого npm-проєкту
  Plugin, тому тести мають доводити, що саме цей проєкт сканується/очищається,
  замість припущення лише про локальне для пакета Plugin дерево `node_modules`.

За замовчуванням тримайте нові фікстури Docker герметичними. Використовуйте локальні реєстри фікстур і
фальшиві пакети, якщо метою тесту не є поведінка живого реєстру.

## Тріаж збоїв

Починайте з ідентичності артефакту:

- Зведення Package Acceptance `resolve_package`: джерело, версія, SHA-256 і
  назва артефакту.
- Артефакти Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, журнали доріжок і команди повторного запуску.
- Зведення upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  включно з базовою версією, версією кандидата, сценарієм, таймінгами фаз і
  кроками рецепта.

Надавайте перевагу повторному запуску саме тієї доріжки, що зазнала збою, з тим самим артефактом пакета, а не
повторному запуску всієї парасольки релізу.
