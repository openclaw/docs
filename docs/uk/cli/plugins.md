---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами.
    - Ви хочете налагодити збої завантаження плагінів.
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (список, встановлення, marketplace, видалення, увімкнення/вимкнення, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-27T12:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7db12eb8ec456c83a2e35ed8a09b850d9bced40ec6cabf488f8fad87972ce2
    source_path: cli/plugins.md
    workflow: 15
---

Керуйте плагінами Gateway, наборами хуків і сумісними пакетами.

<CardGroup cols={2}>
  <Card title="Система плагінів" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо встановлення, увімкнення та усунення проблем із плагінами.
  </Card>
  <Card title="Пакети плагінів" href="/uk/plugins/bundles">
    Модель сумісності пакетів.
  </Card>
  <Card title="Маніфест плагіна" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлень плагінів.
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
Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований плагін браузера); для інших потрібна команда `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою схемою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`) разом із виявленими можливостями пакета.
</Note>

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
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
Звичайні назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення плагінів як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після некоректної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, то `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються без змін замість сплющення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

    Якщо під час встановлення конфігурація некоректна, `plugins install` зазвичай безпечно зупиняється і радить спочатку виконати `openclaw doctor --fix`. Під час запуску Gateway некоректна конфігурація одного плагіна ізолюється лише до цього плагіна, тож інші канали й плагіни можуть продовжувати роботу; `openclaw doctor --fix` може ізолювати запис некоректного плагіна. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих плагінів, які явно дозволяють це через `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="`--force` і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте це, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або npm-артефакту. Для звичайних оновлень уже відстежуваного npm-плагіна віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії `--pin`">
    `--pin` застосовується лише до npm-встановлень. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не npm-специфікацію.
  </Accordion>
  <Accordion title="`--dangerously-force-unsafe-install`">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про результати рівня `critical`, але **не** обходить блокування політики хуків плагіна `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

  </Accordion>
  <Accordion title="Набори хуків і npm-специфікації">
    `plugins install` також є поверхнею встановлення для наборів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і вмикання окремих хуків, а не для встановлення пакетів.

    Npm-специфікації є **лише для реєстру** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/файлів і діапазони semver відхиляються. Задля безпеки встановлення залежностей виконуються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці є глобальні налаштування npm install.

    Використовуйте `npm:<package>`, якщо хочете пропустити пошук у ClawHub і встановити напряму з npm. Звичайні специфікації пакетів і далі віддають перевагу ClawHub і переходять до npm, лише якщо в ClawHub немає цього пакета або версії.

    Звичайні специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них до попереднього випуску, OpenClaw зупиняється й просить вас явно погодитися через тег попереднього випуску, наприклад `@beta`/`@rc`, або точну версію попереднього випуску, наприклад `@1.2.3-beta.4`.

    Якщо звичайна специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw мають містити коректний `openclaw.plugin.json` у корені розпакованого плагіна; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи про встановлення.

    Також підтримуються встановлення з marketplace Claude.

  </Accordion>
</AccordionGroup>

Для встановлень із ClawHub використовується явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також віддає перевагу ClawHub для звичайних безпечних для npm специфікацій плагінів. Перехід до npm відбувається лише якщо в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово виконати розв’язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність із Gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.
Неверсійовані встановлення з ClawHub зберігають неверсійовану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версії або тегів, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими на цьому селекторі.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, якщо хочете явно передати джерело marketplace:

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
    - скорочення GitHub-репозиторію, наприклад `owner/repo`
    - URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються в звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише увімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки з детальною інформацією для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний список плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, а якщо реєстр відсутній або некоректний, використовує резервний варіант, похідний лише від маніфесту. Це корисно для перевірки, чи встановлено плагін, чи він увімкнений і чи видимий для планування холодного запуску, але це не жива перевірка середовища виконання вже запущеного процесу Gateway. Після зміни коду плагіна, його стану увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуск нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з вбудованими плагінами всередині запакованого Docker-образу змонтуйте вихідний каталог плагіна поверх відповідного запакованого шляху вихідних файлів, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладення вихідних файлів раніше за `/app/dist/extensions/synology-chat`; звичайно скопійований каталог вихідних файлів залишається неактивним, тож стандартні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження хуків середовища виконання:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки й діагностику з проходу перевірки із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях до конфігурації та стан RPC.
- Для невбудованих хуків розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потрібен параметр `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає запис до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, оскільки встановлення з посиланням повторно використовують шлях до джерела замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс плагінів

Метадані встановлення плагінів — це керований машиною стан, а не користувацька конфігурація. Під час встановлень і оновлень вони записуються в `plugins/installs.json` у активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, зокрема записів для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, похідний від маніфесту. Файл містить попередження про те, що його не слід редагувати, і використовується командами `openclaw plugins update`, uninstall, діагностикою та холодним реєстром плагінів.

Коли OpenClaw бачить у конфігурації наявні застарілі записи `plugins.installs`, він переносить їх до індексу плагінів і видаляє ключ конфігурації; якщо будь-який із записів не вдається, записи в конфігурації зберігаються, щоб не втратити метадані встановлення.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів списку дозволу/заборони плагінів і, за потреби, пов’язаних записів `plugins.load.paths`. Якщо не встановлено `--keep-files`, uninstall також видаляє відстежуваний керований каталог встановлення, коли він розташований у корені розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається на `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id плагіна проти npm-специфікації">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точні закріплені версії й надалі використовуються в наступних запусках `update <id>`.

    Для npm-встановлень ви також можете передати явну npm-специфікацію пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передача назви npm-пакета без версії чи тегу також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін був закріплений на точній версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версії та дрейф цілісності">
    Перед живим оновленням npm OpenClaw перевіряє версію встановленого пакета за метаданими реєстру npm. Якщо встановлена версія та ідентичність записаного артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення чи перезапису `openclaw.json`.

    Якщо існує збережений хеш цілісності й хеш отриманого артефакту змінюється, OpenClaw розцінює це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення безпечно зупиняються, якщо виклик не надає явної політики продовження.

  </Accordion>
  <Accordion title="`--dangerously-force-unsafe-install` під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлення плагінів. Він, як і раніше, не обходить блокування політики `before_install` плагіна або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень наборів хуків.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного плагіна. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, сервіси, методи Gateway, HTTP-маршрути, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP.

Кожен плагін класифікується за тим, що саме він реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, text + speech + images)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — tools/commands/services, але без можливостей

Детальніше про модель можливостей див. у [Форми плагінів](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машиночитаний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає загальносистемну таблицю з колонками shape, capability kinds, compatibility notices, bundle capabilities і hook summary. `info` — це псевдонім для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфесту/виявлення та сповіщення про сумісність. Якщо все в порядку, він виводить `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутність експортів `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати до діагностичного виводу стислий підсумок форми експортів.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для встановленої ідентичності плагінів, стану увімкнення, метаданих джерела та належності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналів та інвентаризація плагінів можуть читати його без імпорту модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр існує, чи є актуальним або застарілим. Використовуйте `--refresh`, щоб перебудувати його на основі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час роботи.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-механізм слід використовувати лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json` виводить мітку розв’язаного джерела разом із розібраним маніфестом marketplace і записами плагінів.

## Пов’язано

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
