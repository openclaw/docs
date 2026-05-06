---
read_when:
    - Ви хочете встановлювати плагіни Gateway чи сумісні бандли або керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T10:07:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c888d3fc8de0e25edc1c38f679d522a4e75cb09d986702451e29418d70a939f2
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, наборами хуків і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності bundles.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
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

Для дослідження повільного встановлення, перевірки, видалення або оновлення реєстру виконайте
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні bundles натомість використовують власні маніфести bundles.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) та виявлені можливості bundle.
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
Голі назви пакетів під час запускного переходу встановлюються з npm за замовчуванням. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugins і виводить
готові до встановлення назви пакетів. Пошук охоплює пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub skills.

<Note>
ClawHub є основною поверхнею поширення й виявлення для більшості plugins. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Належні OpenClaw
пакети plugins `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-каналу надають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення invalid-config">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі includes, масиви includes та includes із сусідніми перевизначеннями завершуються закрито замість сплющення. Див. [Config includes](/uk/gateway/configuration) для підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє спершу виконати `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація plugin завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого plugin для plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений plugin або набір хуків на місці. Використовуйте його, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне git-посилання, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацювань у вбудованому сканері небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики хуків `before_install` plugin і **не** обходить збої сканування.

    Цей CLI-прапорець застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills з ClawHub.

    Якщо plugin, який ви опублікували на ClawHub, блокується скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Набори хуків і npm specs">
    `plugins install` також є поверхнею встановлення для наборів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver-діапазони відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm. Керовані npm-корені plugins успадковують npm `overrides` рівня пакета OpenClaw, тож захисні закріплення хоста також застосовуються до піднятих залежностей plugin.

    Використовуйте `npm:<package>`, коли хочете зробити npm-розв’язання явним. Голі specs пакетів також встановлюються напряму з npm під час запускного переходу.

    Голі specs і `@latest` залишаються на стабільному треку. Датовані корекційні версії OpenClaw, як-от `2026.5.3-1`, для цієї перевірки є стабільними релізами. Якщо npm розв’язує будь-який із них у prerelease, OpenClaw зупиняється й просить явно погодитися через prerelease-тег, наприклад `@beta`/`@rc`, або точну prerelease-версію, наприклад `@1.2.3-beta.4`.

    Якщо голий install spec збігається з офіційним id plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення напряму з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на branch, tag або commit.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитане ref, якщо воно наявне, а потім використовують звичайний інсталятор каталогу plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/ref джерела плюс розв’язаний commit, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і CLI-команди. Якщо plugin зареєстрував CLI root через `api.registerCli`, виконайте цю команду напряму через root CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw plugin мають містити чинний `openclaw.plugin.json` у корені розпакованого plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є npm-pack tarball і ви хочете
    протестувати той самий керований шлях встановлення npm-root, який використовується реєстровими встановленнями,
    включно з перевіркою `package-lock.json`, скануванням піднятих залежностей і
    записами встановлення npm. Звичайні шляхи архівів усе ще встановлюються як локальні архіви
    під коренем extensions plugin.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-безпечні specs plugin встановлюються з npm за замовчуванням під час запускного переходу:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити npm-only розв’язання явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлену сумісність plugin API / мінімального gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими на цьому селекторі.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
    - локальний корінь маркетплейсу або шлях до `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів не у вигляді шляхів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типове компонування компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються навички пакетів, командні навички Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, командні навички Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання в runtime.
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
  Показати лише увімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на деталізовані рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний інвентар разом із діагностикою реєстру та станом встановлення залежностей пакетів.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із резервним варіантом, похідним лише від маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін встановлено, увімкнено та видимо для планування холодного запуску, але це не live-перевірка runtime уже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` містить `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
присутні вздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, короткий опис і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим плагіном усередині запакованого образу Docker змонтуйте каталог
джерельного коду плагіна поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання джерел
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерел
залишається неактивним, тож звичайні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані плагіни, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки сервісу/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи стандартну поведінку незакріпленою.
</Note>

### Індекс плагінів

Метадані встановлення плагінів — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують їх до `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це похідний від маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром плагінів.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у конфігурації, він переміщує їх до індексу плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів списку дозволених/заборонених плагінів і пов’язаних записів `plugins.load.paths`, коли застосовно. Якщо не задано `--keep-files`, видалення також видаляє відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень пакетів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id плагіна проти npm-специфікації">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тега також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено на точній версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлення OpenClaw: на beta-каналі npm-записи стандартної лінії та записи плагінів ClawHub спочатку пробують `@beta`, а потім повертаються до записаної default/latest-специфікації, якщо beta-випуску плагіна немає. Точні версії та явні теги залишаються закріпленими на цьому селекторі.

  </Accordion>
  <Accordion title="Перевірки версії та відхилення цілісності">
    Перед live npm-оновленням OpenClaw перевіряє встановлену версію пакета відносно метаданих npm-реєстру. Якщо встановлена версія та записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли збережений хеш цілісності існує, а хеш отриманого артефакту змінюється, OpenClaw розглядає це як відхилення npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із закритою відмовою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики `before_install` плагіна або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Інспекція показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапори політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту runtime плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, інструменти, команди, сервіси, методи gateway та HTTP-маршрути. Runtime-інспекція напряму повідомляє про відсутні залежності плагіна; встановлення й виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать плагінам, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливості (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми плагінів](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапор `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` рендерить таблицю для всього парку з колонками форми, типів можливостей, повідомлень про сумісність, можливостей пакета та зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він виводить `No plugin issues detected.`

Якщо налаштований плагін присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, валідація конфігурації зберігає запис плагіна й повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, наприклад право власності на шлях або права запису для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена в OpenClaw холодна модель читання для ідентичності встановлених Plugin, їх увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту модулів runtime Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях runtime-активації.

`openclaw doctor --fix` також виправляє суміжний із реєстром дрейф керованого npm: якщо осиротілий або відновлений пакет `@openclaw/*` у корені npm керованого Plugin затіняє вбудований Plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-механізм призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейса приймає локальний шлях до маркетплейса, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить визначену мітку джерела, а також розібраний маніфест маркетплейса й записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Plugin спільноти](/uk/plugins/community)
