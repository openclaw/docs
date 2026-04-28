---
read_when:
    - Ви хочете встановити плагіни Gateway чи сумісні пакети або керувати ними.
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-28T11:07:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b458b67b905941f8f1424db7127640a3ae033dde5092daafd9926567d1bfc6cb
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте plugins Gateway, пакетами хуків і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення проблем із plugins.
  </Card>
  <Card title="Bundles Plugin" href="/uk/plugins/bundles">
    Модель сумісності bundle.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення plugins.
  </Card>
</CardGroup>

## Команди

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Вбудовані plugins постачаються разом з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні bundles натомість використовують власні маніфести bundle.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) і виявлені можливості bundle.
</Note>

### Встановлення

```bash
openclaw plugins install <package>                      # спершу ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install npm:<package>                  # лише npm
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # закріпити версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Голі назви пакетів перевіряються спочатку в ClawHub, потім у npm. Ставтеся до встановлення plugins як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Підключення конфігурації та відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` базується на однофайловому `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей підключений файл і залишають `openclaw.json` без змін. Кореневі includes, масиви includes та includes із сусідніми перевизначеннями завершуються закрито, а не розгортаються. Див. [Підключення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin, щоб інші канали й plugins могли продовжити роботу; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений plugin або пакет хуків на місці. Використовуйте це, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо запустити `plugins install` для id plugin, який уже встановлено, OpenClaw зупиниться й вкаже на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацювань у вбудованому сканері небезпечного коду. Вона дає змогу продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про знахідки рівня `critical`, але вона **не** обходить блокування політики хуків `before_install` plugin і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей skill через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill з ClawHub.

  </Accordion>
  <Accordion title="Пакети хуків і specs npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які expose `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Specs npm є **лише registry** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Specs Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` для безпеки, навіть якщо у вашій оболонці є глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити безпосередньо з npm. Голі specs пакетів усе ще надають перевагу ClawHub і переходять до npm лише тоді, коли ClawHub не має такого пакета або версії.

    Голі specs і `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із них у prerelease, OpenClaw зупиняється й просить явно погодитися через prerelease-тег, як-от `@beta`/`@rc`, або точну prerelease-версію, як-от `@1.2.3-beta.4`.

    Якщо голий spec встановлення збігається з id вбудованого plugin (наприклад, `diffs`), OpenClaw встановлює вбудований plugin напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних plugins OpenClaw мають містити чинний `openclaw.plugin.json` у корені розпакованого plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Також підтримуються встановлення з Claude marketplace.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для голих npm-safe specs plugin. Він переходить до npm лише тоді, коли ClawHub не має такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати розв’язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує тільки в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє оголошену сумісність plugin API / мінімальну сумісність Gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.
Встановлення ClawHub без версії зберігають записаний spec без версії, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші registry Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете передати джерело marketplace явно:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела marketplace">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplaces, завантажених з GitHub або git, записи plugin мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-path джерела plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- Codex-сумісні bundles (`.codex-plugin/plugin.json`)
- Claude-сумісні bundles (`.claude-plugin/plugin.json` або стандартний layout компонентів Claude)
- Cursor-сумісні bundles (`.cursor-plugin/plugin.json`)

<Note>
Сумісні bundles встановлюються у звичайний корінь plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості bundle показуються в diagnostics/info, але ще не підключені до виконання в runtime.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показати лише ввімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на докладні рядки для кожного plugin із метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний inventory плюс diagnostics registry.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний registry plugin, із fallback, виведеним лише з маніфестів, коли registry відсутній або недійсний. Це корисно для перевірки, чи plugin встановлено, увімкнено та видно для планування cold startup, але це не live runtime probe уже запущеного процесу Gateway. Після зміни коду plugin, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/container розгортань переконайтеся, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише wrapper-процес.
</Note>

Для роботи з вбудованим plugin всередині запакованого Docker image примонтуйте bind mount каталогу
джерел plugin поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований source
overlay перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог
джерел залишиться інертним, тож звичайні запаковані встановлення й надалі використовуватимуть скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --json` показує зареєстровані hooks і діагностику з проходу інспекції завантаженого модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях конфігурації та справність RPC.
- Не вбудовані conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують вихідний шлях замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, залишаючи стандартну поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це стан, керований машиною, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довготривалим джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` — це похідний від маніфестів холодний кеш реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром Plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх до індексу Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списку дозволу/заборони Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, видалення також прибирає відстежуваний керований каталог встановлення, коли він міститься всередині кореня розширень Plugin OpenClaw. Для Plugin активної пам’яті слот пам’яті скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id Plugin проти npm-специфікації">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису Plugin, оновлює цей встановлений Plugin і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії чи тега також розв’язується назад до відстежуваного запису Plugin. Використовуйте це, коли Plugin було закріплено до точної версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє версію встановленого пакета за метаданими npm-реєстру. Якщо встановлена версія та записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення чи переписування `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надасть явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політик Plugin `before_install` або блокування через збій сканування, і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція одного Plugin. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, hooks, інструменти, команди, сервіси, методи Gateway, HTTP-маршрути, прапорці політик, діагностику, метадані встановлення, можливості bundle і будь-яку виявлену підтримку сервера MCP або LSP.

Кожен Plugin класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hooks, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з колонками форми, типів можливостей, повідомлень сумісності, можливостей bundle і зведення hooks. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфестів/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту до діагностичного виводу.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена холодна модель читання OpenClaw для ідентичності встановлених Plugin, увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях ремонту, а не шлях активації під час виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; env fallback призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях Marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела разом із розібраним маніфестом Marketplace і записами Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
