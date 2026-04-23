---
read_when:
    - Ви хочете встановити або керувати Plugin Gateway чи сумісними наборами Plugin
    - Ви хочете налагодити збої завантаження Plugin
summary: Довідник CLI для `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-23T20:48:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e940ac64f562ded6dec6702d7d93a55ed3d6a69df6cae8811e9d02482bda0bbe
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте Plugin Gateway, наборами hooks і сумісними наборами Plugin.

Пов’язане:

- Система Plugin: [Plugins](/uk/tools/plugin)
- Сумісність наборів: [Plugin bundles](/uk/plugins/bundles)
- Маніфест Plugin + схема: [Plugin manifest](/uk/plugins/manifest)
- Посилення безпеки: [Security](/uk/gateway/security)

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

Вбудовані Plugins постачаються разом з OpenClaw. Деякі з них увімкнені типово (наприклад,
вбудовані провайдери моделей, вбудовані мовленнєві провайдери та вбудований браузерний
Plugin); інші потребують `plugins enable`.

Нативні Plugins OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON
Schema (`configSchema`, навіть якщо вона порожня). Сумісні набори Plugin натомість використовують власні
маніфести наборів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Розгорнутий вивід list/info
також показує підтип набору (`codex`, `claude` або `cursor`) і виявлені можливості
набору.

### Install

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Неуточнені імена пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки:
ставтеся до встановлення Plugin як до виконання коду. Надавайте перевагу зафіксованим версіям.

Якщо ваш розділ `plugins` підтримується одним `$include` файлом, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються безпечною відмовою замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай завершується безпечною
відмовою й радить спочатку запустити `openclaw doctor --fix`. Єдиний задокументований виняток — вузький
шлях відновлення вбудованих Plugin для Plugin, які явно погоджуються на
`openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений
Plugin або набір hooks на місці. Використовуйте це, коли ви свідомо перевстановлюєте
той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm.
Для звичайного оновлення вже відстежуваного npm Plugin краще використовувати
`openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw
зупиняється й пропонує скористатися `plugins update <id-or-npm-spec>` для звичайного оновлення,
або `plugins install <package> --force`, якщо ви дійсно хочете перезаписати
поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`,
оскільки встановлення з marketplace зберігають метадані джерела marketplace замість
специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних
спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть
коли вбудований сканер повідомляє про результати `critical`, але **не**
обходить блокування політики hook `before_install` у Plugin і **не** обходить збої
сканування.

Цей прапорець CLI застосовується до потоків install/update Plugin. Встановлення залежностей
Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком
завантаження/встановлення Skills з ClawHub.

`plugins install` також є поверхнею встановлення для наборів hooks, які публікують
`openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої
видимості hooks і вмикання окремих hooks, а не для встановлення пакетів.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконуються з `--ignore-scripts` з міркувань безпеки.

Неуточнені специфікації й `@latest` залишаються на стабільній гілці. Якщо npm розв’язує
будь-який із цих варіантів у prerelease, OpenClaw зупиняється й просить вас явно погодитися через
тег prerelease, наприклад `@beta`/`@rc`, або точну версію prerelease, наприклад
`@1.2.3-beta.4`.

Якщо неуточнена специфікація встановлення збігається з id вбудованого Plugin (наприклад `diffs`), OpenClaw
встановлює вбудований Plugin напряму. Щоб установити npm-пакет із такою самою
назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для неуточнених npm-safe специфікацій Plugin. Він переходить
до npm лише якщо в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену
сумісність Plugin API / мінімальну сумісність gateway, а потім встановлює його через звичайний
шлях архіву. Зафіксовані встановлення зберігають свої метадані джерела ClawHub для подальших
оновлень.

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному
кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
- URL git

Для віддалених marketplace, завантажених із GitHub або git, записи Plugin мають залишатися
в межах клонованого repo marketplace. OpenClaw приймає джерела відносних шляхів із
цього repo й відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутеві
джерела Plugin з віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні Plugins OpenClaw (`openclaw.plugin.json`)
- сумісні набори Plugin Codex (`.codex-plugin/plugin.json`)
- сумісні набори Plugin Claude (`.claude-plugin/plugin.json` або типовий макет
  компонентів Claude)
- сумісні набори Plugin Cursor (`.cursor-plugin/plugin.json`)

Сумісні набори Plugin встановлюються до звичайного кореня Plugin і беруть участь
у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle Skills, Claude
command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` /
`lspServers`, оголошені в маніфесті, command-skills Cursor та сумісні
каталоги hooks Codex; інші виявлені можливості наборів показуються в diagnostics/info, але ще не підключені до виконання під час runtime.

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показувати лише завантажені Plugins. Використовуйте `--verbose`, щоб перейти від
табличного подання до рядків з деталями для кожного Plugin із метаданими
джерела/походження/версії/активації. Використовуйте `--json` для машиночитного переліку й
діагностики реєстру.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують
вихідний шлях замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для встановлень npm, щоб зберегти визначену точну специфікацію (`name@version`) у
`plugins.installs`, зберігаючи типову поведінку без фіксації.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, `plugins.installs`,
allowlist Plugin і записи пов’язаних `plugins.load.paths`, якщо це застосовно.
Для Plugins Active Memory слот пам’яті скидається до `memory-core`.

