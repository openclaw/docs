---
read_when:
    - Ви хочете встановити або керувати plugin для Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження plugin
summary: Довідка CLI для `openclaw plugins` (список, установлення, marketplace, видалення, увімкнення/вимкнення, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T06:19:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad76a8068054d145db578ed01f1fb0726fff884c48d256ad8c0b708a516cd727
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте plugin для Gateway, пакетами хуків і сумісними пакетами.

Пов’язане:

- Система plugin: [Plugins](/uk/tools/plugin)
- Сумісність пакетів: [Пакети plugin](/uk/plugins/bundles)
- Маніфест plugin + схема: [Маніфест plugin](/uk/plugins/manifest)
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

Вбудовані plugins постачаються разом з OpenClaw. Деякі з них увімкнені типово (наприклад,
вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований plugin браузера);
інші потребують `plugins enable`.

Рідні plugins OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON-схемою
(`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info
також показує підтип пакета (`codex`, `claude` або `cursor`) плюс виявлені можливості пакета.

### Установлення

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

Спочатку для простих назв пакетів виконується перевірка у ClawHub, а потім у npm. Примітка щодо безпеки:
ставтеся до встановлення plugin так, ніби ви запускаєте код. Віддавайте перевагу закріпленим версіям.

Якщо конфігурація невалідна, `plugins install` зазвичай завершується за принципом fail closed і повідомляє, що спочатку
потрібно виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях
відновлення для вбудованого plugin, який явно ввімкнув
`openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль установлення та перезаписує вже встановлений
plugin або пакет хуків на місці. Використовуйте цей параметр, коли ви навмисно перевстановлюєте
той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm.
Для звичайних оновлень уже відстежуваного npm plugin краще використовувати
`openclaw plugins update <id-or-npm-spec>`.

`--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`,
оскільки встановлення через marketplace зберігають метадані джерела marketplace замість
специфікації npm.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань
вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть тоді,
коли вбудований сканер повідомляє про результати рівня `critical`, але **не**
обходить блокування політик хука plugin `before_install` і **не** обходить блокування
через збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Установлення
залежностей Skills через Gateway використовують відповідне перевизначення запиту
`dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим
потоком завантаження/встановлення Skills із ClawHub.

`plugins install` також є поверхнею встановлення для пакетів хуків, які надають
`openclaw.hooks` у `package.json`. Для відфільтрованої видимості хуків і вмикання
окремих хуків використовуйте `openclaw hooks`, а не встановлення пакета.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або
**dist-tag**). Специфікації Git/URL/файлів і діапазони semver відхиляються. Для безпеки
залежності встановлюються з `--ignore-scripts`.

Прості специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку
з них у пререліз, OpenClaw зупиняється й просить вас явно погодитися, указавши
тег пререлізу, наприклад `@beta`/`@rc`, або точну версію пререлізу, наприклад
`@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого plugin (наприклад, `diffs`), OpenClaw
встановлює вбудований plugin безпосередньо. Щоб установити npm-пакет із такою самою
назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Для встановлень із ClawHub використовується явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих plugin-специфікацій, безпечних для npm. Він переходить
до npm лише тоді, коли у ClawHub немає такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену
сумісність API plugin / мінімальну сумісність із gateway, а потім установлює його через звичайний
шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших
оновлень.

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному
кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, якщо хочете передати джерело marketplace явно:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Джерелами marketplace можуть бути:

- відома Claude назва marketplace з `~/.claude/plugins/known_marketplaces.json`
- локальний корінь marketplace або шлях `marketplace.json`
- скорочення GitHub-репозиторію на кшталт `owner/repo`
- URL GitHub-репозиторію на кшталт `https://github.com/owner/repo`
- URL git

Для віддалених marketplace, завантажених з GitHub або git, записи plugin мають залишатися
в межах клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із
цього репозиторію й відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела plugin,
що не є шляхами, з віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- рідні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються у звичайний корінь extensions і беруть участь у тому самому потоці
list/info/enable/disable. Наразі підтримуються bundle Skills, command-skills Claude,
типові значення Claude `settings.json`, типові значення Claude `.lsp.json` /
`lspServers`, оголошені в маніфесті, command-skills Cursor та сумісні
каталоги хуків Codex; інші виявлені можливості пакета показуються в diagnostics/info, але
ще не підключені до виконання в runtime.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише завантажені plugins. Використовуйте `--verbose`, щоб перейти
від табличного подання до рядків із докладною інформацією про кожен plugin із метаданими
джерела/походження/версії/активації. Для машинозчитуваного переліку та
діагностики реєстру використовуйте `--json`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки зв’язані встановлення повторно використовують
шлях до джерела замість копіювання у керовану ціль установлення.

Використовуйте `--pin` для встановлень npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у
`plugins.installs`, залишаючи типову поведінку без закріплення.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи plugin з `plugins.entries`, `plugins.installs`,
списку дозволених plugin і зв’язаних записів `plugins.load.paths`, де це застосовується.
Для plugin Active Memory слот пам’яті скидається до `memory-core`.

Типово `uninstall` також видаляє каталог установлення plugin у корені plugin
активного каталогу стану. Використовуйте
`--keep-files`, щоб зберегти файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень у `plugins.installs` і відстежуваних
встановлень пакетів хуків у `hooks.internal.installs`.

Коли ви передаєте id plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього
plugin. Це означає, що раніше збережені dist-tag, наприклад `@beta`, і точні закріплені
версії продовжують використовуватися під час наступних запусків `update <id>`.

Для встановлень npm ви також можете передати явну специфікацію npm-пакета з dist-tag
або точною версією. OpenClaw зіставляє назву цього пакета назад із відстежуваним записом plugin,
оновлює встановлений plugin і записує нову специфікацію npm для майбутніх
оновлень за id.

Передавання назви npm-пакета без версії чи тега також зіставляється назад із
відстежуваним записом plugin. Використовуйте це, коли plugin був закріплений на точній версії й
ви хочете повернути його на типову лінію релізів реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими
реєстру npm. Якщо встановлена версія та ідентичність записаного артефакту вже
збігаються з розв’язаною ціллю, оновлення пропускається без
завантаження, перевстановлення або перезапису `openclaw.json`.

Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється,
OpenClaw трактує це як дрейф артефакту npm. Інтерактивна команда
`openclaw plugins update` показує очікуваний і фактичний хеші та запитує
підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення завершуються за принципом fail closed,
якщо викликач не надає явної політики продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як
аварійне перевизначення для хибнопозитивних спрацьовувань сканування небезпечного коду під час
оновлення plugin. Він, як і раніше, не обходить блокування політики `before_install` plugin
або блокування через збій сканування й застосовується лише до оновлень plugin, а не до
оновлень пакетів хуків.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного plugin. Показує ідентичність, стан завантаження, джерело,
зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway,
маршрути HTTP, прапорці політик, diagnostics, метадані встановлення, можливості пакета
та будь-яку виявлену підтримку серверів MCP або LSP.

Кожен plugin класифікується за тим, що він фактично реєструє в runtime:

- **plain-capability** — один тип можливостей (наприклад, plugin лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [Форми plugin](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і
аудиту.

`inspect --all` відображає загальносистемну таблицю з колонками форми, типів можливостей,
приміток сумісності, можливостей пакета та зведення хуків.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, diagnostics маніфесту/виявлення та
примітки щодо сумісності. Коли все в порядку, виводиться `No plugin issues
detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторно запустіть
із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити в діагностичний вивід компактне зведення форми експортів.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`,
скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. `--json`
виводить розв’язану мітку джерела, а також розібраний маніфест marketplace і
записи plugin.
