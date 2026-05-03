---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-05-03T18:43:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, пакетами хуків і сумісними пакетами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей плагінів.
  </Card>
  <Card title="Керування плагінами" href="/uk/plugins/manage-plugins">
    Швидкі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Пакети Plugin" href="/uk/plugins/bundles">
    Модель сумісності пакетів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
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

Для дослідження повільного встановлення, інспектування, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані плагіни постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний плагін); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачати `openclaw.plugin.json` з inline JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід списку/інформації також показує підтип пакета (`codex`, `claude` або `cursor`) плюс виявлені можливості пакета.
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
Непрефіксовані назви пакетів під час перехідного етапу запуску за замовчуванням встановлюються з npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу зафіксованим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів плагінів і виводить
готові до встановлення назви пакетів. Пошук виконується серед пакетів code-plugin і bundle-plugin,
а не Skills. Використовуйте `openclaw skills search` для Skills у ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості плагінів. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Пакети плагінів
`@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар плагінів](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення з бета-каналу віддають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файлу й залишають `openclaw.json` незмінним. Кореневі include, масиви include та include із сусідніми перевизначеннями безпечно відмовляють замість розгортання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай безпечно відмовляє й просить спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація плагінів безпечно відмовляє, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може ізолювати недійсний запис плагіна. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого плагіна для плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або пакет хуків на місці. Використовуйте це, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й указує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до npm-встановлень. Він не підтримується з встановленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне зафіксоване джерело. Він не підтримується з `--marketplace`, тому що встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість npm-специфікації.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — аварійна опція для хибних спрацьовувань у вбудованому сканері небезпечного коду. Вона дозволяє встановленню продовжитися, навіть коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики хуків `before_install` плагіна і **не** обходить помилки сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills, підтримувані Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо плагін, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете зробити розв’язання npm явним. Непрефіксовані специфікації пакетів також встановлюються безпосередньо з npm під час перехідного етапу запуску.

    Непрефіксовані специфікації та `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-яку з них у prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, наприклад `@beta`/`@rc`, або точної prerelease-версії, наприклад `@1.2.3-beta.4`.

    Якщо непрефіксована специфікація встановлення збігається з офіційним id плагіна (наприклад `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб установити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Репозиторії Git">
    Використовуйте `git:<repo>`, щоб установлювати безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні `https://`, `ssh://`, `git://`, `file://` та URL клонування `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, коли він присутній, а потім використовують звичайний інсталятор каталогу плагіна. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення включають URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг згодом повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, як-от методи gateway і команди CLI. Якщо плагін зареєстрував CLI-root через `api.registerCli`, виконуйте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw мають містити дійсний `openclaw.plugin.json` у корені витягнутого плагіна; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення з маркетплейсу Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Непрефіксовані npm-безпечні специфікації плагінів під час перехідного етапу запуску за замовчуванням встановлюються з npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв’язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлену сумісність API плагіна / мінімальну сумісність Gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack і далі встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсійні встановлення ClawHub зберігають неверсійну записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

#### Скорочений запис маркетплейсу

Використовуйте скорочений запис `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете явно передати джерело маркетплейсу:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела маркетплейсу">
    - назва відомого Claude маркетплейсу з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь маркетплейсу або шлях `marketplace.json`
    - скорочення GitHub репозиторію, наприклад `owner/repo`
    - URL GitHub репозиторію, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- пакети, сумісні з Codex (`.codex-plugin/plugin.json`)
- пакети, сумісні з Claude (`.claude-plugin/plugin.json` або стандартна структура компонентів Claude)
- пакети, сумісні з Cursor (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакета, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, Cursor command-skills і сумісні каталоги хуків Codex; інші виявлені можливості пакета показуються в diagnostics/info, але ще не підключені до виконання під час роботи.
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
  Перемикає табличний вигляд на деталізовані рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний інвентар, а також діагностика реєстру та стан установлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із резервним варіантом, виведеним лише з маніфестів, якщо реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін установлений, увімкнений і видимий для планування холодного запуску, але це не живий runtime-зонд уже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, що обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` та `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного для плагіна шляху пошуку Node `node_modules`; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, зведення та
підказку для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими плагінами всередині запакованого Docker образу змонтуйте каталог
джерел плагіна поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання джерел
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерел
залишиться неактивним, тож нормальні запаковані встановлення й надалі використовуватимуть скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані плагіни.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерел замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm встановлень, щоб зберегти вирішену точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Установлення та оновлення записують їх у `plugins/installs.json` в активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, зокрема записів для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, виведений із маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, uninstall, diagnostics і холодним реєстром плагінів.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, uninstall також видаляє відстежуваний керований каталог установлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних установлень плагінів у керованому індексі плагінів і відстежуваних установлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Вирішення id плагіна проти npm spec">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час подальших запусків `update <id>`.

    Для npm встановлень ви також можете передати явну специфікацію npm пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює цей установлений плагін і записує нову npm специфікацію для майбутніх оновлень на основі id.

    Передавання назви npm пакета без версії або тегу також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено на точній версії, і ви хочете повернути його до типової лінії релізів реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передаєте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи npm і ClawHub плагінів типової лінії спочатку пробують `@beta`, а потім повертаються до записаної типової/latest специфікації, якщо beta-релізу плагіна не існує. Точні версії та явні теги залишаються закріпленими на цьому селекторі.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm оновленням OpenClaw перевіряє встановлену версію пакета щодо метаданих npm реєстру. Якщо встановлена версія та записана ідентичність артефакта вже відповідають вирішеній цілі, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності й хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф npm артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із забороною, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний обхід для хибних спрацьовувань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики плагіна `before_install` або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP або LSP серверів без імпорту runtime-коду плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, інструменти, команди, служби, методи Gateway і HTTP маршрути. Runtime-інспекція повідомляє про відсутні залежності плагіна напряму; встановлення та виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

Команди CLI, що належать плагінам, установлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Докладніше про модель можливостей див. у [Формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає таблицю для всього набору з колонками форми, типів можливостей, сповіщень сумісності, можливостей пакета та зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфесту/виявлення та сповіщення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований плагін присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, перевірка конфігурації зберігає запис плагіна й повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, наприклад власника шляху або дозволи на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для ідентичності встановлених плагінів, увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпорту runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для екстреного відновлення запуску, поки розгортається міграція.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях маркетплейсу, шлях `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить мітку розв’язаного джерела, а також розібраний маніфест маркетплейсу й записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Plugin спільноти](/uk/plugins/community)
