---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними збірками
    - Ви хочете налагодити збої завантаження Plugin
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-24T14:42:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними збірками.

Пов’язане:

- Система Plugin: [Плагіни](/uk/tools/plugin)
- Сумісність збірок: [Збірки Plugin](/uk/plugins/bundles)
- Маніфест Plugin і схема: [Маніфест Plugin](/uk/plugins/manifest)
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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені типово (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser plugin); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Натомість сумісні збірки використовують власні маніфести збірок.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип збірки (`codex`, `claude` або `cursor`), а також виявлені можливості збірки.

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # зафіксувати версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Неповні назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу зафіксованим версіям.

Якщо ваш розділ `plugins` підтримується одним файлом `$include`, то `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями безпечно завершуються з помилкою замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай безпечно завершується з помилкою та радить спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення вбудованого плагіна для плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте це, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється та вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, якщо ви дійсно хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень npm. Його не підтримано з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про знахідки рівня `critical`, але **не** обходить блокування політики хуків плагіна `before_install` і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills, що використовують Gateway, застосовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills з ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Для безпеки встановлення залежностей запускаються з `--ignore-scripts`.

Неповні специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них до prerelease-версії, OpenClaw зупиняється та просить вас явно погодитися на це за допомогою prerelease-теґа, такого як `@beta`/`@rc`, або точної prerelease-версії, такої як `@1.2.3-beta.4`.

Якщо неповна специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб встановити npm-пакет з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для неповних npm-безпечних специфікацій плагінів. Перехід до npm відбувається лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API Plugin / мінімальну сумісність gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.

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
- скорочений запис GitHub repo, наприклад `owner/repo`
- URL GitHub repo, наприклад `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого repo marketplace. OpenClaw приймає відносні джерела шляху з цього repo та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- Codex-сумісні збірки (`.codex-plugin/plugin.json`)
- Claude-сумісні збірки (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- Cursor-сумісні збірки (`.cursor-plugin/plugin.json`)

Сумісні збірки встановлюються в звичайний кореневий каталог плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills збірок, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості збірок показуються в diagnostics/info, але поки що не підключені до виконання під час runtime.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише завантажені плагіни. Використовуйте `--verbose`, щоб перейти від табличного подання до докладних рядків для кожного плагіна з метаданими джерела/походження/версії/активації. Використовуйте `--json` для машиночитного інвентарю та diagnostics реєстру.

`plugins list` запускає виявлення з поточного середовища CLI та конфігурації. Це корисно для перевірки того, чи ввімкнений/завантажуваний плагін, але це не жива перевірка runtime уже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуск нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте саме дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

Для налагодження хуків у runtime:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та diagnostics із проходу перевірки із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо service/process, шлях до конфігурації та стан RPC.
- Для невбудованих хуків розмови (`llm_input`, `llm_output`, `agent_end`) потрібно `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується разом із `--link`, оскільки пов’язані встановлення повторно використовують вихідний шлях замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для встановлень npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у `plugins.installs`, залишаючи типову поведінку без фіксації.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, `plugins.installs`, allowlist плагінів і пов’язаних записів `plugins.load.paths`, якщо це застосовно. Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

Типово `uninstall` також видаляє каталог встановлення плагіна в корені плагінів активного state-dir. Використовуйте `--keep-files`, щоб зберегти файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень у `plugins.installs` і відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно зафіксовані версії продовжують використовуватися під час наступних запусків `update <id>`.

Для встановлень npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із записом відстежуваного плагіна, оновлює встановлений плагін і записує нову специфікацію npm для майбутніх оновлень за id.

Передавання назви npm-пакета без версії або теґа також зіставляє її назад із записом відстежуваного плагіна. Використовуйте це, коли плагін було зафіксовано на точній версії, а ви хочете повернути його до типової лінії релізів реєстру.

Перед фактичним оновленням npm OpenClaw перевіряє встановлену версію пакета щодо метаданих реєстру npm. Якщо встановлена версія та ідентичність записаного артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

Коли збережений хеш цілісності існує, а хеш отриманого артефакту змінюється,
OpenClaw розцінює це як дрейф артефакту npm. Інтерактивна команда
`openclaw plugins update` показує очікувані та фактичні хеші й просить
підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення безпечно завершуються з помилкою,
якщо викликаюча сторона не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як
аварійне перевизначення для хибнопозитивних результатів вбудованого сканування
небезпечного коду під час оновлення плагінів. Він, як і раніше, не обходить
блокування політики плагіна `before_install` або блокування через збої
сканування, і застосовується лише до оновлень плагінів, а не до оновлень
наборів хуків.

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного плагіна. Показує ідентичність, стан
завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди,
сервіси, методи gateway, маршрути HTTP, прапорці політик, diagnostics,
метадані встановлення, можливості збірки, а також будь-яку виявлену підтримку
серверів MCP або LSP.

Кожен плагін класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Детальніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитний звіт, придатний для сценаріїв і
аудиту.

`inspect --all` виводить загальносистемну таблицю з колонками shape, типів
можливостей, повідомлень про сумісність, можливостей збірок і підсумку хуків.

`info` є псевдонімом для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics
маніфесту/виявлення та повідомлення про сумісність. Коли все в порядку, він
виводить `Проблем із плагінами не виявлено.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`,
перезапустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний
підсумок форми експорту у вивід diagnostics.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list приймає локальний шлях до marketplace, шлях до `marketplace.json`,
скорочення GitHub на кшталт `owner/repo`, URL GitHub repo або git URL. `--json`
виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і
записи плагінів.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Плагіни спільноти](/uk/plugins/community)
