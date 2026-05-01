---
read_when:
    - Ви хочете встановити плагіни Gateway чи сумісні пакети або керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-01T20:36:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c743beebf7b862f7991f04d3330452b8ff5c447b9eacea72a042f964d7bb0f6
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin-ами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей Plugin-ів.
  </Card>
  <Card title="Бандли Plugin-ів" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення Plugin-ів.
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
openclaw plugins inspect <id> --runtime
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

Для дослідження повільного встановлення, перевірки, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані Plugin-и постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin-и OpenClaw мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Деталізований вивід списку/інформації також показує підтип бандла (`codex`, `claude` або `cursor`) разом із виявленими можливостями бандла.
</Note>

### Встановлення

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення Plugin-ів як до запуску коду. Надавайте перевагу зафіксованим версіям.
</Warning>

<Note>
ClawHub є основною поверхнею розповсюдження та пошуку для більшості Plugin-ів. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Під час міграції до
ClawHub OpenClaw досі постачає деякі пакети Plugin-ів, що належать OpenClaw,
`@openclaw/*` у npm; версії цих пакетів можуть відставати від вбудованого джерела між
хвилями випусків Plugin-ів. Якщо npm позначає пакет Plugin, що належить OpenClaw, як застарілий, ця
опублікована версія є старим зовнішнім артефактом; використовуйте Plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після некоректної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість розгортання. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація некоректна, `plugins install` зазвичай завершується закрито й повідомляє спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway некоректна конфігурація одного Plugin ізолюється для цього Plugin, щоб інші канали й Plugin-и могли продовжувати працювати; `openclaw doctor --fix` може помістити некоректний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для Plugin-ів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте це, коли ви навмисно повторно встановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й указує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне зафіксоване джерело. Він не підтримується з `--marketplace`, оскільки встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — аварійний варіант для хибних спрацювань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills, підтримувані Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити безпосередньо з npm. Прості specs пакетів усе ще надають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має такого пакета або версії.

    Прості specs і `@latest` залишаються на стабільному каналі. Якщо npm вирішує будь-який із них у prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, такого як `@beta`/`@rc`, або точної prerelease-версії, такої як `@1.2.3-beta.4`.

    Якщо простий install spec збігається з офіційним id Plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб встановити пакет npm з такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб checkout гілку, тег або commit перед встановленням.

    Git-встановлення клонують у тимчасовий каталог, checkout запитаний ref, якщо він наявний, а потім використовують звичайний установник каталогу Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/ref джерела плюс вирішений commit, щоб `openclaw plugins update` міг повторно вирішити джерело пізніше.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin-ів OpenClaw мають містити чинний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw записує записи встановлення.

    Встановлення з маркетплейсу Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для простих npm-безпечних specs Plugin. Він повертається до npm лише тоді, коли ClawHub не має такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати вирішення лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє оголошену сумісність plugin API / мінімального gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.
Неверсіоновані встановлення з ClawHub зберігають неверсіонований записаний spec, щоб `openclaw plugins update` міг стежити за новішими випусками ClawHub; явні селектори версій або тегів, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

#### Скорочення маркетплейсу

Використовуйте скорочення `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете передати джерело маркетплейсу явно:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела маркетплейсу">
    - назва відомого маркетплейсу Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь маркетплейсу або шлях `marketplace.json`
    - скорочення GitHub-репозиторію, як-от `owner/repo`
    - URL GitHub-репозиторію, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених з GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає відносні джерела шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутеві джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартна структура компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, командні Skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, командні Skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не під’єднані до виконання під час роботи.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише ввімкнені Plugin.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на докладні рядки для кожного Plugin з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із резервним варіантом, похідним лише від маніфестів, коли реєстр відсутній або недійсний. Це корисно, щоб перевірити, чи Plugin встановлений, увімкнений і видимий для планування холодного запуску, але це не live-перевірка середовища виконання вже запущеного процесу Gateway. Після зміни коду Plugin, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з комплектним Plugin усередині запакованого Docker-образу змонтуйте каталог вихідного коду Plugin поверх відповідного запакованого шляху вихідного коду, наприклад `/app/extensions/synology-chat`. OpenClaw виявить цей змонтований оверлей вихідного коду перед `/app/dist/extensions/synology-chat`; звичайно скопійований каталог вихідного коду лишається неактивним, тож нормальні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження хуків середовища виконання:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки й діагностику з проходу інспекції із завантаженням модуля. Інспекція середовища виконання ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані Plugin.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки служби/процесу, шлях конфігурації та справність RPC.
- Некомплектні хуки розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, тому що пов’язані встановлення повторно використовують шлях вихідного коду замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, залишаючи стандартну поведінку без фіксації.
</Note>

### Індекс Plugin

Метадані встановлення Plugin є машино-керованим станом, а не користувацькою конфігурацією. Встановлення й оновлення записують їх у `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є сталим джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` є похідним від маніфестів кешем холодного реєстру. Файл містить попередження не редагувати його й використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром Plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списку allow/deny Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, видалення також прибирає відстежуваний керований каталог встановлення, коли він міститься всередині кореня розширень Plugin OpenClaw. Для Plugin активної пам’яті слот пам’яті скидається до `memory-core`.

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
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні зафіксовані версії й далі використовуються під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії чи тегу також зіставляється назад із відстежуваним записом Plugin. Використовуйте це, коли Plugin був зафіксований на точній версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версії та дрейф цілісності">
    Перед live-оновленням npm OpenClaw перевіряє встановлену версію пакета щодо метаданих npm-реєстру. Якщо встановлена версія й записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із забороною, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики Plugin `before_install` або блокування через збій сканування, і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Інспекція показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту середовища виконання Plugin за замовчуванням. Додайте `--runtime`, щоб завантажити модуль Plugin і включити зареєстровані хуки, інструменти, команди, служби, методи Gateway і HTTP-маршрути. Інспекція середовища виконання напряму повідомляє про відсутні залежності Plugin; встановлення й ремонти лишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє Plugin, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду під `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, Plugin, що реєструє `demo-git`, можна перевірити через `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього набору з формою, видами можливостей, повідомленнями про сумісність, можливостями пакетів і стовпцями зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту в діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin є збереженою моделлю холодного читання OpenClaw для встановленої ідентичності Plugin, увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу й інвентар Plugin можуть читати його без імпорту модулів середовища виконання Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях ремонту, а не шлях активації середовища виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` є застарілим аварійним перемикачем сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-варіант призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list приймає локальний шлях marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела плюс розібраний маніфест marketplace і записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
