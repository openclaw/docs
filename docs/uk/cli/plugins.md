---
read_when:
    - Ви хочете встановити Plugin-и Gateway або керувати ними чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T21:05:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48583cb22363837cf95ebc4de6f688f72921347240ac5cf228c20f9a6c5237fd
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin для Gateway, пакетами хуків і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Manage plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності bundle.
  </Card>
  <Card title="Plugin manifest" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Security" href="/uk/gateway/security">
    Посилення безпеки для встановлення plugins.
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
Вбудовані plugins постачаються разом з OpenClaw. Деякі увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні bundles натомість використовують власні маніфести bundle.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) і виявлені можливості bundle.
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
Голі імена пакетів під час перехідного запуску за замовчуванням встановлюються з npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugin і виводить
імена пакетів, готові до встановлення. Пошук охоплює пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для Skills ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості plugins. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Пакети plugin
`@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар plugins](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-каналу надають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла й залишають `openclaw.json` без змін. Кореневі includes, масиви include та includes із сусідніми перевизначеннями завершуються закрито, а не розгортаються. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє спершу запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin, щоб інші канали та plugins могли продовжити роботу; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих plugins, які явно підключають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений plugin або пакет хуків на місці. Використовуйте це, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо запустити `plugins install` для id plugin, який уже встановлено, OpenClaw зупиниться й спрямує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явне git-посилання, як-от `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки встановлення marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацьовувань вбудованого сканера небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики hook plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills ClawHub.

    Якщо plugin, який ви опублікували на ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і вмикання окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (ім'я пакета + необов'язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver-діапазони відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` заради безпеки, навіть якщо ваша оболонка має глобальні налаштування npm install.

    Використовуйте `npm:<package>`, коли хочете явно вказати розв'язання через npm. Голі specs пакетів також установлюються безпосередньо з npm під час перехідного запуску.

    Голі specs і `@latest` залишаються на стабільній гілці. Якщо npm розв'язує будь-що з цього до prerelease, OpenClaw зупиняється й просить явно погодитися через prerelease-тег, як-от `@beta`/`@rc`, або точну prerelease-версію, як-от `@1.2.3-beta.4`.

    Якщо голий install spec збігається з офіційним id plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб установити npm-пакет з такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні clone URL `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або commit.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо він наявний, а потім використовують звичайний інсталятор каталогу plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як у npm-встановленнях. Записані git-встановлення включають вихідний URL/ref і розв'язаний commit, щоб `openclaw plugins update` міг пізніше повторно розв'язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних plugin OpenClaw мають містити дійсний `openclaw.plugin.json` у корені витягнутого plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення marketplace Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-безпечні specs plugin під час перехідного запуску за замовчуванням встановлюються з npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб явно вказати розв'язання лише через npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлену сумісність plugin API / мінімального gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest header ClawHub і digest артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack досі встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти ClawPack digest для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими на цьому селекторі.

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
  <Tab title="Джерела marketplace">
    - назва відомого Claude marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутьові джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не під’єднані до виконання під час роботи.
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
  Показати лише ввімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на докладні рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинночитний інвентар, а також діагностика реєстру та стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр плагінів, із резервним варіантом, похідним лише від маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін встановлений, увімкнений і видимий для планування холодного запуску, але це не живий runtime-зонд уже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` та `optionalDependencies`. OpenClaw перевіряє, чи наявні ці назви
пакетів у звичайному для плагіна шляху пошуку Node `node_modules`; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, підсумок і
підказку для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з bundled plugin усередині запакованого Docker-образу примонтуйте каталог
джерел плагіна поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання
джерел перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог
джерел залишиться неактивним, тож нормальні запаковані встановлення й далі використовуватимуть скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженим модулем. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані плагіни.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та стан RPC.
- Небандловані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` під час npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно-керований стан, а не конфігурація користувача. Встановлення та оновлення записують його в `plugins/installs.json` в активному каталозі стану OpenClaw. Його карта верхнього рівня `installRecords` є довготривалим джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це похідний від маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром плагінів.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переміщує їх до індексу плагінів і видаляє ключ конфігурації; якщо будь-який із записів не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів allow/deny list плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, uninstall також видаляє відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id плагіна порівняно з npm spec">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, такі як `@beta`, і точні закріплені версії й надалі використовуються під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє назву цього пакета з відстежуваним записом плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тега також зіставляється з відстежуваним записом плагіна. Використовуйте це, коли плагін був закріплений на точній версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи npm і ClawHub плагінів типової лінії спочатку пробують `@beta`, а потім повертаються до записаної default/latest специфікації, якщо beta-випуску плагіна не існує. Точні версії та явні теги залишаються закріпленими за цим селектором.

  </Accordion>
  <Accordion title="Перевірки версій і зсув цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія та записана ідентичність артефакта вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений integrity hash і hash отриманого артефакта змінюється, OpenClaw трактує це як зсув npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний hashes та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення fail closed, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний для `plugins update` як аварійне перевизначення хибних спрацьовувань вбудованого сканування небезпечного коду під час оновлень плагінів. Він все одно не обходить блокування політик `before_install` плагіна або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP або LSP-сервера без імпорту runtime плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, інструменти, команди, служби, методи Gateway та HTTP-маршрути. Runtime-інспекція повідомляє про відсутні залежності плагіна напряму; встановлення та ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать плагінам, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машинночитний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з формою, видами можливостей, повідомленнями про сумісність, можливостями пакетів і колонками підсумку хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити стислий підсумок форми експорту в діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена в OpenClaw холодна модель читання для ідентичності встановлених плагінів, увімкнення, метаданих джерел і володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналів та інвентар плагінів можуть читати його без імпорту runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, політики конфігурації та метаданих маніфестів/пакетів. Це шлях ремонту, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для екстреного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях маркетплейсу, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить мітку визначеного джерела разом із розібраним маніфестом маркетплейсу та записами плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідка CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
