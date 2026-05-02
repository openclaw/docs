---
read_when:
    - Ви хочете встановити плагіни Gateway або сумісні пакети чи керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T03:16:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей Plugin.
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

Для розслідування повільного встановлення, перевірки, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і залишає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані Plugin постачаються з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin OpenClaw мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо порожньою). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
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
Голі назви пакетів спочатку перевіряються в ClawHub, потім у npm. Ставтеся до встановлення Plugin як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` надсилає запит до ClawHub щодо встановлюваних пакетів Plugin і виводить
назви пакетів, готові до встановлення. Пошук охоплює пакети code-plugin і bundle-plugin,
а не Skills. Використовуйте `openclaw skills search` для Skills у ClawHub.

<Note>
ClawHub є основною поверхнею поширення та виявлення для більшості Plugin. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Під час міграції до
ClawHub OpenClaw усе ще постачає деякі належні OpenClaw пакети Plugin `@openclaw/*`
у npm; версії цих пакетів можуть відставати від вбудованого вихідного коду між
циклами випусків Plugin. Якщо npm повідомляє, що належний OpenClaw пакет Plugin застарілий, ця
опублікована версія є старим зовнішнім артефактом; використовуйте Plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість сплющення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай завершується закрито і повідомляє спершу запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація для одного Plugin ізолюється до цього Plugin, щоб інші канали та Plugin могли продовжувати працювати; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих Plugin, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного Plugin npm надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється і вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли хочете закріплене джерело. Він не підтримується з `--marketplace`, бо встановлення marketplace зберігають метадані джерела marketplace замість spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний варіант для хибних спрацювань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавців у [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і specs npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Specs npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Specs Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується локально в проєкті з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити безпосередньо з npm. Голі specs пакетів усе ще надають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має такого пакета або версії.

    Голі specs і `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-який із них до prerelease, OpenClaw зупиняється і просить вас явно погодитися за допомогою prerelease-тега, наприклад `@beta`/`@rc`, або точної prerelease-версії, наприклад `@1.2.3-beta.4`.

    Якщо голий spec встановлення збігається з офіційним id Plugin (наприклад, `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб установити пакет npm з такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Репозиторії Git">
    Використовуйте `git:<repo>`, щоб установити безпосередньо з репозиторію git. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб checkout гілку, тег або commit перед встановленням.

    Встановлення Git клонують у тимчасовий каталог, checkout потрібний ref, якщо він наявний, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як встановлення npm. Записані встановлення git містять URL/ref джерела плюс розв’язаний commit, щоб `openclaw plugins update` міг повторно розв’язати джерело пізніше.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, як-от методи gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin OpenClaw мають містити дійсний `openclaw.plugin.json` у витягнутому корені Plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для голих npm-безпечних specs Plugin. Він повертається до npm лише якщо ClawHub не має такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусити розв’язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність plugin API / мінімального gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійований ClawPack, перевіряє digest-заголовок ClawHub і digest артефакта, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub і факти digest ClawPack для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг стежити за новішими випусками ClawHub; явні селектори версії або тега, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

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
  <Tab title="Джерела маркетплейсів">
    - ім’я відомого маркетплейса Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь маркетплейса або шлях `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого маркетплейса">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію маркетплейса. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела Plugin, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь plugin і беруть участь у тому самому процесі list/info/enable/disable. Наразі підтримуються bundle skills, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості пакета показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Показати лише ввімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на детальні рядки для кожного plugin з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар разом із діагностикою реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр plugin, із fallback на основі лише маніфесту, якщо реєстр відсутній або недійсний. Це корисно для перевірки, чи plugin встановлено, увімкнено та видно для планування холодного запуску, але це не live-перевірка процесу Gateway, який уже працює. Після зміни коду plugin, стану ввімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або hook. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код plugin. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, короткий опис і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими plugin всередині запакованого Docker-образу змонтуйте каталог
джерела plugin поверх відповідного запакованого шляху до джерела, як-от
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований overlay джерела
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерела
залишиться інертним, тож звичайні запаковані встановлення й далі використовуватимуть скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hooks і діагностику з проходу інспекції із завантаженим модулем. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані plugins.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях конфігурації та стан RPC.
- Невбудовані hooks розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях до джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі plugin, залишаючи стандартну поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машино-керований стан, а не користувацька конфігурація. Встановлення й оновлення записують їх у `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів plugin. Масив `plugins` — це отриманий із маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, uninstall, діагностикою та холодним реєстром plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи plugin з `plugins.entries`, збереженого індексу plugin, записів списків дозволу/заборони plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, uninstall також видаляє відстежуваний керований каталог встановлення, коли він розташований усередині кореня plugin extensions OpenClaw. Для plugins активної пам’яті слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень plugin у керованому індексі plugin і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id plugin і npm-специфікації">
    Коли ви передаєте id plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє назву цього пакета з відстежуваним записом plugin, оновлює цей встановлений plugin і записує нову npm-специфікацію для майбутніх оновлень на основі id.

    Передавання назви npm-пакета без версії або тегу також зіставляється з відстежуваним записом plugin. Використовуйте це, коли plugin було закріплено до точної версії, і ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і зміщення цілісності">
    Перед live-оновленням npm OpenClaw перевіряє версію встановленого пакета щодо метаданих npm-реєстру. Якщо встановлена версія та записана ідентичність артефакта вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакта змінюється, OpenClaw розглядає це як зміщення npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із закритою відмовою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для хибних спрацьовувань вбудованого сканування небезпечного коду під час оновлень plugin. Він усе ще не обходить блокування політики plugin `before_install` або блокування через помилки сканування, і застосовується лише до оновлень plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту runtime plugin за замовчуванням. Додайте `--runtime`, щоб завантажити модуль plugin і включити зареєстровані hooks, інструменти, команди, сервіси, gateway methods і HTTP routes. Runtime-інспекція повідомляє про відсутні залежності plugin напряму; встановлення й ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать plugin, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен plugin класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливості (наприклад, plugin лише для provider)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hooks, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з колонками форми, видів можливостей, повідомлень сумісності, можливостей пакета та зведення hook. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, діагностику маніфесту/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр plugin — це збережена в OpenClaw модель холодного читання для ідентичності встановлених plugin, стану ввімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника provider, класифікація налаштування каналу та інвентар plugin можуть читати його без імпорту runtime-модулів plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях ремонту, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; env fallback призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list приймає локальний шлях маркетплейса, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела разом із розібраним маніфестом маркетплейса та записами plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні plugins](/uk/plugins/community)
