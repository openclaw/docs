---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
summary: Довідка CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: плагіни
x-i18n:
    generated_at: "2026-04-23T07:25:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними пакетами.

Пов’язано:

- Система Plugin: [Plugins](/uk/tools/plugin)
- Сумісність пакетів: [Пакети Plugin](/uk/plugins/bundles)
- Маніфест Plugin + схема: [Маніфест Plugin](/uk/plugins/manifest)
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

Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені типово (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований плагін браузера); для інших потрібна команда `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Розгорнутий вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`), а також виявлені можливості пакета.

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

Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення плагінів так само, як до запуску коду. Надавайте перевагу закріпленим версіям.

Якщо ваш розділ `plugins` підтримується одним файлом `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються без змін, замість спрощення структури. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай завершується без змін і пропонує спочатку запустити `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, який використовується для плагінів, що явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте його, якщо ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайного оновлення вже відстежуваного npm-плагіна використовуйте `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень з npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про результати рівня `critical`, але **не** обходить блокування політик хуків плагіна `before_install` і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованого перегляду хуків і вмикання окремих хуків, а не для встановлення пакетів.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. З міркувань безпеки встановлення залежностей виконується з `--ignore-scripts`.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із цих варіантів до prerelease-версії, OpenClaw зупиняється й просить вас явно погодитися на це за допомогою prerelease-теґа, такого як `@beta`/`@rc`, або точної prerelease-версії, такої як `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб встановити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з Claude marketplace.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих npm-безпечних специфікацій плагінів. До npm він повертається лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
- локальний корінь marketplace або шлях до `marketplace.json`
- скорочений запис GitHub-репозиторію, наприклад `owner/repo`
- URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися в межах клонованого репозиторію marketplace. OpenClaw приймає відносні джерела шляху з цього репозиторію й відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, які не є шляхами, із віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або типове компонування компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються в звичайний корінь плагінів і беруть участь у тих самих потоках list/info/enable/disable. Наразі підтримуються bundle Skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, Cursor command-skills і сумісні каталоги хуків Codex; інші виявлені можливості пакета показуються в diagnostics/info, але ще не підключені до виконання під час runtime.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише завантажені плагіни. Використовуйте `--verbose`, щоб перейти від табличного перегляду до детальних рядків для кожного плагіна з метаданими джерела/походження/версії/активації. Використовуйте `--json` для машиночитаного інвентаря та diagnostics реєстру.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки встановлення з посиланням повторно використовують шлях до джерела замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` під час встановлень із npm, щоб зберегти точну розв’язану специфікацію (`name@version`) у `plugins.installs`, зберігаючи типову поведінку незакріпленою.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, `plugins.installs`, allowlist плагінів і пов’язані записи `plugins.load.paths`, якщо застосовно. Для плагінів active memory слот пам’яті скидається до `memory-core`.

Типово uninstall також видаляє каталог встановлення плагіна в корені плагінів активного state-dir. Використовуйте `--keep-files`, щоб зберегти файли на диску.

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

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно закріплені версії й надалі використовуються в наступних запусках `update <id>`.

Для встановлень із npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із записом відстежуваного плагіна, оновлює встановлений плагін і зберігає нову специфікацію npm для майбутніх оновлень за id.

Передавання назви npm-пакета без версії або теґа також зіставляє її назад із записом відстежуваного плагіна. Використовуйте це, якщо плагін було закріплено на точній версії, а ви хочете повернути його до типової гілки релізів реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія й записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

Коли існує збережений хеш цілісності й хеш завантаженого артефакту змінюється, OpenClaw розцінює це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` показує очікуваний і фактичний хеші та просить підтвердити продовження. Неінтерактивні помічники оновлення завершуються без змін, якщо викликач не надає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він, як і раніше, не обходить блокування політик плагіна `before_install` або блокування через збої сканування та застосовується лише до оновлень плагінів, а не до оновлень наборів хуків.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного плагіна. Показує ідентичність, статус завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway, HTTP-маршрути, прапорці політик, diagnostics, метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP або LSP server.

Кожен плагін класифікується за тим, що саме він фактично реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитаний звіт, придатний для сценаріїв і аудиту.

`inspect --all` відображає таблицю для всього парку з колонками форми, типів можливостей, повідомлень про сумісність, можливостей пакета та зведення хуків.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics маніфесту/виявлення та повідомлення про сумісність. Якщо все гаразд, він виводить `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутність експортів `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у diagnostics-вивід.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json` виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і записи плагінів.
