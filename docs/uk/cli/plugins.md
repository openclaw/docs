---
read_when:
    - Ви хочете встановити плагіни Gateway або керувати ними чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-05-02T19:10:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c708f1f9d06bd07ba87ec0d88c98dacccca28422ea1097f98e07b4ee03697508
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin-и Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей Plugin-и.
  </Card>
  <Card title="Керування Plugin-и" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, виведення списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
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
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
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

Для розслідування повільного встановлення, інспектування, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує часові показники фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані Plugin-и постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin-и OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) разом із виявленими можливостями бандла.
</Note>

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
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
Голі назви пакетів під час перехідного запуску встановлюються з npm за замовчуванням. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення Plugin-ів як до запуску коду. Віддавайте перевагу зафіксованим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів Plugin-ів і виводить
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не Skills. Використовуйте `openclaw skills search` для Skills ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості Plugin-ів. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Під час міграції до
ClawHub OpenClaw усе ще постачає деякі належні OpenClaw пакети Plugin-ів `@openclaw/*`
на npm; версії цих пакетів можуть відставати від вбудованого вихідного коду між поїздами випусків Plugin-ів. Якщо npm повідомляє, що належний OpenClaw пакет Plugin застарілий, ця
опублікована версія є старим зовнішнім артефактом; використовуйте Plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після некоректної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість сплющення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація некоректна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway некоректна конфігурація одного Plugin ізолюється до цього Plugin, щоб інші канали та Plugin-и могли продовжувати працювати; `openclaw doctor --fix` може помістити некоректний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованих Plugin-ів для Plugin-ів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного npm Plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли вам потрібне зафіксоване джерело. Він не підтримується з `--marketplace`, оскільки marketplace-встановлення зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибних спрацювань у вбудованому сканері небезпечного коду. Він дозволяє встановленню продовжитися, навіть коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політики хука Plugin `before_install` і **не** обходить збої сканування.

    Цей CLI-прапорець застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували на ClawHub, блокується скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете зробити розв’язання npm явним. Голі package specs також встановлюються безпосередньо з npm під час перехідного запуску.

    Голі specs і `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-який із них до prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, такого як `@beta`/`@rc`, або точної prerelease-версії, такої як `@1.2.3-beta.4`.

    Якщо голий install spec збігається з офіційним id Plugin (наприклад, `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб встановити пакет npm з такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>`, щоб установити безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо він присутній, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і CLI-команди. Якщо Plugin зареєстрував CLI-корінь за допомогою `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin-ів OpenClaw мають містити дійсний `openclaw.plugin.json` у корені видобутого Plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw записує записи встановлення.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-безпечні specs Plugin-ів під час перехідного запуску встановлюються з npm за замовчуванням:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв’язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлену сумісність plugin API / minimum gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакта, а потім установлює його через звичайний архівний шлях. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають метадані джерела ClawHub, тип артефакта, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсіоновані встановлення ClawHub зберігають неверсіонований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете явно передати джерело marketplace:

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
    - скорочення репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, командні Skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, командні Skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/інформації, але ще не під’єднані до виконання під час роботи.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише ввімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки докладних відомостей для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар, а також діагностика реєстру і стан встановлення залежностей пакетів.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із запасним варіантом, похідним лише від маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін встановлений, увімкнений і видимий для планування холодного запуску, але це не активна перевірка під час виконання вже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, що обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` містить `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
присутні вздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує код виконання плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує код виконання плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, підсумок і
підказку для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим плагіном усередині запакованого Docker-образу bind-монтуйте каталог
джерел плагіна поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладення джерел
перед `/app/dist/extensions/synology-chat`; звичайно скопійований каталог джерел
залишається неактивним, тож звичайні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження хуків під час виконання:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки й діагностику з проходу інспектування із завантаженим модулем. Інспектування під час виконання ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані плагіни.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки сервісу/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, бо пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс плагінів

Метадані встановлення плагінів — це стан, керований машиною, а не користувацька конфігурація. Встановлення та оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є сталим джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів плагінів. Масив `plugins` — це похідний від маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою і холодним реєстром плагінів.

Коли OpenClaw бачить у конфігурації постачені застарілі записи `plugins.installs`, він переносить їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не втратилися.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо не задано `--keep-files`, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень пакетів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id плагіна та npm-специфікації">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час пізніших запусків `update <id>`.

    Для npm-встановлень також можна передати явну специфікацію npm-пакета з dist-тегом або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тегу також зіставляється з відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено до точної версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед фактичним npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія і записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли збережений хеш цілісності існує, а хеш отриманого артефакту змінюється, OpenClaw розглядає це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються блокувальною помилкою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="`--dangerously-force-unsafe-install` під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як екстрене перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політикою плагіна `before_install` або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Інспектування

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Інспектування показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту коду виконання плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, інструменти, команди, сервіси, методи Gateway і HTTP-маршрути. Інспектування під час виконання напряму повідомляє про відсутні залежності плагіна; встановлення й виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать плагіну, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, що реєструє `demo-git`, можна перевірити через `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, плагін лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає загальну таблицю для всього набору зі стовпцями форми, видів можливостей, повідомлень про сумісність, можливостей пакетів і підсумку хуків. `info` є псевдонімом для `inspect`.
</Note>

### Діагностика

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати компактний підсумок форми експорту до діагностичного виводу.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для ідентичності встановлених плагінів, увімкнення, метаданих джерела та володіння внеском. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпорту runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях виправлення, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий екстрений перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-механізм призначений лише для екстреного відновлення запуску, поки розгортається міграція.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях маркетплейсу, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. `--json` друкує розв’язану мітку джерела, а також розібраний маніфест маркетплейсу і записи плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
