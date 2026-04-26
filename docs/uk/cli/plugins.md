---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
summary: Довідка CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-26T00:29:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52183e4465154afd32d321c7a7a040c0a3c246e334cb81cded5745abebc78e1b
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними пакетами.

Пов’язано:

- Система Plugin: [Плагіни](/uk/tools/plugin)
- Сумісність пакетів: [Пакети Plugin](/uk/plugins/bundles)
- Маніфест і схема Plugin: [Маніфест Plugin](/uk/plugins/manifest)
- Посилення безпеки: [Безпека](/uk/gateway/security)

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

Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser plugin); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`), а також виявлені можливості пакета.

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # закріпити версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення плагінів як до виконання коду. Надавайте перевагу закріпленим версіям.

Якщо ваш розділ `plugins` базується на однофайловому `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла й не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються без змін замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація некоректна, `plugins install` зазвичай завершується без змін і пропонує спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованого плагіна для плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте його, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень із npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про результати рівня `critical`, але **не** обходить блокування політики хуків плагіна `before_install` і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення навичок ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і вмикання окремих хуків, а не для встановлення пакета.

Специфікації npm є **лише для реєстру** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. З міркувань безпеки встановлення залежностей запускаються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці є глобальні налаштування встановлення npm.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із цих варіантів у prerelease, OpenClaw зупиняється та просить вас явно погодитися через тег prerelease, такий як `@beta`/`@rc`, або точну версію prerelease, таку як `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб установити npm-пакет з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих безпечних для npm специфікацій плагінів. Він переходить до npm лише якщо в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.

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

Джерелами marketplace можуть бути:

- назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
- локальний корінь marketplace або шлях `marketplace.json`
- скорочення GitHub-репозиторію, таке як `owner/repo`
- URL GitHub-репозиторію, такий як `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються навички пакетів, command-skills Claude, значення за замовчуванням Claude `settings.json`, значення за замовчуванням Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише увімкнені плагіни. Використовуйте `--verbose`, щоб перейти від табличного подання до докладних рядків для кожного плагіна з метаданими джерела/походження/версії/активації. Використовуйте `--json` для машиночитаного інвентаря та діагностики реєстру.

`plugins list` спочатку читає збережений локальний реєстр плагінів, а якщо реєстр відсутній або некоректний, використовує резервний варіант, похідний лише від маніфесту. Це зручно для перевірки, чи встановлений, увімкнений і видимий плагін для планування холодного запуску, але це не жива перевірка середовища виконання вже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати, що новий код `register(api)` або хуки почнуть виконуватися. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише обгортку.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки й діагностику з проходу інспекції із завантаженим модулем.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо service/process, шлях до конфігурації та стан RPC.
- Для невбудованих хуків розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потрібно
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки зв’язані встановлення повторно використовують шлях до джерела замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` під час встановлення з npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи поведінку за замовчуванням незакріпленою.

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення та оновлення записують їх до `plugins/installs.json` у каталозі стану активного OpenClaw. Його карта верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, похідний від маніфесту. Файл містить попередження не редагувати його вручну й використовується `openclaw plugins update`, uninstall, діагностикою та холодним реєстром плагінів.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, allowlist плагінів і пов’язаних записів `plugins.load.paths`, якщо застосовно.
Для плагінів active memory слот пам’яті скидається до `memory-core`.

За замовчуванням uninstall також видаляє каталог встановлення плагіна під коренем плагінів каталогу активного стану. Використовуйте
`--keep-files`, щоб залишити файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно закріплені версії продовжують використовуватися в наступних запусках `update <id>`.

Для встановлень із npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює встановлений плагін і зберігає нову специфікацію npm для майбутніх оновлень за id.

Передавання назви npm-пакета без версії або тегу також зіставляється назад із
відстежуваним записом плагіна. Використовуйте це, коли плагін був закріплений
на точній версії, а ви хочете повернути його до стандартної гілки випусків реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакета за
метаданими реєстру npm. Якщо встановлена версія та ідентичність записаного
артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без
завантаження, перевстановлення або перезапису `openclaw.json`.

Коли існує збережений хеш цілісності, а хеш завантаженого артефакту змінюється,
OpenClaw розцінює це як дрейф артефакту npm. Інтерактивна команда
`openclaw plugins update` виводить очікуваний і фактичний хеші та запитує
підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення завершуються без змін,
якщо викликач не надає явної політики продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як
аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування
небезпечного коду під час оновлень плагінів. Він, як і раніше, не обходить
блокування політики плагіна `before_install` або блокування через помилки
сканування, і застосовується лише до оновлень плагінів, а не до оновлень
наборів хуків.

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інспекція одного плагіна. Показує ідентичність, стан завантаження, джерело,
зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway,
HTTP-маршрути, прапорці політик, діагностику, метадані встановлення, можливості пакета,
а також будь-яку виявлену підтримку MCP або LSP server.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Детальніше про модель можливостей див. у [Plugin shapes](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитаний звіт, придатний для сценаріїв і
аудиту.

`inspect --all` відображає загальну таблицю з колонками shape, kinds можливостей,
повідомлень про сумісність, можливостей пакета та підсумку хуків.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та
повідомлення про сумісність. Якщо все в порядку, він виводить `No plugin issues
detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторіть запуск
із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експорту до
діагностичного виводу.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для
ідентичності встановлених плагінів, їх увімкнення, метаданих джерела та
власності внесків.
Звичайний запуск, пошук власника провайдера, класифікація налаштування каналів і
інвентар плагінів можуть читати його без імпорту модулів runtime плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній,
актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його із збереженого індексу плагінів,
політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не
шлях активації під час роботи.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний
перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry
--refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише
для аварійного відновлення запуску під час розгортання міграції.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`,
скорочення GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json`
виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і
записи плагінів.

## Пов’язано

- [Довідка CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Спільнотні плагіни](/uk/plugins/community)
