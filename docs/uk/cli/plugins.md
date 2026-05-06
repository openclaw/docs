---
read_when:
    - Ви хочете встановити плагіни Gateway чи сумісні пакети або керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T11:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ba9facc76f272d765068bbf78d2319484c6268f8a598ceac43998e34e889a26
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів із встановлення, увімкнення та усунення несправностей Plugin.
  </Card>
  <Card title="Керування Plugin" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення Plugin.
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
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Бандловані Plugin постачаються разом з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад бандловані провайдери моделей, бандловані провайдери мовлення та бандлований браузерний Plugin); для інших потрібна команда `plugins enable`.

Нативні Plugin OpenClaw повинні містити `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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
Під час перехідного запуску голі назви пакетів за замовчуванням установлюються з npm. Для ClawHub використовуйте `clawhub:<package>`. Ставтеся до встановлення Plugin як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо встановлюваних пакетів Plugin і виводить
готові до встановлення назви пакетів. Вона шукає пакети code-plugin і bundle-plugin,
а не Skills. Для Skills ClawHub використовуйте `openclaw skills search`.

<Note>
ClawHub є основною поверхнею розповсюдження та пошуку для більшості Plugin. npm
залишається підтримуваним резервним і прямим шляхом встановлення. Пакети Plugin
`@openclaw/*`, що належать OpenClaw, знову публікуються на npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення з beta-каналу надають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення недійсної конфігурації">
    Якщо ваш розділ `plugins` спирається на однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують зміни безпосередньо до цього включеного файлу й залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення із сусідніми перевизначеннями завершуються безпечною відмовою замість згладжування. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується безпечною відмовою й повідомляє, що спочатку потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація Plugin завершується безпечною відмовою, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може карантинувати недійсний запис Plugin. Єдиний документований виняток під час встановлення — вузький шлях відновлення бандлованих Plugin для Plugin, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте це, коли ви навмисно повторно встановлюєте той самий ідентифікатор із нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для ідентифікатора Plugin, який уже встановлено, OpenClaw зупиняється й скеровує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явне посилання git, наприклад `git:github.com/acme/plugin@v1.2.3`, коли хочете закріплене джерело. Він не підтримується з `--marketplace`, бо встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — аварійний параметр для хибних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє встановленню продовжитися, навіть коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills, підтримувані Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, використовуйте кроки для видавців у [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакета.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо у вашій оболонці налаштовано глобальні параметри встановлення npm. Керовані npm-корені Plugin успадковують npm `overrides` OpenClaw на рівні пакета, тож безпекові закріплення хоста також застосовуються до піднятих залежностей Plugin.

    Використовуйте `npm:<package>`, коли хочете явно задати розв’язання через npm. Голі специфікації пакетів також установлюються безпосередньо з npm під час перехідного запуску.

    Голі специфікації та `@latest` залишаються на стабільному каналі. Версії корекцій OpenClaw із датованими позначками, як-от `2026.5.3-1`, є стабільними випусками для цієї перевірки. Якщо npm розв’язує будь-яку з них до попереднього випуску, OpenClaw зупиняється й просить вас явно погодитися через тег попереднього випуску, як-от `@beta`/`@rc`, або точну версію попереднього випуску, як-от `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з офіційним ідентифікатором Plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб установити пакет npm із такою самою назвою, використовуйте явну специфікацію з областю видимості (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Репозиторії Git">
    Використовуйте `git:<repo>`, щоб установити безпосередньо з репозиторію Git. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Встановлення з Git клонують у тимчасовий каталог, переходять на запитаний ref, коли він присутній, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як установлення npm. Записані встановлення git включають URL/ref джерела та розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з Git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації середовища виконання, як-от методи Gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin OpenClaw повинні містити дійсний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете
    протестувати той самий керований шлях встановлення npm-кореня, який використовується встановленнями з реєстру,
    включно з перевіркою `package-lock.json`, скануванням піднятих залежностей і
    записами встановлення npm. Звичайні шляхи архівів усе ще встановлюються як локальні архіви
    під коренем розширень Plugin.

    Встановлення з маркетплейсу Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-сумісні специфікації Plugin за замовчуванням установлюються з npm під час перехідного запуску:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб явно задати розв’язання лише через npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлений API Plugin / мінімальну сумісність Gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і дані дайджесту ClawPack для подальших оновлень.
Неверсіоновані встановлення ClawHub зберігають неверсіоновану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; селектори явної версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення маркетплейсу

Використовуйте скорочення `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Для віддалених marketplace, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутьові джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex бандли (`.codex-plugin/plugin.json`)
- сумісні з Claude бандли (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor бандли (`.cursor-plugin/plugin.json`)

<Note>
Сумісні бандли встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills бандла, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені маніфестом `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості бандла показуються в діагностиці/info, але ще не підключені до виконання в runtime.
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
  Показати лише ввімкнені Plugin.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар разом із діагностикою реєстру та станом встановлення залежностей пакунків.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр Plugin, із резервним варіантом, виведеним лише з маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи Plugin встановлено, увімкнено та видно для планування холодного запуску, але це не live runtime-перевірка вже запущеного процесу Gateway. Після зміни коду Plugin, увімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або hook. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного Plugin з `package.json`
`dependencies` та `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакунків
присутні вздовж звичайного шляху пошуку Node `node_modules` для Plugin; він
не імпортує runtime-код Plugin, не запускає менеджер пакунків і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакунки й не завантажує runtime-код Plugin. Результати пошуку
містять назву пакунка ClawHub, family, channel, версію, короткий опис і
підказку для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим Plugin усередині запакованого Docker-образу bind-mount каталогу
джерела Plugin поверх відповідного запакованого шляху джерела, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований overlay джерела
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерела
залишається неактивним, тож звичайні запаковані встановлення й надалі використовують скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hook і діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані Plugin, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки сервісу/процесу, шлях конфігурації та справність RPC.
- Невбудовані hook розмови (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, оскільки пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це керований машиною стан, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` — це виведений із маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою і холодним реєстром Plugin.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у конфігурації, він переміщує їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збережений індекс Plugin, записи списків дозволу/заборони Plugin і пов’язані записи `plugins.load.paths`, коли це застосовно. Якщо не встановлено `--keep-files`, видалення також прибирає відстежуваний керований каталог інсталяції, коли він міститься в кореневому каталозі розширень Plugin OpenClaw. Для Plugin Active Memory слот пам’яті скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних інсталяцій Plugin у керованому індексі Plugin і відстежуваних інсталяцій пакетів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Визначення id Plugin або специфікації npm">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію інсталяції для цього Plugin. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні закріплені версії й надалі використовуються під час наступних запусків `update <id>`.

    Для інсталяцій npm ви також можете передати явну специфікацію пакета npm із dist-тегом або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом Plugin, оновлює цей інстальований Plugin і записує нову специфікацію npm для майбутніх оновлень за id.

    Передавання назви пакета npm без версії чи тегу також зіставляється з відстежуваним записом Plugin. Використовуйте це, коли Plugin було закріплено за точною версією, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію Plugin, якщо ви не передаєте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: у beta-каналі записи npm стандартної лінії та Plugin ClawHub спочатку пробують `@beta`, а потім повертаються до записаної стандартної/останньої специфікації, якщо beta-випуску Plugin не існує. Точні версії та явні теги залишаються закріпленими за цим селектором.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим оновленням npm OpenClaw перевіряє версію інстальованого пакета за метаданими реєстру npm. Якщо інстальована версія та записана ідентичність артефакта вже збігаються з визначеною ціллю, оновлення пропускається без завантаження, повторної інсталяції чи переписування `openclaw.json`.

    Коли існує збережений хеш цілісності й хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф артефакта npm. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із закритою відмовою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний для `plugins update` як аварійне перевизначення хибних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики `before_install` Plugin або блокування через помилку сканування, і застосовується лише до оновлень Plugin, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Перевірка показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані інсталяції, можливості бандла та будь-яку виявлену підтримку серверів MCP або LSP без типового імпорту runtime Plugin. Додайте `--runtime`, щоб завантажити модуль Plugin і включити зареєстровані хуки, інструменти, команди, сервіси, методи Gateway і HTTP-маршрути. Перевірка runtime напряму повідомляє про відсутні залежності Plugin; інсталяції та відновлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє Plugin, інсталюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, Plugin, що реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з формою, видами можливостей, повідомленнями про сумісність, можливостями бандла та колонками з підсумком хуків. `info` є псевдонімом для `inspect`.
</Note>

### Діагностика

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він виводить `No plugin issues detected.`

Якщо налаштований Plugin присутній на диску, але заблокований перевірками безпеки шляху завантажувача, валідація конфігурації зберігає запис Plugin і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого Plugin, наприклад володіння шляхом або дозволи на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати компактний підсумок форми експортів до діагностичного виводу.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр plugin — це збережена модель холодного читання OpenClaw для ідентичності встановлених plugin, їх увімкнення, метаданих джерела та належності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація plugin можуть читати його без імпорту runtime-модулів plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу plugin, політики конфігурації та метаданих manifest/package. Це шлях відновлення, а не шлях runtime-активації.

`openclaw doctor --fix` також виправляє суміжне з реєстром відхилення керованого npm: якщо осиротілий або відновлений пакет `@openclaw/*` у корені керованого npm для plugin затіняє вбудований plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях marketplace, шлях `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить визначену мітку джерела, а також розібраний маніфест marketplace і записи plugin.

## Пов’язане

- [Створення plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Plugin спільноти](/uk/plugins/community)
