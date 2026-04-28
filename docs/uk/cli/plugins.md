---
read_when:
    - Ви хочете встановити Plugin для Gateway, керувати ними або сумісними пакетами
    - Ви хочете діагностувати збої під час завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-28T17:10:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b34b992248eec8830471d795d1827af208f739325fa02b01d58922a969d3b2
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin Gateway, пакетами hooks і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення й усунення несправностей plugins.
  </Card>
  <Card title="Bundles Plugin" href="/uk/plugins/bundles">
    Модель сумісності bundle.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлень Plugin.
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

Для дослідження повільного встановлення, інспектування, видалення або оновлення registry запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw повинні постачати `openclaw.plugin.json` з inline JSON Schema (`configSchema`, навіть якщо порожня). Сумісні bundles натомість використовують власні маніфести bundle.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) і виявлені можливості bundle.
</Note>

### Встановлення

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Bare-імена пакетів перевіряються спочатку в ClawHub, потім у npm. Ставтеся до встановлення Plugin як до запуску коду. Надавайте перевагу pinned-версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Config includes і відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підкріплений однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують у цей включений файл і залишають `openclaw.json` незмінним. Кореневі includes, масиви includes та includes із sibling overrides завершуються закрито замість flattening. Див. [Config includes](/uk/gateway/configuration) для підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin, щоб інші канали та plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для plugins, які явно обирають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або hook pack на місці. Використовуйте це, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або npm-артефакту. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до npm-встановлень. Він не підтримується з `--marketplace`, оскільки marketplace-встановлення зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибнопозитивних спрацювань у вбудованому сканері небезпечного коду. Вона дозволяє встановленню продовжитися, навіть коли вбудований сканер повідомляє про findings рівня `critical`, але вона **не** обходить блокування політики hook `before_install` Plugin і **не** обходить помилки сканування.

    Цей CLI flag застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей skill через Gateway використовують відповідний request override `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill із ClawHub.

  </Accordion>
  <Accordion title="Hook packs і npm specs">
    `plugins install` також є поверхнею встановлення для hook packs, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості hooks і по-hook увімкнення, а не для встановлення пакета.

    Npm specs є **лише registry** (ім’я пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver ranges відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування npm install.

    Використовуйте `npm:<package>`, коли хочете пропустити lookup у ClawHub і встановити напряму з npm. Bare package specs усе ще віддають перевагу ClawHub і переходять до npm лише тоді, коли ClawHub не має цього пакета або версії.

    Bare specs і `@latest` залишаються на stable track. Якщо npm resolve будь-якого з них до prerelease, OpenClaw зупиняється й просить вас явно погодитися через prerelease tag, як-от `@beta`/`@rc`, або точну prerelease-версію, як-от `@1.2.3-beta.4`.

    Якщо bare install spec збігається з id вбудованого Plugin (наприклад, `diffs`), OpenClaw встановлює вбудований Plugin напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin OpenClaw повинні містити дійсний `openclaw.plugin.json` у корені видобутого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw записує записи встановлення.

    Встановлення з marketplace Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для bare npm-safe plugin specs. Він переходить до npm лише тоді, коли ClawHub не має цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати npm-only resolution, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє оголошену сумісність plugin API / minimum gateway compatibility, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг стежити за новішими релізами ClawHub; явні селектори версії або tag, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються pinned до цього селектора.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному registry cache Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

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
    - назва known-marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення GitHub repo, як-от `owner/repo`
    - URL GitHub repo, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplaces, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого marketplace repo. OpenClaw приймає relative path sources з цього repo та відхиляє HTTP(S), absolute-path, git, GitHub та інші non-path plugin sources з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex bundles (`.codex-plugin/plugin.json`)
- сумісні з Claude bundles (`.claude-plugin/plugin.json` або стандартний layout component Claude)
- сумісні з Cursor bundles (`.cursor-plugin/plugin.json`)

<Note>
Сумісні bundles встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Сьогодні підтримуються bundle skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, Cursor command-skills і сумісні каталоги hooks Codex; інші виявлені можливості bundle показуються в діагностиці/info, але ще не під’єднані до виконання runtime.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показати лише увімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний inventory плюс registry diagnostics.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний plugin registry, із fallback, derived лише з manifest, коли registry відсутній або недійсний. Це корисно для перевірки, чи Plugin встановлений, увімкнений і видимий для планування cold startup, але це не live runtime probe уже запущеного процесу Gateway. Після зміни коду Plugin, enablement, hook policy або `plugins.load.paths` перезапустіть Gateway, що обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або hooks. Для remote/container deployments перевірте, що ви перезапускаєте фактичний child `openclaw gateway run`, а не лише wrapper process.
</Note>

Для роботи з вбудованим Plugin усередині packaged Docker image bind-mount каталог
source Plugin поверх відповідного packaged source path, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить цей mounted source
overlay перед `/app/dist/extensions/synology-chat`; звичайний copied source
directory залишається неактивним, тож нормальні packaged installs і далі використовують compiled dist.

Для runtime hook debugging:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки й діагностику з проходу перевірки завантаженого модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях до конфігурації та стан RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують вихідний шлях замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, зберігаючи типову поведінку без закріплення.
</Note>

### Індекс Plugin

Метадані встановлення Plugin є станом, керованим машиною, а не користувацькою конфігурацією. Встановлення й оновлення записують їх у `plugins/installs.json` у активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є надійним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів Plugin. Масив `plugins` — це холодний кеш реєстру, похідний від маніфестів. Файл містить попередження не редагувати його та використовується командами `openclaw plugins update`, видаленням, діагностикою й холодним реєстром Plugin.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у конфігурації, він переміщує їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin із `plugins.entries`, збереженого індексу Plugin, записів списків дозволу/заборони Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований у корені розширень Plugin OpenClaw. Для Plugin active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень пакетів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id Plugin проти npm-специфікації">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію пакета npm із dist-тегом або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису Plugin, оновлює цей встановлений Plugin і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви пакета npm без версії або тегу також розв’язується назад до відстежуваного запису Plugin. Використовуйте це, коли Plugin був закріплений до точної версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія і записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється, OpenClaw вважає це дрейфом npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політик Plugin `before_install` або блокування через невдале сканування, і застосовується лише до оновлень Plugin, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція одного Plugin. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, служби, методи Gateway, HTTP-маршрути, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP.

Кожен Plugin класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку зі стовпцями форми, видів можливостей, повідомлень про сумісність, можливостей пакета та зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Для помилок форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати компактне зведення форми експортів до діагностичного виводу.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена холодна read model OpenClaw для ідентичності встановлених Plugin, увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу й інвентаризація Plugin можуть читати його без імпорту модулів виконання Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; env-запасний варіант призначений лише для аварійного відновлення запуску, поки міграція розгортається.
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
- [Plugin спільноти](/uk/plugins/community)
