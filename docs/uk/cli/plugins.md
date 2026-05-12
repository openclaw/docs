---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете діагностувати помилки завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-12T08:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin для Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей Plugin.
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
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутуючі операції життєвого циклу Plugin вимкнено. Використовуйте джерело Nix для цього встановлення замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте agent-first [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані Plugin постачаються з OpenClaw. Деякі увімкнено за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin OpenClaw мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід списку/інформації також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Установлення

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

Супровідники, які тестують встановлення під час налаштування, можуть перевизначати автоматичні джерела встановлення Plugin
за допомогою захищених змінних середовища. Див.
[Перевизначення встановлення Plugin](/uk/plugins/install-overrides).

<Warning>
Голі назви пакетів за замовчуванням встановлюються з npm під час перехідного запуску. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення Plugin як до запуску коду. Віддавайте перевагу зафіксованим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів Plugin і виводить
готові до встановлення назви пакетів. Пошук охоплює пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub skills.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості Plugin. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Пакети Plugin,
що належать OpenClaw і мають формат `@openclaw/*`, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення та оновлення з бета-каналу надають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі includes, масиви include та includes із сусідніми перевизначеннями завершуються закрито замість розгортання. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація Plugin завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для Plugin, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне посилання git, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне зафіксоване джерело. Він не підтримується з `--marketplace`, оскільки встановлення marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибнопозитивних спрацювань у вбудованому сканері небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить помилки сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками видавця в [ClawHub](/uk/clawhub/security).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування npm install. Керовані npm-корені Plugin успадковують npm `overrides` рівня пакета OpenClaw, тому захисні фіксації хоста застосовуються і до піднятих залежностей Plugin.

    Використовуйте `npm:<package>`, коли хочете зробити npm-резолюцію явною. Голі package specs також встановлюються напряму з npm під час перехідного запуску.

    Голі specs і `@latest` залишаються на стабільній гілці. Версії виправлень OpenClaw із датою, як-от `2026.5.3-1`, є стабільними випусками для цієї перевірки. Якщо npm резолвить будь-яку з них у prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, як-от `@beta`/`@rc`, або точної prerelease-версії, як-от `@1.2.3-beta.4`.

    Якщо голий install spec збігається з офіційним id Plugin (наприклад, `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають URL-адреси клонування `git:github.com/owner/repo`, `git:owner/repo`, повні `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Встановлення Git клонують у тимчасовий каталог, переходять на запитаний ref, якщо він наявний, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення пакетним менеджером і записи встановлення поводяться як під час встановлень npm. Записані встановлення git містять URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, як-от методи gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin OpenClaw мають містити дійсний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете
    протестувати той самий керований шлях встановлення npm-root, який використовують реєстрові встановлення,
    включно з перевіркою `package-lock.json`, скануванням піднятих залежностей і
    записами встановлення npm. Звичайні шляхи архівів усе ще встановлюються як локальні архіви
    під коренем plugin extensions.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-safe specs Plugin за замовчуванням встановлюються з npm під час перехідного запуску:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити npm-only резолюцію явною:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність API Plugin / мінімальну сумісність Gateway перед інсталяцією. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакту, а потім інсталює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack досі інсталюються через застарілий шлях перевірки архіву пакета. Записані інсталяції зберігають свої вихідні метадані ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти дайджесту ClawPack для подальших оновлень.
Неверсіоновані інсталяції ClawHub зберігають неверсіоновану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення маркетплейсу

Використовуйте скорочення `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли потрібно явно передати джерело маркетплейсу:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела маркетплейсу">
    - назва відомого маркетплейсу Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь маркетплейсу або шлях до `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела Plugin, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- пакети, сумісні з Codex (`.codex-plugin/plugin.json`)
- пакети, сумісні з Claude (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- пакети, сумісні з Cursor (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети інсталюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакета, командні Skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, командні Skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не під’єднані до виконання під час роботи.
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
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний інвентар разом із діагностикою реєстру та станом інсталяції залежностей пакета.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із запасним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи Plugin інстальовано, увімкнено та видно для планування холодного запуску, але це не live-зонд часу виконання вже запущеного процесу Gateway. Після зміни коду Plugin, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, що обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/container-розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного Plugin з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного шляху пошуку Node `node_modules` для Plugin; він
не імпортує runtime-код Plugin, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не інсталює пакети й не завантажує runtime-код Plugin. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, підсумок і
підказку для інсталяції, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим Plugin усередині запакованого Docker-образу змонтуйте каталог
джерела Plugin поверх відповідного запакованого шляху джерела, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване джерельне
накладання перед `/app/dist/extensions/synology-chat`; звичайний скопійований джерельний
каталог залишається неактивним, тож звичайні запаковані інсталяції все одно використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженим модулем. Runtime-інспекція ніколи не інсталює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані Plugin, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та стан RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки зв’язані інсталяції повторно використовують шлях джерела замість копіювання поверх керованої цілі інсталяції.

Використовуйте `--pin` для npm-інсталяцій, щоб зберегти вирішену точну специфікацію (`name@version`) у керованому індексі Plugin, зберігаючи стандартну поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані інсталяції Plugin — це стан, керований машиною, а не користувацька конфігурація. Інсталяції та оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих інсталяції, зокрема записів для зламаних або відсутніх маніфестів Plugin. Масив `plugins` — це кеш холодного реєстру, виведений із маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, деінсталяцією, діагностикою й холодним реєстром Plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, runtime-читання трактують їх як вхід сумісності без перезапису `openclaw.json`. Явні записи Plugin і `openclaw doctor --fix` переміщують ці записи в індекс Plugin і видаляють ключ конфігурації, коли записи конфігурації дозволені; якщо будь-який із записів не вдається, записи конфігурації зберігаються, щоб метадані інсталяції не були втрачені.

### Деінсталяція

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів allow/deny-списків Plugin і зв’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, деінсталяція також видаляє відстежуваний керований каталог інсталяції, коли він розташований усередині кореня розширень Plugin OpenClaw. Для Plugin активної пам’яті слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних інсталяцій Plugin у керованому індексі Plugin і відстежуваних інсталяцій hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Вирішення id Plugin проти npm-специфікації">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію інсталяції для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час пізніших запусків `update <id>`.

    Для npm-інсталяцій ви також можете передати явну npm-специфікацію пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом Plugin, оновлює цей інстальований Plugin і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передання назви npm-пакета без версії або тегу також зіставляється назад із відстежуваним записом Plugin. Використовуйте це, коли Plugin було закріплено за точною версією і ви хочете повернути його до стандартної лінії релізів реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію Plugin, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи npm і Plugin ClawHub стандартної лінії спершу пробують `@beta`, а потім повертаються до записаної default/latest-специфікації, якщо beta-релізу Plugin не існує. Про такий fallback повідомляється як про попередження, і він не призводить до збою оновлення ядра. Точні версії та явні теги залишаються закріпленими за цим селектором.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед live npm-оновленням OpenClaw перевіряє інстальовану версію пакета щодо метаданих npm-реєстру. Якщо інстальована версія та записана ідентичність артефакту вже відповідають вирішеній цілі, оновлення пропускається без завантаження, повторної інсталяції або перезапису `openclaw.json`.

    Коли існує збережений integrity-хеш і хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із закритою відмовою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він досі не обходить блокування політики Plugin `before_install` або блокування через збій сканування, і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані інсталяції, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту runtime Plugin за замовчуванням. Додайте `--runtime`, щоб завантажити модуль Plugin і включити зареєстровані хуки, інструменти, команди, служби, методи gateway та HTTP-маршрути. Runtime-інспекція повідомляє про відсутні залежності Plugin безпосередньо; інсталяції та ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє Plugin, зазвичай інсталюються як кореневі групи команд `openclaw`, але Plugin також можуть реєструвати вкладені команди під основним батьківським елементом, як-от `openclaw nodes`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запустіть її за вказаним шляхом; наприклад, Plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час роботи:

- **проста capability** — один тип capability (наприклад, plugin лише для провайдера)
- **гібридна capability** — кілька типів capability (наприклад, текст + мовлення + зображення)
- **лише hook** — лише hooks, без capabilities або surfaces
- **без capability** — інструменти/команди/служби, але без capabilities

Докладніше про модель capability див. у розділі [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинно-читний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з формою, видами capability, повідомленнями про сумісність, capabilities бандла та стовпцями з підсумком hooks. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, діагностику маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований plugin є на диску, але заблокований перевірками безпеки шляхів у завантажувачі, перевірка конфігурації зберігає запис plugin і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого plugin, наприклад права власності на шлях або дозволи на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати до діагностичного виводу стислий підсумок форми експорту.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр plugin — це збережена модель холодного читання OpenClaw для ідентичності встановлених plugin, увімкнення, метаданих джерела та власності на внески. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація plugin можуть читати його без імпорту модулів runtime plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях runtime-активації.

`openclaw doctor --fix` також виправляє керований npm-дрейф поруч із реєстром: якщо осиротілий або відновлений пакет `@openclaw/*` під керованим npm-коренем plugin затіняє вбудований plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом. Doctor також повторно зв'язує пакет хоста `openclaw` у керовані npm plugins, які оголошують `peerDependencies.openclaw`, щоб локальні для пакета runtime-імпорти, як-от `openclaw/plugin-sdk/*`, розв'язувалися після оновлень або npm-відновлень.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-механізм призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розпізнану мітку джерела, а також розібраний маніфест marketplace і записи plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [ClawHub](/uk/clawhub)