Типово uninstall також видаляє каталог встановлення Plugin у межах активного
кореня Plugin каталогу стану. Використовуйте
`--keep-files`, щоб залишити файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень у `plugins.installs` і відстежуваних
встановлень наборів hooks у `hooks.internal.installs`.

Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього
Plugin. Це означає, що раніше збережені dist-tag, наприклад `@beta`, і точні зафіксовані
версії надалі також використовуються під час запуску `update <id>`.

Для встановлень npm ви також можете передати явну специфікацію npm-пакета з dist-tag
або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом Plugin,
оновлює встановлений Plugin і зберігає нову специфікацію npm для майбутніх
оновлень за id.

Передавання назви npm-пакета без версії або тега також зіставляється назад із
відстежуваним записом Plugin. Використовуйте це, коли Plugin було зафіксовано на точній версії й
ви хочете повернути його до типової лінії випусків реєстру.

Перед реальним оновленням npm OpenClaw перевіряє встановлену версію пакета відносно
метаданих реєстру npm. Якщо встановлена версія й ідентичність записаного артефакту
вже збігаються з розв’язаною ціллю, оновлення пропускається без
завантаження, перевстановлення або перезапису `openclaw.json`.

Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється,
OpenClaw розглядає це як дрейф артефакту npm. Інтерактивна
команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить
підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення завершуються безпечною відмовою,
якщо викликач не передасть явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як
аварійне перевизначення для хибнопозитивних результатів вбудованого сканування небезпечного коду під час
оновлень Plugin. Він усе ще не обходить блокування політики `before_install` у Plugin
або блокування через збої сканування, і застосовується лише до оновлень Plugin, а не наборів hooks.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інспекція одного Plugin. Показує identity, стан завантаження, джерело,
зареєстровані можливості, hooks, інструменти, команди, служби, методи gateway,
маршрути HTTP, прапорці політики, diagnostics, метадані встановлення, можливості набору,
а також будь-яку виявлену підтримку серверів MCP або LSP.

Кожен Plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип capability (наприклад, Plugin лише провайдера)
- **hybrid-capability** — кілька типів capability (наприклад, text + speech + images)
- **hook-only** — лише hooks, без capability або поверхонь
- **non-capability** — tools/commands/services, але без capability

Докладніше про модель capability див. у [Plugin shapes](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і
аудиту.

`inspect --all` відображає таблицю для всього набору Plugin з shape, типами capability,
примітками про сумісність, можливостями наборів і стовпцями з підсумком hooks.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, diagnostics маніфесту/виявлення та
примітки про сумісність. Коли все в порядку, він виводить `No plugin issues
detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторно запустіть
з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту у
вивід diagnostics.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях marketplace, шлях `marketplace.json`, скорочений
запис GitHub на кшталт `owner/repo`, URL GitHub repo або URL git. `--json`
виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і
записи Plugin.
